#!/usr/bin/env bash
# =============================================================
# opencode + oh-my-opencode + MCP 7종 + Qwen3-Coder + AOAI Codex
# 원클릭 설치 스크립트
# 실행: bash setup-opencode.sh
# =============================================================
set -euo pipefail

BOLD="\033[1m"; GREEN="\033[32m"; YELLOW="\033[33m"; CYAN="\033[36m"; RESET="\033[0m"
log()  { echo -e "${GREEN}[✓]${RESET} $*"; }
info() { echo -e "${CYAN}[→]${RESET} $*"; }
warn() { echo -e "${YELLOW}[!]${RESET} $*"; }

echo -e "\n${BOLD}══════════════════════════════════════════════${RESET}"
echo -e "${BOLD}   opencode · oh-my-opencode · MCP 통합 설치   ${RESET}"
echo -e "${BOLD}══════════════════════════════════════════════${RESET}\n"

# ── 0. 의존성 확인 ────────────────────────────────────────────
info "Node.js / npm 버전 확인..."
node --version || { echo "Node.js 18+ 필요. https://nodejs.org 에서 설치하세요."; exit 1; }
npm  --version

# ── 1. opencode 설치 ─────────────────────────────────────────
info "opencode 설치 중..."
npm install -g opencode-ai@latest
log "opencode $(opencode --version) 설치 완료"

# ── 2. oh-my-opencode 설치 ───────────────────────────────────
info "oh-my-opencode 설치 중..."
npm install -g oh-my-opencode@latest
log "oh-my-opencode 설치 완료"

# ── 3. MCP 서버 패키지 사전 캐시 (npx -y 로 런타임 설치도 가능) ──
info "MCP 서버 패키지 캐시 중..."
MCPS=(
  "@modelcontextprotocol/server-filesystem"
  "@modelcontextprotocol/server-github"
  "@modelcontextprotocol/server-memory"
  "@modelcontextprotocol/server-sqlite"
  "@modelcontextprotocol/server-brave-search"
  "@modelcontextprotocol/server-fetch"
)
for pkg in "${MCPS[@]}"; do
  info "  캐시: $pkg"
  npm install -g "$pkg" 2>/dev/null || warn "  $pkg 글로벌 설치 실패 (npx로 런타임 설치됩니다)"
done
log "MCP 패키지 준비 완료"

# ── 4. 설정 디렉터리 생성 ─────────────────────────────────────
CONFIG_DIR="${HOME}/.config/opencode"
mkdir -p "$CONFIG_DIR"
info "설정 디렉터리: $CONFIG_DIR"

# ── 5. 설정 파일 복사 ────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/opencode.json" ]; then
  cp "$SCRIPT_DIR/opencode.json" "$CONFIG_DIR/opencode.json"
  log "opencode.json → $CONFIG_DIR/opencode.json"
fi

if [ -f "$SCRIPT_DIR/oh-my-opencode.json" ]; then
  cp "$SCRIPT_DIR/oh-my-opencode.json" "$CONFIG_DIR/oh-my-opencode.json"
  log "oh-my-opencode.json → $CONFIG_DIR/oh-my-opencode.json"
fi

# ── 6. 환경변수 안내 ─────────────────────────────────────────
echo ""
warn "다음 환경변수를 ~/.bashrc 또는 ~/.zshrc에 추가하세요:"
echo ""
cat << 'ENVBLOCK'
  # Alibaba Cloud Qwen3-Coder
  export DASHSCOPE_API_KEY="sk-..."

  # Azure OpenAI Codex
  export AOAI_RESOURCE_NAME="your-resource-name"
  export AOAI_API_KEY="..."

  # GitHub MCP
  export GITHUB_TOKEN="ghp_..."

  # Brave Search MCP
  export BRAVE_API_KEY="BSA_..."

  # Exa AI (oh-my-opencode websearch)
  export EXA_API_KEY="exa-..."
ENVBLOCK

if [ -f "$SCRIPT_DIR/.env.opencode" ]; then
  cp "$SCRIPT_DIR/.env.opencode" "${HOME}/.env.opencode"
  warn ".env.opencode 템플릿 → ~/.env.opencode (값을 채운 뒤 source ~/.env.opencode)"
fi

# ── 7. 연결 확인 ─────────────────────────────────────────────
echo ""
info "설치 완료! 아래 명령으로 동작 확인:"
echo ""
echo "  opencode                         # 기본 실행 (Qwen3-Coder)"
echo "  opencode --model azure-codex/gpt-5-codex   # Codex 모드"
echo "  /switch-qwen                     # 세션 내 Qwen3 전환"
echo "  /switch-codex                    # 세션 내 Codex 전환"
echo "  /mcp                             # MCP 서버 상태 확인"
echo ""
log "셋업 완료 🎉"
