import requests
import pandas as pd
import os
import json
from dotenv import load_dotenv

load_dotenv()

# 환경 변수 설정 (예: KRX_BASE = "https://openapi.krx.co.kr/svc/apis/idx/krx_dd_trd")
KRX_AUTH_KEY = os.getenv("KRX_AUTH_KEY")
KRX_BASE = os.getenv("KRX_BASE")

def get_krx_index_daily(date: str) -> pd.DataFrame:
    """시리즈(지수) 일별시세 조회 (GET 방식)"""
    
    # 1. 쿼리 파라미터 설정 (URL 뒤에 ?basDd=... 형태로 붙음)
    params = {
        "basDd": date
    }
    
    # 2. 헤더 설정 (AUTH_KEY는 보통 헤더에 넣습니다)
    headers = {
        "AUTH_KEY": KRX_AUTH_KEY
    }

    try:
        # GET 요청으로 변경
        resp = requests.get(
            KRX_BASE,
            params=params,
            headers=headers
        )
        
        # HTTP 상태 코드 확인 (200이 아니면 에러 발생)
        resp.raise_for_status()
        
        result = resp.json()
        
        # KRX 응답 구조에 따라 데이터 추출 (보통 OutBlock_1에 리스트로 담김)
        data = result.get("OutBlock_1", [])
        
        if not data:
            print(f"해당 날짜({date})에 데이터가 없거나 응답이 비어있습니다.")
            return pd.DataFrame()
            
        return pd.DataFrame(data)

    except Exception as e:
        print(f"API 요청 중 오류 발생: {e}")
        return pd.DataFrame()

if __name__ == "__main__":
    # 테스트용 날짜 (최근 평일 권장)
    test_date = "20260325" 
    
    print(f"--- {test_date} 지수 데이터 조회 시작 ---")
    df = get_krx_index_daily(test_date)
    
    if not df.empty:
        print(df.head())
    else:
        # 상세 에러 확인을 위해 raw response를 한번 더 찍어볼 수 있습니다.
        resp = requests.get(KRX_BASE, params={"basDd": test_date}, headers={"AUTH_KEY": KRX_AUTH_KEY})
        print("Status Code:", resp.status_code)
        print("Response:", resp.text)