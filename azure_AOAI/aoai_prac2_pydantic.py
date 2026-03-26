import os
from openai import AzureOpenAI
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

client = AzureOpenAI(
    api_key=os.environ["AZURE_OPENAI_KEY"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    api_version="2024-08-01-preview",  # Structured Outputs 지원 버전
)

# ─── 응답 스키마 정의 ──────────────────────────────────────
class StockOutlook(BaseModel):
    ticker: str
    company_name: str
    current_price_krw: Optional[float]
    recommendation: str           # BUY / HOLD / SELL
    target_price_krw: Optional[float]
    summary: str
    risks: list[str]

# ─── Structured Output 요청 ────────────────────────────────
response = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[
        {
            "role": "system",
            "content": "당신은 금융 애널리스트입니다. 요청된 종목을 분석하고 반드시 지정된 JSON 형식으로만 응답하세요."
        },
        {
            "role": "user",
            "content": "삼성전자(005930.KS)의 현재 시장 상황을 분석하고 투자 의견을 제시해주세요."
        }
    ],
    response_format=StockOutlook,  # Pydantic 모델을 직접 전달
)

# ─── 파싱된 결과 출력 ──────────────────────────────────────
result: StockOutlook = response.choices[0].message.parsed

print("=== 구조화된 분석 결과 ===")
print(f"종목코드  : {result.ticker}")
print(f"회사명    : {result.company_name}")
print(f"현재가    : {result.current_price_krw:,.0f} 원" if result.current_price_krw else "현재가    : N/A")
print(f"투자의견  : {result.recommendation}")
print(f"목표주가  : {result.target_price_krw:,.0f} 원" if result.target_price_krw else "목표주가  : N/A")
print(f"\n요약 : {result.summary}")
print("\n리스크 요인:")
for i, risk in enumerate(result.risks, 1):
    print(f"  {i}. {risk}")
