"""
PoC: 한경컨센서스 + WISEfn 컨센서스 데이터 수집 파이프라인
=====================================================
검증 항목:
  1. 한경컨센서스 - 리포트 목록 수집 (requests + BeautifulSoup)
  2. 한경컨센서스 - PDF 다운로드 + pdfplumber 텍스트 추출
  3. WISEfn       - 컨센서스 목표주가/투자의견 수집 (KRX SMILE 대체)
  4. 피처 계산    - llm_sentiment, revision_breadth, price_upside
  5. CANDIDATE_SCORE 계산

실행 방법:
  pip install requests beautifulsoup4 pdfplumber lxml
  python poc_data_collection.py

PoC 결과 (2026-04-06 기준):
  - 한경컨센서스: ✅ 로그인 없이 접근 가능, PDF 다운로드 가능
  - KRX SMILE: ❌ 로그인 필요 (대체: WISEfn 사용)
  - WISEfn: ✅ 로그인 없이 접근 가능, 컨센서스 집계값 JSON 파싱 가능
"""

import os
import sys
sys.stdout.reconfigure(encoding="utf-8")
import requests
from bs4 import BeautifulSoup
import pdfplumber
import re
import json
import io
from datetime import datetime, timedelta
from typing import Optional
from openai import AzureOpenAI, OpenAI
from pydantic import BaseModel, Field
from dotenv import load_dotenv
load_dotenv()

# ──────────────────────────────────────────────────────────
# LLM 클라이언트 설정
# 환경변수 우선, 없으면 하드코딩 자리 표시자
# ──────────────────────────────────────────────────────────
def _build_llm_client():
    """
    AOAI(Azure OpenAI) 또는 OpenAI 클라이언트를 반환합니다.

    AOAI 환경변수 (Azure 포털 '키 및 엔드포인트' 탭 기준):
        AOAI_KEY        - API 키 (KEY 1 또는 KEY 2)
        AOAI_ENDPOINT   - 엔드포인트 ex) https://YOUR-RESOURCE.openai.azure.com/
        AOAI_REGION     - 서비스 지역 ex) eastus
        AOAI_DEPLOYMENT - 배포 이름 ex) gpt-4o  (포털 > 배포 탭에서 확인)
        AOAI_API_VERSION- (선택) ex) 2024-08-01-preview, 기본값 사용 가능

    OpenAI 환경변수 (AOAI 없을 때 폴백):
        OPENAI_API_KEY
    """
    azure_key      = os.getenv("AOAI_KEY")
    azure_endpoint = os.getenv("AOAI_ENDPOINT")

    if azure_key and azure_endpoint:
        return AzureOpenAI(
            api_key=azure_key,
            azure_endpoint=azure_endpoint,
            api_version=os.getenv("AOAI_API_VERSION", "2024-08-01-preview"),
        ), os.getenv("AOAI_DEPLOYMENT", "gpt-4o"), "azure"

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        return OpenAI(api_key=openai_key), "gpt-4o", "openai"

    return None, None, None


LLM_CLIENT, LLM_DEPLOYMENT, LLM_BACKEND = _build_llm_client()


# ──────────────────────────────────────────────────────────
# 세션 설정
# ──────────────────────────────────────────────────────────
session = requests.Session()
session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9",
})


# ══════════════════════════════════════════════════════════
# SOURCE 1: 한경컨센서스
# URL:  https://consensus.hankyung.com/analysis/list
# 수집: 리포트 목록 (report_idx, 날짜, 제목, 투자의견, 목표주가)
# ══════════════════════════════════════════════════════════

def collect_hankyung_reports_by_type(
    ticker_code: str,
    ticker_name: str,
    report_type: str = "CO",
    days: int = 365,
) -> list[dict]:
    """
    한경컨센서스에서 report_type별 리포트를 전체 페이지 순회하며 수집합니다.

    Args:
        report_type: "CO"=전체기업, "UP"=상향, "DW"=하향

    Note:
        pagenum=80으로 한 번에 최대치를 가져오고, 반환 행이 80개면
        다음 페이지를 추가 요청합니다 (1y 기준 대부분 1페이지로 완료).
    """
    edate = datetime.today()
    sdate = edate - timedelta(days=days)
    reports = []

    for page in range(1, 20):  # 안전 상한
        r = session.get(
            "https://consensus.hankyung.com/analysis/list",
            params={
                "sdate": sdate.strftime("%Y-%m-%d"),
                "edate": edate.strftime("%Y-%m-%d"),
                "report_type": report_type,
                "pagenum": "80",
                "order_type": "",
                "now_page": str(page),
                "search_text": ticker_name,
                "business_code": ticker_code,
            },
            headers={"Referer": "https://consensus.hankyung.com/"},
            timeout=15,
        )
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        table = soup.find("table")
        if not table:
            break

        page_rows = []
        for row in table.find_all("tr")[1:]:
            cols = row.find_all("td")
            if len(cols) < 4:
                continue
            link = row.find("a", href=re.compile(r"downpdf"))
            if not link:
                continue
            m = re.search(r"report_idx=(\d+)", link.get("href", ""))
            if not m:
                continue
            page_rows.append({
                "report_idx":   m.group(1),
                "date":         cols[0].get_text(strip=True),
                "title":        link.get_text(strip=True),
                "target_price": cols[2].get_text(strip=True),
                "opinion":      cols[3].get_text(strip=True),
                "analyst":      cols[4].get_text(strip=True) if len(cols) > 4 else "",
                "broker":       cols[5].get_text(strip=True) if len(cols) > 5 else "",
            })

        reports.extend(page_rows)
        if len(page_rows) < 80:  # 마지막 페이지
            break

    return reports


def compute_revision_breadth(ticker_code: str, ticker_name: str, days: int = 365) -> dict:
    """
    올바른 revision_breadth 계산: upgrade_count / report_count_1y

    한경컨센서스의 report_type=UP/DW 필터를 이용합니다.
    UP 필터 = 이전 리포트 대비 투자의견이 상향된 리포트만 반환
    (ex: 중립→매수, 매도→중립 등)

    윈도우를 1y로 설정하는 이유:
      30d 기준은 분모가 1~3개로 너무 작아 종목 간 변별력이 없음
      (SK하이닉스 100%, NAVER 0% 같은 극단값 빈발)
      1y 기준에서 분모가 28~42개로 안정되어 의미있는 분포가 형성됨
    """
    all_rpts = collect_hankyung_reports_by_type(ticker_code, ticker_name, "CO", days)
    up_rpts  = collect_hankyung_reports_by_type(ticker_code, ticker_name, "UP", days)
    dw_rpts  = collect_hankyung_reports_by_type(ticker_code, ticker_name, "DW", days)

    n_all = len(all_rpts)
    n_up  = len(up_rpts)
    n_dw  = len(dw_rpts)

    return {
        "report_count_30d":  n_all,
        "upgrade_count":     n_up,
        "downgrade_count":   n_dw,
        "revision_breadth":  n_up / n_all if n_all > 0 else 0.0,
        "latest_reports":    all_rpts,
    }


def collect_hankyung_reports(
    ticker_code: str,
    ticker_name: str,
    days: int = 30,
    max_pages: int = 3,
) -> list[dict]:
    """
    한경컨센서스에서 특정 종목의 최근 리포트 목록을 수집합니다.

    Args:
        ticker_code: 종목코드 (예: "035420")
        ticker_name: 종목명 (검색용, 예: "NAVER")
        days:        최근 며칠치 수집
        max_pages:   최대 페이지 수

    Returns:
        리포트 딕셔너리 리스트
        [{"report_idx": "...", "date": "...", "title": "...",
          "target_price": "...", "opinion": "...",
          "analyst": "...", "broker": "..."}, ...]

    PoC 결과:
        - HTTP 200, 로그인 불필요
        - 종목별 필터링 가능 (search_text + business_code 파라미터)
        - 투자의견 필드: "Buy", "매수", "Not Rated", "중립" 등
    """
    edate = datetime.today()
    sdate = edate - timedelta(days=days)
    reports = []

    for page in range(1, max_pages + 1):
        params = {
            "sdate": sdate.strftime("%Y-%m-%d"),
            "edate": edate.strftime("%Y-%m-%d"),
            "report_type": "CO",        # 기업 리포트
            "order_type": "",
            "now_page": str(page),
            "search_text": ticker_name,
            "business_code": ticker_code,
        }
        r = session.get(
            "https://consensus.hankyung.com/analysis/list",
            params=params,
            headers={"Referer": "https://consensus.hankyung.com/"},
            timeout=15,
        )
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")

        table = soup.find("table")
        if not table:
            break

        rows = table.find_all("tr")[1:]  # 헤더 제외
        if not rows:
            break

        for row in rows:
            cols = row.find_all("td")
            if len(cols) < 4:
                continue

            link = row.find("a", href=re.compile(r"downpdf"))
            if not link:
                continue
            m = re.search(r"report_idx=(\d+)", link.get("href", ""))
            if not m:
                continue

            reports.append({
                "report_idx":   m.group(1),
                "date":         cols[0].get_text(strip=True),
                "title":        link.get_text(strip=True),
                "target_price": cols[2].get_text(strip=True),
                "opinion":      cols[3].get_text(strip=True),
                "analyst":      cols[4].get_text(strip=True) if len(cols) > 4 else "",
                "broker":       cols[5].get_text(strip=True) if len(cols) > 5 else "",
            })

    return reports


def download_and_extract_pdf(report_idx: str, max_pages: int = 5) -> str:
    """
    한경컨센서스 PDF를 다운로드하고 pdfplumber로 텍스트를 추출합니다.

    Args:
        report_idx: 리포트 고유 ID
        max_pages:  최대 추출 페이지 수

    Returns:
        추출된 텍스트 전문

    PoC 결과:
        - 직접 PDF 바이너리 응답 (Content-Type: Application/pdf)
        - 744 KB 수준, 5페이지 기준 ~10,000자 추출
        - 투자의견, 목표주가, 실적 테이블 텍스트 포함
    """
    pdf_url = f"https://consensus.hankyung.com/analysis/downpdf?report_idx={report_idx}"
    r = session.get(
        pdf_url,
        headers={"Referer": "https://consensus.hankyung.com/"},
        timeout=30,
    )
    r.raise_for_status()

    if "pdf" not in r.headers.get("Content-Type", "").lower():
        return ""

    text_parts = []
    with pdfplumber.open(io.BytesIO(r.content)) as pdf:
        for page in pdf.pages[:max_pages]:
            text = page.extract_text()
            if text:
                text_parts.append(text)

    return "\n".join(text_parts)


# ══════════════════════════════════════════════════════════
# FEATURE: llm_sentiment — AOAI GPT-4o structured output
# ══════════════════════════════════════════════════════════

# Structured output 스키마 (Pydantic → JSON Schema 자동 변환)
class ReportSentiment(BaseModel):
    """GPT-4o가 리포트 텍스트에서 추출하는 구조화 출력"""
    llm_sentiment: float = Field(
        description=(
            "리포트 전반의 투자 감성 점수. "
            "-1.0(매우 부정) ~ 0.0(중립) ~ +1.0(매우 긍정). "
            "투자의견 방향, 실적 전망, 목표주가 방향, 업황 판단을 종합하여 판단한다."
        ),
        ge=-1.0, le=1.0,
    )
    extraction_confidence: float = Field(
        description=(
            "감성 점수 추출의 신뢰도. "
            "0.0(판단 불가) ~ 1.0(명확히 추출). "
            "리포트가 명확한 투자의견과 근거를 제시할수록 높게, "
            "Not Rated이거나 텍스트가 불명확할수록 낮게 설정한다."
        ),
        ge=0.0, le=1.0,
    )
    opinion_direction: str = Field(
        description="투자의견 방향: '상향', '하향', '유지', '신규', '알수없음' 중 하나.",
    )
    key_reason: str = Field(
        description="감성 판단의 핵심 근거를 한 문장(30자 이내)으로 요약.",
    )


_SYSTEM_PROMPT = """
당신은 한국 주식 애널리스트 리포트에서 투자 감성을 추출하는 전문가입니다.

규칙:
1. llm_sentiment는 투자의견(매수/중립/매도) 뿐 아니라 실적 전망, 목표주가 방향,
   업황 판단, 리스크 언급 비중을 종합하여 판단합니다.
2. "Buy(유지)"처럼 유지이지만 긍정적 실적 전망이면 +0.6~+0.8 수준입니다.
3. "Buy(하향)"처럼 매수이지만 목표주가 하향이면 +0.3~+0.5로 낮춥니다.
4. Not Rated / 분석 불가 리포트는 llm_sentiment=0.0, extraction_confidence=0.3.
5. 반드시 JSON만 반환하고 설명 텍스트는 추가하지 않습니다.
""".strip()


def _extract_sentiment_with_llm(pdf_text: str) -> ReportSentiment:
    """AOAI GPT-4o structured output으로 감성 추출 (실제 LLM 호출)"""
    # 토큰 절약: 첫 3,000자만 사용 (핵심 요약이 앞부분에 집중됨)
    truncated = pdf_text[:3000]

    response = LLM_CLIENT.beta.chat.completions.parse(
        model=LLM_DEPLOYMENT,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": f"다음 애널리스트 리포트를 분석하세요:\n\n{truncated}"},
        ],
        response_format=ReportSentiment,
        temperature=0.0,   # 재현성 최대화
        max_tokens=256,
    )
    return response.choices[0].message.parsed


def _extract_sentiment_rule_based(pdf_text: str, opinion: str) -> ReportSentiment:
    """LLM 클라이언트 없을 때 사용하는 규칙 기반 폴백"""
    opinion_map = {
        "buy": 0.8, "strong buy": 1.0, "매수": 0.8, "강력매수": 1.0,
        "hold": 0.0, "neutral": 0.0, "중립": 0.0,
        "sell": -0.8, "매도": -0.8, "not rated": 0.0,
    }
    base = opinion_map.get(opinion.lower().strip(), 0.0)

    price_delta = 0.0
    if re.search(r"목표주가[^\n]{0,10}(상향|높)", pdf_text): price_delta = +0.2
    elif re.search(r"목표주가[^\n]{0,10}(하향|낮)", pdf_text): price_delta = -0.2

    pos = sum(0.05 for kw in ["상회","호조","성장","개선","수혜","확대"] if kw in pdf_text)
    neg = sum(0.05 for kw in ["하회","부진","우려","리스크","감소","둔화"] if kw in pdf_text)

    score = round(max(-1.0, min(1.0, base + price_delta + pos - neg)), 4)
    conf  = 0.75 if base != 0.0 else 0.40

    if re.search(r"(상향|업그레이드)", pdf_text):   direction = "상향"
    elif re.search(r"(하향|다운그레이드)", pdf_text): direction = "하향"
    elif re.search(r"유지", pdf_text):               direction = "유지"
    elif re.search(r"신규", pdf_text):               direction = "신규"
    else:                                             direction = "알수없음"

    return ReportSentiment(
        llm_sentiment=score,
        extraction_confidence=conf,
        opinion_direction=direction,
        key_reason="규칙 기반 추출 (LLM 미사용)",
    )


def compute_sentiment_features(pdf_text: str, opinion: str) -> dict:
    """
    리포트 텍스트에서 감성 피처를 계산합니다.

    LLM 클라이언트(AOAI/OpenAI)가 설정되어 있으면 GPT-4o structured output을,
    없으면 규칙 기반 폴백을 사용합니다.

    환경변수 설정 방법:
        # AOAI (Azure OpenAI)
        export AZURE_OPENAI_API_KEY="..."
        export AZURE_OPENAI_ENDPOINT="https://YOUR-RESOURCE.openai.azure.com/"
        export AZURE_OPENAI_DEPLOYMENT="gpt-4o"        # 배포 이름
        export AZURE_OPENAI_API_VERSION="2024-08-01-preview"

        # 또는 OpenAI 직접
        export OPENAI_API_KEY="sk-..."
    """
    if LLM_CLIENT is not None:
        try:
            result = _extract_sentiment_with_llm(pdf_text)
            source = f"gpt-4o ({LLM_BACKEND})"
        except Exception as e:
            print(f"  ⚠️  LLM 호출 실패 ({e}), 규칙 기반으로 폴백")
            result = _extract_sentiment_rule_based(pdf_text, opinion)
            source = "rule-based (fallback)"
    else:
        result = _extract_sentiment_rule_based(pdf_text, opinion)
        source = "rule-based (no API key)"

    return {
        "llm_sentiment":          result.llm_sentiment,
        "extraction_confidence":  result.extraction_confidence,
        "sentiment_x_confidence": round(result.llm_sentiment * result.extraction_confidence, 4),
        "opinion_direction":      result.opinion_direction,
        "key_reason":             result.key_reason,
        "source":                 source,
    }


# ══════════════════════════════════════════════════════════
# SOURCE 2: WISEfn (네이버증권 iframe) — KRX SMILE 대체
# URL:  https://navercomp.wisereport.co.kr/v2/company/c1010001.aspx
# 수집: price_upside, revision_breadth
#
# 참고: KRX SMILE (data.krx.co.kr 투자분석정보)은
#       회원가입/로그인 필요 (BLD API → 400 LOGOUT 응답)
#       WISEfn이 동일한 컨센서스 집계값을 로그인 없이 제공
# ══════════════════════════════════════════════════════════

def get_consensus_features(ticker_code: str) -> dict:
    """
    WISEfn(네이버증권)에서 컨센서스 집계 피처를 수집합니다.

    Args:
        ticker_code: 종목코드 (예: "005930")

    Returns:
        {
            "current_price":          float,  # 현재가 (원)
            "consensus_target_price": float,  # 컨센서스 평균 목표주가 (원)
            "price_upside":           float,  # (목표주가 - 현재가) / 현재가
            "revision_breadth":       float,  # 매수/강력매수 비율 (0~1)
            "opinion_count":          int,    # 분석가 수
        }

    PoC 결과:
        - HTTP 200, 로그인 불필요
        - JS 변수 chartData2/chartData3에 JSON 데이터 포함
        - 삼성전자: price_upside=38.7%, revision_breadth=100%
        - NAVER:    price_upside=72.6%, revision_breadth=94.7%
        - 카카오:   price_upside=76.9%, revision_breadth=100%
    """
    r = session.get(
        "https://navercomp.wisereport.co.kr/v2/company/c1010001.aspx",
        params={"cmp_cd": ticker_code, "target": "cnsltn"},
        headers={"Referer": "https://finance.naver.com"},
        timeout=15,
    )
    r.raise_for_status()
    text = r.text
    result: dict = {}

    # chartData2: 목표주가 추이 + 주가 추이
    m2 = re.search(r"var\s+chartData2\s*=\s*(\{[^;]+\});", text, re.DOTALL)
    if m2:
        d2 = json.loads(m2.group(1))
        tp_list = d2.get("target_price", [])
        cp_list = d2.get("close_price", [])
        if tp_list and cp_list:
            tp = tp_list[-1]["y"]   # 최신 평균 목표주가
            cp = cp_list[-1]["y"]   # 최신 종가
            result["current_price"]          = cp
            result["consensus_target_price"] = tp
            result["price_upside"]           = (tp - cp) / cp if cp > 0 else 0.0

    # chartData3: 현재 투자의견 분포 (매수/중립/매도 현황, 보조 지표용)
    # ※ revision_breadth 계산에는 사용하지 않음
    #    (이 값은 "현재 매수 비율"이지 "상향 비율"이 아님)
    m3 = re.search(r"var\s+chartData3\s*=\s*(\{[^;]+\});", text, re.DOTALL)
    if m3:
        d3 = json.loads(m3.group(1))
        today_opinions = d3.get("today", [])
        opinion_dist = {
            d["name"]: d["y"]
            for d in today_opinions
            if d.get("y") is not None
        }
        total_count = sum(v for v in opinion_dist.values() if v)
        result["opinion_count"]        = int(total_count)
        result["opinion_distribution"] = opinion_dist
        # 보조 지표로만 보관 (buy_ratio는 revision_breadth와 다름)
        buy_total = (opinion_dist.get("강력매수") or 0) + (opinion_dist.get("매수") or 0)
        result["buy_ratio"] = buy_total / total_count if total_count > 0 else 0.0

    return result


# ══════════════════════════════════════════════════════════
# CANDIDATE_SCORE 계산
# ══════════════════════════════════════════════════════════

def compute_candidate_score(
    sentiment_feats: dict,
    consensus_feats: dict,
    w1: float = 0.5,
    w2: float = 0.3,
    w3: float = 0.2,
) -> float:
    """
    candidate_score = w1 × (llm_sentiment × extraction_confidence)
                    + w2 × revision_breadth
                    + w3 × min(1.0, price_upside)

    가중치 w1 > w2 > w3, 최적값은 Phase 2~3 백테스트로 결정.
    """
    s  = sentiment_feats.get("sentiment_x_confidence", 0.0)
    rb = consensus_feats.get("revision_breadth", 0.0)
    pu = min(1.0, max(-0.5, consensus_feats.get("price_upside", 0.0)))
    return round(w1 * s + w2 * rb + w3 * pu, 6)


# ══════════════════════════════════════════════════════════
# 메인 실행 — 3개 종목 PoC
# ══════════════════════════════════════════════════════════

def run_poc(stocks: list[tuple[str, str]]) -> None:
    print("=" * 70)
    print("  PoC: 데이터 수집 파이프라인 검증")
    print(f"  실행 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    for code, name in stocks:
        print(f"\n{'─'*60}")
        print(f"  📊 {name} ({code})")
        print(f"{'─'*60}")

        # Step 1. 리포트 목록 + revision_breadth (올바른 계산)
        rb_data = compute_revision_breadth(code, name, days=365)
        reports = rb_data["latest_reports"]
        print(f"  [1] 한경컨센서스 전체:  {rb_data['report_count_30d']}건")
        print(f"      상향(UP):           {rb_data['upgrade_count']}건")
        print(f"      하향(DW):           {rb_data['downgrade_count']}건")
        print(f"      revision_breadth:   {rb_data['revision_breadth']:.1%}  ← upgrade/전체")
        for rp in reports[:2]:
            print(f"      [{rp['date']}] {rp['opinion']:10s} | {rp['broker']:12s} | {rp['title'][:38]}")

        # Step 2 & 3. PDF → 감성 분석
        if reports:
            latest = reports[0]
            pdf_text = download_and_extract_pdf(latest["report_idx"])

            # PoC: PDF 텍스트 확인용 txt 저장
            out_path = f"poc_pdf_{code}_{latest['report_idx']}.txt"
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(f"종목: {name} ({code})\n")
                f.write(f"리포트 ID: {latest['report_idx']}\n")
                f.write(f"날짜: {latest['date']} | 의견: {latest['opinion']} | 증권사: {latest['broker']}\n")
                f.write(f"제목: {latest['title']}\n")
                f.write("=" * 60 + "\n")
                f.write(pdf_text)
            print(f"  [2] PDF 텍스트:            {len(pdf_text):,}자  →  {out_path} 저장 완료")

            sentiment = compute_sentiment_features(pdf_text, latest["opinion"])
        else:
            pdf_text = ""
            sentiment = {"llm_sentiment": 0, "extraction_confidence": 0.5, "sentiment_x_confidence": 0}
            print(f"  [2] PDF 텍스트:            리포트 없음")
        print(f"  [3] llm_sentiment:         {sentiment['llm_sentiment']:+.4f}  [{sentiment['source']}]")
        print(f"      extraction_confidence: {sentiment['extraction_confidence']:.2f}")
        print(f"      sentiment×confidence:  {sentiment['sentiment_x_confidence']:+.4f}")
        print(f"      opinion_direction:     {sentiment['opinion_direction']}")
        print(f"      key_reason:            {sentiment['key_reason']}")

        # Step 4. WISEfn 컨센서스 (price_upside 전용)
        consensus = get_consensus_features(code)
        print(f"  [4] 현재가:                {consensus.get('current_price', 0):>10,.0f}원")
        print(f"      컨센서스 목표주가:      {consensus.get('consensus_target_price', 0):>10,.0f}원")
        print(f"      price_upside:          {consensus.get('price_upside', 0):>9.1%}")
        print(f"      (참고) buy_ratio:      {consensus.get('buy_ratio', 0):>9.1%}  ← 현재 매수비율, ≠ revision_breadth")
        print(f"      분석가 수:             {consensus.get('opinion_count', 'N/A'):>5}")

        # Step 5. CANDIDATE_SCORE (revision_breadth는 한경컨센서스에서 가져옴)
        consensus_for_score = {**consensus, "revision_breadth": rb_data["revision_breadth"]}
        score = compute_candidate_score(sentiment, consensus_for_score)
        print(f"\n  ✅ CANDIDATE_SCORE:  {score:+.4f}")

    print(f"\n{'='*70}")
    print("  PoC 완료 — 모든 데이터 소스 접근 확인")
    print("  ※ revision_breadth = 한경컨센서스 UP필터/전체 (올바른 정의)")
    print("  ※ price_upside     = WISEfn 컨센서스 목표주가 기반")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    STOCKS = [
        ("035420", "NAVER"),
        ("005930", "삼성전자"),
        ("035720", "카카오"),
    ]
    run_poc(STOCKS)
