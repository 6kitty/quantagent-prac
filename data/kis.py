import os, requests
from datetime import datetime, timedelta
import pandas as pd

from dotenv import load_dotenv
load_dotenv()

BASE_URL_REAL    = "https://openapi.koreainvestment.com:9443"
BASE_URL_VIRTUAL = "https://openapivts.koreainvestment.com:29443"  # 모의투자

def get_base_url() -> str:
    return BASE_URL_VIRTUAL if os.getenv("KIS_IS_VIRTUAL", "true") == "true" else BASE_URL_REAL

# ─── 액세스 토큰 발급 ─────────────────────────────────────
def get_access_token() -> str:
    url = f"{get_base_url()}/oauth2/tokenP"
    body = {
        "grant_type": "client_credentials",
        "appkey":     os.environ["KIS_APP_KEY"],
        "appsecret":  os.environ["KIS_APP_SECRET"],
    }
    resp = requests.post(url, json=body)
    resp.raise_for_status()
    return resp.json()["access_token"]

TOKEN = get_access_token()

def get_headers(tr_id: str) -> dict:
    return {
        "authorization":  f"Bearer {TOKEN}",
        "appkey":          os.environ["KIS_APP_KEY"],
        "appsecret":       os.environ["KIS_APP_SECRET"],
        "tr_id":           tr_id,
        "Content-Type":    "application/json; charset=UTF-8",
    }

# ─── 현재가 조회 ──────────────────────────────────────────
def get_current_price(ticker: str) -> dict:
    """VTTC8434R: 모의투자 주식 현재가 시세"""
    tr_id = "VTTC8434R" if os.getenv("KIS_IS_VIRTUAL") == "true" else "FHKST01010100"
    resp = requests.get(
        f"{get_base_url()}/uapi/domestic-stock/v1/quotations/inquire-price",
        headers=get_headers(tr_id),
        params={
            "FID_COND_MRKT_DIV_CODE": "J",   # J=주식
            "FID_INPUT_ISCD": ticker,
        }
    )
    data = resp.json()["output"]
    return {
        "ticker":  ticker,
        "price":   int(data["stck_prpr"]),     # 현재가
        "open":    int(data["stck_oprc"]),     # 시가
        "high":    int(data["stck_hgpr"]),     # 고가
        "low":     int(data["stck_lwpr"]),     # 저가
        "volume":  int(data["acml_vol"]),      # 거래량
        "change_rate": float(data["prdy_ctrt"]),  # 전일 대비율
    }

# ─── 일봉 데이터 조회 (최근 30일) ────────────────────────
def get_daily_ohlcv(ticker: str, days: int = 30) -> pd.DataFrame:
    end_dt   = datetime.now().strftime("%Y%m%d")
    start_dt = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")

    resp = requests.get(
        f"{get_base_url()}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
        headers=get_headers("FHKST03010100"),
        params={
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD":   ticker,
            "FID_INPUT_DATE_1": start_dt,
            "FID_INPUT_DATE_2": end_dt,
            "FID_PERIOD_DIV_CODE": "D",  # D=일봉
            "FID_ORG_ADJ_PRC":    "0",  # 0=수정주가
        }
    )
    rows = resp.json().get("output2", [])
    df = pd.DataFrame(rows)[["stck_bsop_date","stck_oprc","stck_hgpr",
                               "stck_lwpr","stck_clpr","acml_vol"]]
    df.columns = ["date","open","high","low","close","volume"]
    df[["open","high","low","close","volume"]] = df[["open","high","low","close","volume"]].astype(int)
    df["date"] = pd.to_datetime(df["date"])
    return df.sort_values("date").reset_index(drop=True)

# ─── 테스트 ───────────────────────────────────────────────
print(get_current_price("005930"))   # 삼성전자
df = get_daily_ohlcv("005930", days=30)
print(df.tail())
