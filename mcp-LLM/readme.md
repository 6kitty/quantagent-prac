# opencode + MCP 연결

## opencode란?

터미널에서 실행하는 AI 코딩 어시스턴트 CLI. Claude Code, Cursor와 비슷한 포지션인데 **완전 오픈소스**고 LLM 프로바이더를 자유롭게 교체할 수 있다.

**이 설정에서 쓸 수 있는 모델**

| 모델 | 특징 | 비용 |
|-----|------|------|
| Qwen3-Coder Plus | 131K 컨텍스트, 코딩 특화, 생각 모드 지원 | DashScope 과금 (저렴) |
| Azure GPT-5 Codex | 200K 컨텍스트, 멀티모달, 레포 전체 인식 | Azure AOAI 과금 |

**활용 시나리오**

- 프로젝트 루트에서 `opencode` 실행 → 파일 읽고 코드 수정 요청
- `/review` — 현재 git diff를 한국어로 코드 리뷰
- `/docgen` — 열려있는 파일에 JSDoc/TSDoc 자동 생성
- MCP로 GitHub 이슈 조회, 웹 검색, SQLite 쿼리를 대화 중에 바로 실행
- `/think` 붙이면 Qwen3가 생각 모드로 복잡한 문제 단계별 분석

---

# 설치

## 1단계 — 원클릭 설치 스크립트 실행

```bash
bash mcp-LLM/setup-opencode.sh
```

스크립트가 순서대로 처리하는 항목:

| 단계 | 내용 |
|-----|------|
| 0 | Node.js 18+ / npm 설치 확인 |
| 1 | `opencode-ai` 글로벌 설치 |
| 2 | `oh-my-opencode` 글로벌 설치 (커스텀 커맨드 플러그인) |
| 3 | MCP 서버 패키지 6종 사전 캐시 (`server-sqlite`, `server-fetch`는 실패해도 `npx -y`로 런타임 설치) |
| 4 | `~/.config/opencode/` 디렉터리 생성 |
| 5 | `opencode.json`, `oh-my-opencode.json` 설정 파일 복사 |
| 6 | `.env.opencode` 템플릿을 `~/` 로 복사 후 환경변수 안내 출력 |

> **스크립트 위치 주의** — `BASH_SOURCE[0]` 기준으로 같은 폴더의 파일을 복사하므로
> 반드시 `mcp-LLM/` 안에 있는 `opencode.json`, `oh-my-opencode.json`, `.env.opencode`가 있어야 한다.

## 2단계 — API 키 입력

```bash
nano ~/.env.opencode   # 또는 원하는 에디터로 열기
```

```bash
# Alibaba Cloud Qwen3-Coder
export DASHSCOPE_API_KEY="sk-..."

# Azure OpenAI Codex
export AOAI_RESOURCE_NAME="your-resource-name"
export AOAI_API_KEY="..."

# GitHub MCP
export GITHUB_TOKEN="ghp_..."

# Brave Search MCP (선택)
export BRAVE_API_KEY="BSA_..."

# Exa AI 웹 검색 (선택)
export EXA_API_KEY="exa-..."
```

```bash
source ~/.env.opencode
```

---

# Windows 주의사항

`opencode.json` 경로값에 백슬래시(`\`)를 쓰면 JSON 파싱 오류가 난다.

```
InvalidEscapeCharacter at line 59
   "C:\Users\yes08/projects"
```

**해결** — 슬래시(`/`)로 통일:

```json
"args": [
  "-y",
  "@modelcontextprotocol/server-filesystem",
  "C:/Users/yes08/projects"
]
```

---

# 실행

```bash
opencode                                    # 기본 (Qwen3-Coder)
opencode --model azure-codex/gpt-5-codex   # Azure Codex
```

세션 내 커맨드:

| 커맨드 | 동작 |
|-------|------|
| `/switch-qwen` | Qwen3-Coder로 전환 |
| `/switch-codex` | Azure GPT-5 Codex로 전환 |
| `/mcp` | MCP 서버 상태 확인 |
| `/review` | git diff 코드 리뷰 (한국어) |
| `/docgen` | 현재 파일 문서화 자동 생성 |

상세 설정 (MCP 9종, 프로바이더 옵션, FAQ) → [opencode-setup-guide.md](opencode-setup-guide.md)
