# opencode × oh-my-opencode × MCP 7종 + Qwen3-Coder + Azure Codex 통합 가이드

## 전체 구조 한눈에 보기

```
┌─────────────────────────────────────────────────────────────────┐
│                        opencode (CLI)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               oh-my-opencode (플러그인 레이어)            │   │
│  │  커스텀 커맨드 · 시스템 프롬프트 · 모델 프로필 · 테마      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────┐      ┌──────────────────────────────────┐   │
│  │   LLM 프로바이더  │      │         MCP 서버 레이어          │   │
│  │                 │      │                                  │   │
│  │ ① Qwen3-Coder  │      │ ① filesystem  ⑥ context7 (OMO) │   │
│  │   (DashScope)  │      │ ② github      ⑦ grep-app  (OMO) │   │
│  │                 │      │ ③ memory      ⑧ exa-search(OMO) │   │
│  │ ② GPT-5 Codex  │      │ ④ sqlite      ⑨ fetch           │   │
│  │   (Azure AOAI) │      │ ⑤ brave-search                  │   │
│  └─────────────────┘      └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. 설치

### 1-1. 원클릭 설치 (권장)

```bash
bash setup-opencode.sh
```

### 1-2. 수동 설치

```bash
# opencode 설치
npm install -g opencode-ai@latest

# oh-my-opencode 설치
npm install -g oh-my-opencode@latest

# MCP 서버 패키지 글로벌 설치
npm install -g \
  @modelcontextprotocol/server-filesystem \
  @modelcontextprotocol/server-github \
  @modelcontextprotocol/server-memory \
  @modelcontextprotocol/server-sqlite \
  @modelcontextprotocol/server-brave-search \
  @modelcontextprotocol/server-fetch
```

---

## 2. 설정 파일 배치

```
~/.config/opencode/
├── opencode.json          ← 메인 설정 (프로바이더 + MCP)
└── oh-my-opencode.json    ← OMO 전용 설정 (커맨드 · 프로필)
```

동봉된 파일을 복사:

```bash
mkdir -p ~/.config/opencode
cp opencode.json oh-my-opencode.json ~/.config/opencode/
```

---

## 3. 환경변수 설정

`~/.env.opencode` 파일을 열어 실제 키 값 입력:

```bash
# 편집
nano ~/.env.opencode

# 셸에 로드 (bashrc/zshrc에 추가 권장)
source ~/.env.opencode
```

| 변수명 | 용도 | 발급 URL |
|---|---|---|
| `DASHSCOPE_API_KEY` | Qwen3-Coder | [dashscope.aliyun.com](https://dashscope.aliyun.com) |
| `AOAI_RESOURCE_NAME` | Azure Codex 리소스명 | Azure Portal |
| `AOAI_API_KEY` | Azure Codex API 키 | Azure Portal → Azure OpenAI |
| `GITHUB_TOKEN` | GitHub MCP | [github.com/settings/tokens](https://github.com/settings/tokens) |
| `BRAVE_API_KEY` | Brave Search MCP | [api.search.brave.com](https://api.search.brave.com) |
| `EXA_API_KEY` | Exa AI 웹 검색 | [dashboard.exa.ai](https://dashboard.exa.ai) |

---

## 4. LLM 프로바이더 상세

### 4-1. Alibaba Cloud Qwen3-Coder

- **프로토콜**: OpenAI-compatible (`/v1/chat/completions`)
- **엔드포인트**: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- **사용 모델**

  | 모델 ID | 컨텍스트 | 특징 |
  |---|---|---|
  | `qwen3-coder-plus` | 131 K | 최신 안정 버전, 복잡한 리팩터링에 최적 |
  | `qwen3-coder-plus-2025-09-23` | 131 K | 고정 스냅샷 (재현 가능 결과) |
  | `qwen3-coder-next` | 65 K | 차세대 프리뷰 |

- **생각 모드(Thinking Mode)**: `/think` 또는 `"thinkingMode": "auto"` 설정 시 자동 활성화
- **한국 리전 접근**: `https://dashscope-intl.aliyuncs.com` (싱가포르 국제 엔드포인트 사용)

### 4-2. Azure OpenAI – GPT-5 Codex

- **프로토콜**: Azure OpenAI Responses API (`/openai/v1`)
  > ⚠️ 기존 `/openai/deployments/…/chat/completions` 경로가 **아닌** `/openai/v1` 경로 사용
- **엔드포인트**: `https://<AOAI_RESOURCE_NAME>.openai.azure.com/openai/v1`
- **모델**: `gpt-5-codex` (200 K 컨텍스트)
- **주요 기능**: 멀티모달 입력, 비동기 장기 실행, 레포지토리 전체 인식

```jsonc
// opencode.json 발췌
"azure-codex": {
  "npm": "@ai-sdk/openai-compatible",
  "options": {
    "baseURL": "https://{env:AOAI_RESOURCE_NAME}.openai.azure.com/openai/v1",
    "apiKey": "{env:AOAI_API_KEY}",
    "headers": { "api-key": "{env:AOAI_API_KEY}" }
  },
  "models": {
    "gpt-5-codex": { "limit": 200000 }
  }
}
```

---

## 5. MCP 서버 9종 상세

| # | 이름 | 유형 | 주요 기능 | 필요 키 |
|---|---|---|---|---|
| 1 | `filesystem` | local | 로컬 파일 읽기·쓰기·탐색 | 없음 |
| 2 | `github` | local | 이슈·PR·커밋·코드 검색 | `GITHUB_TOKEN` |
| 3 | `memory` | local | 지식 그래프 기반 장기 기억 | 없음 |
| 4 | `sqlite` | local | 로컬 SQLite DB 쿼리·분석 | 없음 |
| 5 | `duckduckgo` | local | 무료 실시간 웹 검색 (API 키 불필요) | 없음 |
| 6 | `context7` | remote | 라이브러리 공식 문서 조회 (OMO 번들) | 없음 |
| 7 | `grep-app` | remote | GitHub 전체 코드 초고속 검색 (OMO 번들) | 없음 |
| 8 | `exa-search` | remote | Exa AI 웹 검색 (OMO 번들) | `EXA_API_KEY` |
| 9 | `fetch` | local | URL 원문 가져오기 | 없음 |

---

## 6. oh-my-opencode 커스텀 커맨드

세션 내에서 `/` 로 시작하는 슬래시 커맨드 사용:

| 커맨드 | 기능 |
|---|---|
| `/review` | 현재 git diff 코드 리뷰 (한국어 출력) |
| `/docgen` | 현재 파일 JSDoc/TSDoc 자동 생성 |
| `/switch-qwen` | Qwen3-Coder Plus로 모델 전환 |
| `/switch-codex` | Azure GPT-5 Codex로 모델 전환 |
| `/mcp` | MCP 서버 상태 확인 |

---

## 7. 실행 방법

```bash
# 기본 실행 (opencode.json의 default model: qwen3-coder-plus)
opencode

# 특정 모델 지정 실행
opencode --model qwen/qwen3-coder-plus
opencode --model azure-codex/gpt-5-codex

# 프로젝트 루트에서 실행 (oh-my-opencode가 .git 자동 인식)
cd ~/projects/my-app && opencode
```

---

## 8. 자주 묻는 질문

**Q. Qwen3-Coder 생각 모드는 어떻게 쓰나요?**
프롬프트에 `/think` 를 붙이거나 oh-my-opencode.json의 `"thinkingMode": "auto"` 를 유지하면 모델이 자동으로 판단합니다.

**Q. Azure Codex 연결 시 401 오류가 납니다.**
`headers`에 `"api-key"` 를 반드시 포함해야 합니다. `Authorization: Bearer` 방식과 `api-key` 헤더 방식을 동시에 보내도 됩니다.

**Q. MCP 서버가 시작되지 않습니다.**
`npx -y` 플래그로 런타임 설치를 허용하거나, `npm install -g` 로 사전 설치하세요. `opencode --debug` 로 MCP 오류 로그를 확인할 수 있습니다.

**Q. DashScope 리전을 바꾸고 싶습니다.**
opencode.json의 `baseURL`을 아래 중 하나로 교체하세요:

```
싱가포르(국제): https://dashscope-intl.aliyuncs.com/compatible-mode/v1
미국 버지니아:  https://dashscope-us.aliyuncs.com/compatible-mode/v1
홍콩:          https://cn-hongkong.dashscope.aliyuncs.com/compatible-mode/v1
```

---

## 참고 링크

- [OpenCode 공식 문서](https://opencode.ai/docs/)
- [Oh My OpenCode MCP 목록](https://ohmyopencode.com/mcps/)
- [Qwen3-Coder 블로그 발표](https://qwenlm.github.io/blog/qwen3-coder/)
- [DashScope OpenAI 호환 API](https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope)
- [Azure OpenAI Codex 연동 가이드](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/codex)
- [MCP 공식 서버 목록](https://github.com/modelcontextprotocol/servers)
