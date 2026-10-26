#!/bin/bash
# MirWork 台灣版：本機示範（雙擊即可啟動）
cd "$(dirname "$0")"
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$HOME/.local/bin:$HOME/.claude/local:/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "找不到 Node.js，請先到 https://nodejs.org 安裝 LTS 版本，再雙擊一次。"; read -r; exit 1
fi
[ -d node_modules ] || { echo "第一次啟動：安裝套件中（約 1 分鐘）…"; npm install || { read -r; exit 1; }; }

if [ -f .env.local ] && grep -q '^ANTHROPIC_API_KEY=.' .env.local; then
  echo "✅ Mir 使用 Claude API（.env.local 裡的 key）"
elif command -v claude >/dev/null 2>&1; then
  export MIR_CLAUDE_CLI=1
  echo "✅ Mir 使用這台電腦的 Claude Code（你的 Claude 帳號）"
else
  echo "ℹ️  沒找到 Claude Code 或 API key，Mir 會用內建規則。"
fi

(sleep 6; open "http://localhost:3000") &
echo "網站：http://localhost:3000　（關掉這個視窗就會停止）"
npm run dev
