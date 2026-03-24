# data api 

API	주요 데이터	장점	한계
KIS Open API	실시간 시세, 일봉/분봉, 체결, 호가, 잔고	실시간 WebSocket, 모의투자 환경, 국내 최고 품질	개인 계좌 연동 필요, 요청 제한
KRX OpenAPI	종목 기본 정보, 지수, 투자자별 거래	공식 거래소 데이터, 무료	실시간 없음, 전일 EOD 기준
BOK ECOS	기준금리, CPI, GDP, 환율, 통화량	거시지표 완결성 높음	주식 데이터 없음, 월별/분기별
FSS DART	공시, 재무제표, 감사보고서	상장사 전 종목 재무 데이터	실시간 아님, 파싱 필요

## KIS 

> uv run python data/kis.py     
{'ticker': '005930', 'price': 189700, 'open': 195500, 'high': 196000, 'low': 185500, 'volume': 25458914, 'change_rate': 1.83}
         date    open    high     low   close    volume
16 2026-03-18  200500  209000  199700  208500  25148481
17 2026-03-19  199900  205000  199600  200500  19884483
18 2026-03-20  202000  202500  199000  199400  35279762
19 2026-03-23  190500  191200  186300  186300  30268173
20 2026-03-24  195500  196000  185500  189700  25458914

## BOK, FSS 

> uv run python data/bok_fss.py 
      date  value
22  202411   3.00
23  202412   3.00
24  202501   3.00
25  202502   2.75
26  202503   2.75
항목 수: 0

## 번외) 가상환경 venv 말고 uv 

```bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

uv init --bare 

uv 설정 방법
1. uv 설치

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
2. 프로젝트 초기화 (현재 디렉토리에서)

cd c:/Users/yes08/Documents/quant
uv init --bare   # pyproject.toml만 생성 (기존 코드 구조 유지)
3. 가상환경 생성 & 패키지 설치

uv venv                        # .venv 생성
uv pip install -r requirements.txt   # 기존 requirements.txt 사용
또는 pyproject.toml 기반으로 관리할 경우:


uv add requests pandas         # pyproject.toml에 자동 추가 + 설치
uv sync                        # pyproject.toml 기준으로 동기화
4. 실행

uv run python data/kis.py      # 가상환경 자동 활성화 후 실행
uv run은 .venv 활성화 없이도 바로 실행돼서 편합니다.

venv 대비 장점
venv + pip	uv
속도	느림	10~100배 빠름 (Rust 기반)
lock 파일	없음	uv.lock 자동 생성
Python 버전 관리	별도 도구 필요	uv python install 3.12
실행	activate 필요	uv run 으로 바로 실행
VSCode에서는 .venv가 자동 감지되므로 인터프리터 설정 따로 안 해도 됩니다.