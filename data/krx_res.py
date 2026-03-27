import os
import requests
from dataclasses import dataclass
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

@dataclass
class KrxIndex:
    """KRX 지수 정보를 담는 구조체"""
    date: str          # BAS_DD (기준일자)
    category: str      # IDX_CLSS (계열구분)
    name: str          # IDX_NM (지수명)
    close: float       # CLSPRC_IDX (종가)
    diff: float        # CMPPREVDD_IDX (대비)
    ratio: float       # FLUC_RT (등락률)
    open: float        # OPNPRC_IDX (시가)
    high: float        # HGPRC_IDX (고가)
    low: float         # LWPRC_IDX (저가)
    volume: int        # ACC_TRDVOL (거래량)
    value: int         # ACC_TRDVAL (거래대금)
    mkt_cap: int       # MKTCAP (상장시가총액)

    @classmethod
    def from_dict(cls, data: dict):
        """API 응답 딕셔너리를 객체로 변환 (타입 캐스팅 포함)"""
        return cls(
            date=data.get("BAS_DD"),
            category=data.get("IDX_CLSS"),
            name=data.get("IDX_NM"),
            close=float(data.get("CLSPRC_IDX", 0)),
            diff=float(data.get("CMPPREVDD_IDX", 0)),
            ratio=float(data.get("FLUC_RT", 0)),
            open=float(data.get("OPNPRC_IDX", 0)),
            high=float(data.get("HGPRC_IDX", 0)),
            low=float(data.get("LWPRC_IDX", 0)),
            volume=int(data.get("ACC_TRDVOL", 0)),
            value=int(data.get("ACC_TRDVAL", 0)),
            mkt_cap=int(data.get("MKTCAP", 0))
        )

def fetch_krx_indices(date: str) -> List[KrxIndex]:
    """데이터를 가져와 구조체 리스트로 반환"""
    KRX_AUTH_KEY = os.getenv("KRX_AUTH_KEY")
    KRX_BASE = os.getenv("KRX_BASE")
    
    resp = requests.get(
        KRX_BASE, 
        params={"basDd": date}, 
        headers={"AUTH_KEY": KRX_AUTH_KEY}
    )
    
    if resp.status_code != 200:
        print(f"Error: {resp.status_code}")
        return []

    raw_list = resp.json().get("OutBlock_1", [])
    return [KrxIndex.from_dict(item) for item in raw_list]

if __name__ == "__main__":
    target_date = "20260325"
    indices = fetch_krx_indices(target_date)

    print(f"--- {target_date} KRX 지수 리포트 ---")
    for idx in indices[:10]:  # 상위 10개만 출력
        # 가독성을 위해 f-string 포맷팅 적용
        print(f"[{idx.name}]")
        print(f"  종가: {idx.close:,.2f} ({idx.ratio:+.2f}%)")
        print(f"  시가총액: {idx.mkt_cap:,} 원")
        print("-" * 30)