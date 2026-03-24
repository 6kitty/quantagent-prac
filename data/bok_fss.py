import os, requests, pandas as pd
from dotenv import load_dotenv
load_dotenv()

BOK_API_KEY = os.environ["BOK_API_KEY"]   # https://ecos.bok.or.kr → 개발자 등록
FSS_API_KEY = os.environ["FSS_API_KEY"]   # https://opendart.fss.or.kr → API 신청

# ══════════════════════════════════════════════════════════
# ① BOK ECOS — 기준금리, CPI, 환율 수집
# ══════════════════════════════════════════════════════════
def get_bok_data(stat_code: str, item_code: str,
                 cycle: str, start: str, end: str) -> pd.DataFrame:
    """
    stat_code  : 통계표 코드  (예: 722Y001 = 기준금리)
    item_code  : 항목 코드    (예: 0101000)
    cycle      : 주기         (M=월, Q=분기, A=연)
    start/end  : YYYYMM 형식
    """
    url = (f"https://ecos.bok.or.kr/api/StatisticSearch/"
           f"{BOK_API_KEY}/json/kr/1/1000/"
           f"{stat_code}/{cycle}/{start}/{end}/{item_code}")
    resp = requests.get(url)
    rows = resp.json()["StatisticSearch"]["row"]
    df = pd.DataFrame(rows)[["TIME","DATA_VALUE"]]
    df.columns = ["date","value"]
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    return df

# 주요 stat_code 목록:
# 722Y001 / 0101000 : 한국은행 기준금리 (M)
# 901Y009 / 0           : CPI 전국 (M)
# 731Y001 / 0000001  : 원/달러 환율 (M)

base_rate = get_bok_data("722Y001", "0101000", "M", "202301", "202503")
print(base_rate.tail(5))

# ══════════════════════════════════════════════════════════
# ② FSS DART — 상장사 재무제표 수집
# ══════════════════════════════════════════════════════════
def get_dart_financial(corp_code: str, year: str, report_type: str = "11011") -> dict:
    """
    corp_code   : DART 고유번호 (종목코드 아님! 별도 조회 필요)
    year        : 사업연도 (2023)
    report_type : 11011=사업보고서, 11012=반기, 11013=분기
    """
    resp = requests.get(
        "https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json",
        params={
            "crtfc_key": FSS_API_KEY,
            "corp_code":   corp_code,
            "bsns_year":   year,
            "reprt_code":  report_type,
            "fs_div":       "CFS",  # CFS=연결, OFS=별도
        }
    )
    return resp.json()

def get_corp_code_by_name(company_name: str) -> str:
    """회사명으로 DART 고유번호 조회"""
    resp = requests.get(
        "https://opendart.fss.or.kr/api/company.json",
        params={
            "crtfc_key":    FSS_API_KEY,
            "corp_name":    company_name,
            "page_no":      1,
            "page_count":   10,
        }
    )
    corps = resp.json().get("list", [])
    # 상장사만 필터
    listed = [c for c in corps if c["stock_code"]]
    return listed[0]["corp_code"] if listed else None

# 삼성전자 재무제표
corp_code = get_corp_code_by_name("삼성전자")
fs = get_dart_financial(corp_code, "2023")
print(f"항목 수: {len(fs.get('list', []))}")
