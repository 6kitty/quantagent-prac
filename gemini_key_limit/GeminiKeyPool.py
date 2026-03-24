"""
gemini_pool.py  —  Gemini API Key Rotation Pool
pip install google-generativeai python-dotenv
"""
import os, time, logging
from itertools import cycle
from threading import Lock
from typing import Optional
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
logger = logging.getLogger(__name__)

# ─── Key Pool 로드 ────────────────────────────────────────
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
    logger.info(f"Gemini Key Pool: {len(keys)}개 로드됨")
    return keys

class GeminiKeyPool:
    """Thread-safe Gemini API Key Rotation Pool"""

    def __init__(self, model_name: str = "gemini-2.0-flash-lite"):
        self._keys       = _load_keys()
        self._pool       = cycle(self._keys)
        self._lock       = Lock()
        self._model_name = model_name
        self._current    = next(self._pool)
        self._exhausted: set[str] = set()

    def _next_key(self) -> Optional[str]:
        """다음 유효한 키 반환. 모두 소진 시 None"""
        with self._lock:
            tried = 0
            while tried < len(self._keys):
                key = next(self._pool)
                if key not in self._exhausted:
                    self._current = key
                    return key
                tried += 1
            return None

    def generate(self, prompt: str, max_retries: int = None) -> str:
        """
        Rate Limit 발생 시 자동으로 다음 키로 교체 후 재시도
        max_retries 기본값 = 보유 키 수
        """
        if max_retries is None:
            max_retries = len(self._keys)

        last_error = None
        for attempt in range(max_retries):
            current_key = self._current
            try:
                genai.configure(api_key=current_key)
                model = genai.GenerativeModel(self._model_name)
                response = model.generate_content(prompt)
                return response.text

            except Exception as e:
                err_str = str(e)
                # Rate Limit 감지
                if any(x in err_str for x in ["429", "RESOURCE_EXHAUSTED",
                                                "quota", "rate limit"]):
                    logger.warning(f"Rate limit (키 #{self._keys.index(current_key)+1}) "
                                   f"→ 다음 키로 교체")
                    self._exhausted.add(current_key)
                    next_key = self._next_key()
                    if next_key is None:
                        logger.error("모든 API 키 소진 → 60초 대기 후 재시도")
                        self._exhausted.clear()  # 리셋 (1분 후 다시 사용 가능)
                        time.sleep(60)
                        self._next_key()
                    time.sleep(1)
                    last_error = e
                else:
                    raise  # 다른 에러는 그대로 전파

        raise Exception(f"모든 재시도 실패. 마지막 오류: {last_error}")

    def get_status(self) -> dict:
        return {
            "total_keys":     len(self._keys),
            "exhausted_keys": len(self._exhausted),
            "active_keys":    len(self._keys) - len(self._exhausted),
            "current_key_idx": self._keys.index(self._current) + 1,
        }

# ─── 전역 인스턴스 (싱글톤) ──────────────────────────────
_pool_instance: Optional[GeminiKeyPool] = None

def get_gemini_pool() -> GeminiKeyPool:
    global _pool_instance
    if _pool_instance is None:
        _pool_instance = GeminiKeyPool()
    return _pool_instance

# ─── LangChain LLM Wrapper (에이전트 연동) ───────────────
from langchain_core.language_models import BaseLLM
from langchain_core.outputs import LLMResult, Generation

class GeminiPoolLLM(BaseLLM):
    """LangChain에서 Key Pool을 사용하는 Gemini LLM"""
    pool: GeminiKeyPool = None

    class Config:
        arbitrary_types_allowed = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.pool = get_gemini_pool()

    def _generate(self, prompts, stop=None, **kwargs) -> LLMResult:
        generations = []
        for prompt in prompts:
            text = self.pool.generate(prompt)
            generations.append([Generation(text=text)])
        return LLMResult(generations=generations)

    @property
    def _llm_type(self) -> str:
        return "gemini_pool"

# ─── 테스트 실행 ──────────────────────────────────────────
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    pool = get_gemini_pool()

    # 반복 호출로 Rate Limit 테스트
    for i in range(20):
        try:
            result = pool.generate(f"삼성전자 투자 의견 한 줄 요약 #{i+1}")
            print(f"[{i+1}] {result[:60]}...")
            status = pool.get_status()
            print(f"     Key 상태: {status}")
        except Exception as e:
            print(f"[{i+1}] 오류: {e}")
        time.sleep(0.5)
