"""
Azure OpenAI /openai/v1/ 신규 엔드포인트 연결 방식
─────────────────────────────────────────────────────────────
기존 AzureOpenAI() 대신 표준 OpenAI() 클라이언트 사용
- api_version 파라미터 불필요 (자동 관리)
- 새 기능 출시 시 코드 변경 없이 자동 적용
- Responses API (client.responses.create) 지원
- DeepSeek, Grok 등 멀티 프로바이더 모델 동일 문법으로 호출 가능
─────────────────────────────────────────────────────────────
"""

import os
from openai import OpenAI
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# ─── 연결: api_version 없음, base_url에 /openai/v1/ ────────
client = OpenAI(
    api_key=os.environ["AZURE_OPENAI_KEY"],
    base_url=os.environ["AZURE_OPENAI_ENDPOINT_FOR_PRAC4"],  # https://aoai-quant-prac1.openai.azure.com/openai/v1/
)

# ═══════════════════════════════════════════════════════════
# 예시 1: Chat Completions (기존 방식과 동일 문법)
# ═══════════════════════════════════════════════════════════

print("=== Chat Completions ===")
completion = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "당신은 금융 애널리스트입니다."},
        {"role": "user", "content": "삼성전자 반도체 업황을 한 줄로 요약해주세요."},
    ],
)
print(completion.choices[0].message.content)

# ═══════════════════════════════════════════════════════════
# 예시 2: Responses API (신규 — Agents와 통합된 방식)
# ═══════════════════════════════════════════════════════════

print("\n=== Responses API ===")
response = client.responses.create(
    model="gpt-4o",
    input="HBM 메모리란 무엇인지 두 문장으로 설명해주세요.",
)
print(response.output_text)

# ═══════════════════════════════════════════════════════════
# 예시 3: Structured Output (Pydantic + v1 엔드포인트)
# ═══════════════════════════════════════════════════════════

class MarketSummary(BaseModel):
    ticker: str
    sentiment: str          # "긍정" / "중립" / "부정"
    key_driver: str
    one_line_summary: str
    upside_risk: Optional[str] = None
    downside_risk: Optional[str] = None

print("\n=== Structured Output (v1 엔드포인트) ===")
parsed = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "당신은 금융 애널리스트입니다. JSON 형식으로만 응답하세요."},
        {"role": "user", "content": "삼성전자(005930.KS)의 현재 시장 센티먼트를 분석해주세요."},
    ],
    response_format=MarketSummary,
)
result: MarketSummary = parsed.choices[0].message.parsed

print(f"티커       : {result.ticker}")
print(f"센티먼트   : {result.sentiment}")
print(f"주요 동력  : {result.key_driver}")
print(f"한줄 요약  : {result.one_line_summary}")
if result.upside_risk:
    print(f"상방 리스크: {result.upside_risk}")
if result.downside_risk:
    print(f"하방 리스크: {result.downside_risk}")
