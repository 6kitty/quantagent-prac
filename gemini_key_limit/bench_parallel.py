"""
bench_parallel.py — Gemini Key Pool 병렬 처리 성능 실험

Sequential vs ThreadPoolExecutor vs asyncio 방식 비교
각 방식의 처리량(req/min)과 키 분산도를 측정한다.

google.genai 패키지 사용 (google.generativeai는 deprecated)
→ Client(api_key=...) 인스턴스 기반이라 thread-safe
"""
import os, sys, time, asyncio, statistics, threading
from dataclasses import dataclass, field
from collections import defaultdict

from dotenv import load_dotenv
from google import genai

load_dotenv()

MODEL_NAME = "gemini-2.0-flash"

# ─── 공통 유틸 ────────────────────────────────────────────

def _load_keys() -> list[str]:
    keys = []
    i = 1
    while True:
        key = os.getenv(f"GEMINI_API_KEY_{i}")
        if not key:
            break
        keys.append(key)
        i += 1
    if not keys:
        raise ValueError("GEMINI_API_KEY_1 이상 환경변수 필요")
    print(f"[설정] API 키 {len(keys)}개 로드 / 모델: {MODEL_NAME}")
    return keys


PROMPTS = [
    f"한국 주식시장 투자 전략 핵심 한 줄 #{i+1}" for i in range(10)
]

# 15 RPM = 4초/req — sequential에서 rate limit 방지용
SEQ_DELAY = 4.5


@dataclass
class BenchResult:
    mode: str
    n_workers: int
    total_requests: int
    success: int = 0
    failed: int = 0
    total_sec: float = 0.0
    latencies: list[float] = field(default_factory=list)
    key_usage: dict = field(default_factory=lambda: defaultdict(int))

    @property
    def rpm(self) -> float:
        return (self.success / self.total_sec) * 60 if self.total_sec > 0 else 0.0

    @property
    def avg_latency(self) -> float:
        return statistics.mean(self.latencies) if self.latencies else 0.0

    def summary(self) -> str:
        return (
            f"[{self.mode:22s}] workers={self.n_workers:2d} | "
            f"성공={self.success:3d}/{self.total_requests} | "
            f"소요={self.total_sec:6.1f}s | "
            f"처리량={self.rpm:6.1f} req/min | "
            f"평균지연={self.avg_latency:.2f}s"
        )


# ─── 공통: 429 retry with key rotation ───────────────────

def _request_with_rotation(clients: list[genai.Client], prompt: str,
                            start_idx: int = 0) -> tuple[bool, float, int]:
    """
    429 발생 시 다음 키로 자동 교체.
    반환: (성공여부, 소요시간, 사용된_key_idx)
    """
    n = len(clients)
    for attempt in range(n):
        idx = (start_idx + attempt) % n
        try:
            t0 = time.perf_counter()
            clients[idx].models.generate_content(model=MODEL_NAME, contents=prompt)
            return True, time.perf_counter() - t0, idx
        except Exception as e:
            msg = str(e)
            if "429" in msg or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
                # 다음 키로 재시도
                continue
            print(f"\n  [오류] {type(e).__name__}: {msg[:100]}")
            return False, 0.0, idx
    # 모든 키 소진 → 60초 대기 후 1회 재시도
    print("\n  [경고] 모든 키 소진 → 60초 대기...")
    time.sleep(60)
    try:
        t0 = time.perf_counter()
        clients[start_idx % n].models.generate_content(model=MODEL_NAME, contents=prompt)
        return True, time.perf_counter() - t0, start_idx % n
    except Exception as e:
        print(f"\n  [실패] {str(e)[:100]}")
        return False, 0.0, start_idx % n


# ─── 방식 1: Sequential ───────────────────────────────────

def bench_sequential(keys: list[str], prompts: list[str]) -> BenchResult:
    result = BenchResult(mode="Sequential", n_workers=1, total_requests=len(prompts))
    clients = [genai.Client(api_key=k) for k in keys]

    start_wall = time.perf_counter()
    for i, prompt in enumerate(prompts):
        ok, lat, key_idx = _request_with_rotation(clients, prompt, start_idx=i)
        if ok:
            result.success += 1
            result.latencies.append(lat)
            result.key_usage[f"key_{key_idx + 1}"] += 1
        else:
            result.failed += 1
        print(f"  sequential [{i+1:2d}/{len(prompts)}] {'✓' if ok else '✗'} {lat:.2f}s  (다음까지 {SEQ_DELAY}s 대기)", end="\r")
        time.sleep(SEQ_DELAY)

    result.total_sec = time.perf_counter() - start_wall
    print()
    return result


# ─── 방식 2: ThreadPoolExecutor (키 1개 = 스레드 1개) ─────

def _worker_thread(key_idx: int, clients: list[genai.Client],
                   assigned_prompts: list[str],
                   result: BenchResult, lock: threading.Lock) -> None:
    for prompt in assigned_prompts:
        ok, lat, used_idx = _request_with_rotation(clients, prompt, start_idx=key_idx)
        with lock:
            if ok:
                result.success += 1
                result.latencies.append(lat)
                result.key_usage[f"key_{used_idx + 1}"] += 1
            else:
                result.failed += 1


def bench_threaded(keys: list[str], prompts: list[str]) -> BenchResult:
    n_workers = len(keys)
    result = BenchResult(mode=f"ThreadPool(N={n_workers})",
                         n_workers=n_workers, total_requests=len(prompts))
    lock = threading.Lock()
    clients = [genai.Client(api_key=k) for k in keys]
    chunks = [prompts[i::n_workers] for i in range(n_workers)]

    start_wall = time.perf_counter()
    threads = [
        threading.Thread(target=_worker_thread, args=(i, clients, chunk, result, lock))
        for i, chunk in enumerate(chunks)
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    result.total_sec = time.perf_counter() - start_wall
    return result


# ─── 방식 3: asyncio ──────────────────────────────────────

async def _async_request(clients: list[genai.Client], key_idx: int, prompt: str,
                         sem: asyncio.Semaphore) -> tuple[bool, float, int]:
    n = len(clients)
    async with sem:
        for attempt in range(n):
            idx = (key_idx + attempt) % n
            try:
                start = time.perf_counter()
                await clients[idx].aio.models.generate_content(model=MODEL_NAME, contents=prompt)
                return True, time.perf_counter() - start, idx
            except Exception as e:
                msg = str(e)
                if "429" in msg or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
                    continue
                print(f"\n  async 오류: {msg[:100]}")
                return False, 0.0, idx
        return False, 0.0, key_idx


async def _run_async(keys: list[str], prompts: list[str]) -> BenchResult:
    n_workers = len(keys)
    result = BenchResult(mode=f"asyncio(N={n_workers})",
                         n_workers=n_workers, total_requests=len(prompts))
    clients = [genai.Client(api_key=k) for k in keys]
    sem = asyncio.Semaphore(n_workers)

    tasks = [
        _async_request(clients, i % len(keys), prompt, sem)
        for i, prompt in enumerate(prompts)
    ]
    start_wall = time.perf_counter()
    responses = await asyncio.gather(*tasks)
    result.total_sec = time.perf_counter() - start_wall

    for ok, lat, key_idx in responses:
        if ok:
            result.success += 1
            result.latencies.append(lat)
            result.key_usage[f"key_{key_idx + 1}"] += 1
        else:
            result.failed += 1
    return result


def bench_async(keys: list[str], prompts: list[str]) -> BenchResult:
    return asyncio.run(_run_async(keys, prompts))


# ─── 결과 출력 ────────────────────────────────────────────

def print_results(results: list[BenchResult]) -> None:
    print("\n" + "=" * 74)
    print("  벤치마크 결과 요약")
    print("=" * 74)
    for r in results:
        print(r.summary())

    print("\n  키별 요청 분산")
    print("-" * 74)
    for r in results:
        dist = dict(sorted(r.key_usage.items()))
        print(f"  [{r.mode:22s}] {dist}")

    if len(results) > 1:
        baseline = results[0].rpm
        print("\n  Sequential 대비 처리량 배수")
        print("-" * 74)
        for r in results:
            ratio = r.rpm / baseline if baseline > 0 else 0
            print(f"  [{r.mode:22s}] ×{ratio:.2f}")
    print("=" * 74)


def _try_plot(results: list[BenchResult]) -> None:
    try:
        import matplotlib.pyplot as plt
        import matplotlib
        matplotlib.use("Agg")

        labels = [r.mode for r in results]
        rpms   = [r.rpm for r in results]
        lats   = [r.avg_latency for r in results]
        colors = ["#4C72B0", "#DD8452", "#55A868"][:len(results)]

        fig, axes = plt.subplots(1, 2, figsize=(13, 5))

        for ax, values, title, ylabel in [
            (axes[0], rpms,  "처리량 (req/min)",    "req/min"),
            (axes[1], lats,  "평균 응답 지연 (초)", "seconds"),
        ]:
            bars = ax.bar(labels, values, color=colors)
            ax.set_title(title)
            ax.set_ylabel(ylabel)
            for bar, val in zip(bars, values):
                ax.text(bar.get_x() + bar.get_width() / 2,
                        bar.get_height() * 1.02,
                        f"{val:.2f}", ha="center", fontsize=10)

        n_keys = len(keys)
        plt.suptitle(f"Gemini Key Pool 병렬 처리 벤치마크  |  키 {n_keys}개 / {MODEL_NAME}")
        plt.tight_layout()
        out = "gemini_key_limit/bench_result.png"
        plt.savefig(out, dpi=150)
        print(f"\n  그래프 저장: {out}")
    except ImportError:
        print("\n  (matplotlib 없음 — 그래프 스킵)")


# ─── 메인 ─────────────────────────────────────────────────

if __name__ == "__main__":
    keys = _load_keys()
    prompts = PROMPTS

    print(f"\n{'='*74}")
    print(f"  실험 설정: {len(prompts)}개 요청 / {len(keys)}개 키")
    print(f"{'='*74}\n")

    results = []

    print("▶ [1/3] Sequential 실행 중...")
    results.append(bench_sequential(keys, prompts))
    print(f"  완료: {results[-1].summary()}\n")

    if len(keys) >= 2:
        print("▶ [2/3] ThreadPool 실행 중...")
        results.append(bench_threaded(keys, prompts))
        print(f"  완료: {results[-1].summary()}\n")

        print("▶ [3/3] asyncio 실행 중...")
        results.append(bench_async(keys, prompts))
        print(f"  완료: {results[-1].summary()}\n")
    else:
        print("  (키가 1개라 병렬 실험 스킵)\n")

    print_results(results)
    _try_plot(results)
