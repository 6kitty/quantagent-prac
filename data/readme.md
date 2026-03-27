# data api 

API	주요 데이터	장점	한계
KIS Open API	실시간 시세, 일봉/분봉, 체결, 호가, 잔고	실시간 WebSocket, 모의투자 환경, 국내 최고 품질	개인 계좌 연동 필요, 요청 제한
KRX OpenAPI	종목 기본 정보, 지수, 투자자별 거래	공식 거래소 데이터, 무료	실시간 없음, 전일 EOD 기준
BOK ECOS	기준금리, CPI, GDP, 환율, 통화량	거시지표 완결성 높음	주식 데이터 없음, 월별/분기별
FSS DART	공시, 재무제표, 감사보고서	상장사 전 종목 재무 데이터	실시간 아님, 파싱 필요

## KIS 

```bash 
> uv run python data/kis.py     
{'ticker': '005930', 'price': 189700, 'open': 195500, 'high': 196000, 'low': 185500, 'volume': 25458914, 'change_rate': 1.83}
         date    open    high     low   close    volume
16 2026-03-18  200500  209000  199700  208500  25148481
17 2026-03-19  199900  205000  199600  200500  19884483
18 2026-03-20  202000  202500  199000  199400  35279762
19 2026-03-23  190500  191200  186300  186300  30268173
20 2026-03-24  195500  196000  185500  189700  25458914
```

### Oauth 

```py 
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
```

다른 api와 다르게 POST 요청이며 token을 발급한다. 

### 일봉 데이터 

```py 
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
```

## BOK, FSS 

```bash 
> uv run python data/bok_fss.py 
      date  value
22  202411   3.00
23  202412   3.00
24  202501   3.00
25  202502   2.75
26  202503   2.75
항목 수: 0
```

### BOK -> 기준금리, CPI, 환율 수집

```py 
url = (f"https://ecos.bok.or.kr/api/StatisticSearch/"
           f"{BOK_API_KEY}/json/kr/1/1000/"
           f"{stat_code}/{cycle}/{start}/{end}/{item_code}")
    resp = requests.get(url)
```

후술하겠는데 같은 코드에 작성해달라고 했는데 get 요청을 좀 다르게 구성했네.. 

stat_code  : 통계표 코드  (예: 722Y001 = 기준금리)
item_code  : 항목 코드    (예: 0101000)
cycle      : 주기         (M=월, Q=분기, A=연)
start/end  : YYYYMM 형식

참고할 통계 코드와 항목코드, 그리고 기간 -> 입력할 게 많아서 아예 def로 빼버린 거 같다. 

```py 
base_rate = get_bok_data("722Y001", "0101000", "M", "202301", "202503")
```

위처럼 메인에서는 인자만 넣어준다. 

# 주요 stat_code 목록:
# 722Y001 / 0101000 : 한국은행 기준금리 (M)
# 901Y009 / 0           : CPI 전국 (M)
# 731Y001 / 0000001  : 원/달러 환율 (M)

이건 많이 쓰는 stat_code라 하니 참고 

### FSS -> 상장사 재무제표 수집

```py 
resp = requests.get(
        "https://opendart.fss.or.kr/api/company.json",
        params={
            "crtfc_key":    FSS_API_KEY,
            "corp_name":    company_name,
            "page_no":      1,
            "page_count":   10,
        }
    )
```

get 요청, params 정도 기억하고 넘어가자. 

# krx 
KRX 시리즈 일별시세정보 api 신청했다. 이외에도 여러개 신청해두었는데 중요한 점은 

**GET** 요청이다. POST로 하니까 안된다(겁나 애먹었다;) API마다 다를 수도 있겠지만 내가 실습한 KRX 일별시세정보에서는 예제가 

```bash 
HTTP Request
              
GET /svc/sample/apis/idx/krx_dd_trd?basDd=20200414 HTTP/1.1
Host: openapi.krx.co.kr
AUTH_KEY: 74D1B99DFBF345BBA3FB4476510A4BED4C78D13A
```

이렇게 되어있다(참고로 저기에 나와있는 인증키는 홈페이지에 예시로 준 것이다) 

krx.py에 과하게 get 요청을 잘 써놓은 거 같긴 한데 사실 

```py 
requests.get(KRX_BASE, params={"basDd": test_date}, headers={"AUTH_KEY": KRX_AUTH_KEY})
```

로 끝내도 된다. (왜 이렇게 어렵게 썼냐고 제미나이를 혼냈다)

```bash 
% uv run ./data/krx.py
warning: `VIRTUAL_ENV=azure_AOAI/.venv` does not match the project environment path `.venv` and will be ignored; use `--active` to target the active environment instead
--- 20260325 지수 데이터 조회 시작 ---
     BAS_DD IDX_CLSS       IDX_NM CLSPRC_IDX  ... LWPRC_IDX  ACC_TRDVOL      ACC_TRDVAL            MKTCAP
0  20260325      KRX   코리아 밸류업 지수    2554.05  ...   2546.72    69404398  14474825882727  2898472914932110
1  20260325      KRX      KRX TMI    3539.27  ...   3532.28  1764298212  35952111386171  5096259735973735
2  20260325      KRX      KRX 300    3765.42  ...   3758.73   243340987  24557469138548  4596680286740270
3  20260325      KRX  KRX 중대형 TMI    3588.78  ...   3581.90   598470840  29898373826011  4859844601625070
4  20260325      KRX   KRX 중형 TMI    2094.15  ...   2058.04   355129853   5340904687463   263164314884800

[5 rows x 12 columns]
```

오히려 이렇게 응답 받아보니까 response를 구조화로 받아오는 게 더 중요해보인다. 이 코드는 krx_res.py로 작성해보자. 

```bash 
--- 20260325 KRX 지수 리포트 ---
[코리아 밸류업 지수]
  종가: 2,554.05 (+1.79%)
  시가총액: 2,898,472,914,932,110 원
------------------------------
[KRX TMI]
  종가: 3,539.27 (+1.60%)
  시가총액: 5,096,259,735,973,735 원
------------------------------
[KRX 300]
  종가: 3,765.42 (+1.49%)
  시가총액: 4,596,680,286,740,270 원
------------------------------
[KRX 중대형 TMI]
  종가: 3,588.78 (+1.55%)
  시가총액: 4,859,844,601,625,070 원
------------------------------
[KRX 중형 TMI]
  종가: 2,094.15 (+2.78%)
  시가총액: 263,164,314,884,800 원
------------------------------
[KRX 소형 TMI]
  종가: 1,779.75 (+3.00%)
  시가총액: 205,133,434,604,308 원
------------------------------
[KRX 초소형 TMI]
  종가: 6,237.44 (+2.17%)
  시가총액: 31,281,699,744,357 원
------------------------------
[KTOP 30]
  종가: 15,319.82 (+1.47%)
  시가총액: 2,857,801,827,606,300 원
------------------------------
[KRX 100]
  종가: 13,194.61 (+1.26%)
  시가총액: 4,048,362,406,462,700 원
------------------------------
[KRX 자동차]
  종가: 3,157.52 (+1.55%)
  시가총액: 234,066,723,848,880 원
------------------------------
```

오 아주 이쁘군 

코드 뜯어보자. 이전에 get 요청까지 봤고 

```py 
    raw_list = resp.json().get("OutBlock_1", [])
    return [KrxIndex.from_dict(item) for item in raw_list]
```

응답(resp)에 OutBlock_1의 내용을 다 가져온다. 그리고 그 raw_list의 여러 데이터들이 있을 텐데 그걸 item으로 선언해서 KrxIndex로 구조체 파싱해준다. 

```py 
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
```


## 번외) 가상환경 venv 말고 uv 

```bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

```bash 
uv init --bare 
```

### uv 설정 방법
1. uv 설치

Windows (PowerShell)

```bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

2. 프로젝트 초기화 (현재 디렉토리에서)

```bash
uv init --bare   # pyproject.toml만 생성 (기존 코드 구조 유지)
```

3. 가상환경 생성 & 패키지 설치

```bash 
uv venv                        # .venv 생성
uv pip install -r requirements.txt   # 기존 requirements.txt 사용
또는 pyproject.toml 기반으로 관리할 경우:


uv add requests pandas         # pyproject.toml에 자동 추가 + 설치
uv sync                        # pyproject.toml 기준으로 동기화
```

4. 실행

```bash 
uv run python data/kis.py      # 가상환경 자동 활성화 후 실행
```

uv run은 .venv 활성화 없이도 바로 실행돼서 편하다. vscode 켜면 source 명령어 없이 바로 실행된다. 