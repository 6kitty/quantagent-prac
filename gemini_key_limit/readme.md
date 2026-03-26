# rate limit 해결하기 

## 1. gcloud 10개 생성 

무료 계정으로 1플젝 당 1 API key 

## 2. 각 프로젝트마다 Gen API 키 생성

https://aistudio.google.com/api-keys

여기서 만든 프로젝트 다 가져오고 API 키를 생성한다. 

그리고 .env에 넣어준다. 
.env는 .gitignore 처리할 것 

## 3. rotation 코드 생성 

만들어두었긴 한데 아까우니까 질의 과제할 때 써보자 

Gemini 모델이 잘하는 것 (특히 gemini-2.0-flash-lite 기준):

강점	설명
속도	Flash/Flash-Lite는 응답 지연이 매우 낮음 — 배치 처리에 최적
긴 컨텍스트	1M 토큰 입력 지원 → 긴 문서/보고서 통째로 분석 가능
한국어	영어와 성능 차이가 적고 한국어 금융 텍스트에 강함
구조화 출력	JSON 모드로 정형 데이터 추출 안정적
코드 생성	파이썬/SQL 코드 생성 수준 높음
Free tier 한계: 15 RPM per key → 키 10개면 이론상 150 RPM

이제 병렬 처리 실험 플랜을 작성합니다. 현재 코드에 thread-safety 이슈가 있어서 그것도 같이 다뤄야 해요.

uv add google-generativeai
uv add google-genai

Free tier에서 쓸 수 있는 모델:

모델	Free RPM
gemini-1.5-flash	15 RPM
gemini-1.5-flash-8b	15 RPM
gemini-2.0-flash	15 RPM (별도 확인 필요)
