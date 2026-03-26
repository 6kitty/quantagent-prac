import requests
import pandas as pd
import os, requests
from dotenv import load_dotenv
load_dotenv()

# KRX Open API: https://openapi.krx.co.kr
# 회원가입 → API 신청 → auth_key 발급 (1~2 영업일)

KRX_AUTH_KEY = os.getenv("KRX_AUTH_KEY")
KRX_BASE = "http://data-dbg.krx.co.kr/svc/apis"

def get_krx_stock_list(date: str = "20240101") -> pd.DataFrame:
    """KOSPI 전 종목 기본 정보 조회"""
    resp = requests.post(
        f"{KRX_BASE}/sto/stk_isu_base_info",
        data={
            "AUTH_KEY": KRX_AUTH_KEY,
            "basDd":    date,   # 기준일자 YYYYMMDD
        }
    )
    data = resp.json()["OutBlock_1"]
    df = pd.DataFrame(data)
    return df[["ISU_CD","ISU_SRT_CD","ISU_NM","MKT_TP_NM",
               "SECT_TP_NM","KIND_STKCERT_TP_NM"]]
    # ISU_SRT_CD = 단축 종목코드 (6자리)

def get_krx_daily_price(ticker: str, date: str) -> dict:
    """개별 종목 일별 시세"""
    resp = requests.post(
        f"{KRX_BASE}/sto/stk_bydd_trd",
        data={
            "AUTH_KEY": KRX_AUTH_KEY,
            "ISU_CD":   ticker,
            "fromDd":   date,
            "toDd":     date,
        }
    )
    return resp.json().get("OutBlock_1", [{}])[0]

if __name__ == "__main__":
    df = get_krx_stock_list("20260326")
    print(df)
# ─── KIS vs KRX 비교 ──────────────────────────────────────
# KIS  강점: 실시간 WebSocket 시세, 분봉/틱 데이터, 모의투자 주문
# KIS  한계: 개인 증권 계좌 필요, 분봉은 최근 30일만 제공
# KRX  강점: 거래소 공식 데이터, 투자자별 매매(기관/외인/개인), 지수 데이터
# KRX  한계: EOD 데이터만 (실시간 없음), API 신청 후 승인 필요
# 결론: 실시간/분봉 → KIS / 종목 마스터·투자자동향 → KRX 병용
