import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from dotenv import load_dotenv
load_dotenv()

# pip install slack_sdk
# Slack App: https://api.slack.com/apps → Bot Token Scopes: chat:write, im:write, users:read

client = WebClient(token=os.environ["SLACK_BOT_TOKEN"])

# ─── 1:1 다이렉트 메시지 ──────────────────────────────────
def send_dm(user_email: str, text: str) -> bool:
    try:
        # 이메일로 user_id 조회
        resp = client.users_lookupByEmail(email=user_email)
        user_id = resp["user"]["id"]

        # DM 채널 열기
        dm = client.conversations_open(users=[user_id])
        channel_id = dm["channel"]["id"]

        # 메시지 발송
        client.chat_postMessage(
            channel=channel_id,
            text=text,
            unfurl_links=False,
        )
        return True
    except SlackApiError as e:
        print(f"Slack 오류: {e.response['error']}")
        return False

# ─── 채널 공지 (Block Kit 리치 메시지) ────────────────────
def send_signal_alert(channel: str, ticker: str, signal: str,
                      price: float, confidence: float, reason: str):
    color = "#00d4aa" if signal == "BUY" else "#f87171"
    emoji = "🟢" if signal == "BUY" else "🔴"

    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"{emoji} QuantAgent 매매 신호"}
        },
        {
            "type": "section",
            "fields": [ # 표 
                {"type": "mrkdwn", "text": f"*종목*\n{ticker}"},
                {"type": "mrkdwn", "text": f"*신호*\n{signal}"},
                {"type": "mrkdwn", "text": f"*현재가*\n₩{price:,.0f}"},
                {"type": "mrkdwn", "text": f"*신뢰도*\n{confidence:.0%}"},
            ]
        },
        {"type": "divider"}, #구분선 
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*분석 근거*\n{reason}"} #마크다운 문법 
        }
    ]

    try:
        client.chat_postMessage(
            channel=channel,
            text=f"{ticker} {signal} 신호",   # fallback text
            attachments=[{"color": color, "blocks": blocks}]
        )
    except SlackApiError as e:
        print(f"채널 발송 실패: {e.response['error']}")

# ─── 사용 예시 ─────────────────────────────────────────────
send_dm("sixeunseoth@gmail.com", "오늘의 일일 리포트가 생성되었습니다.")
send_signal_alert(
    channel="#새-채널",
    ticker="삼성전자(005930)",
    signal="BUY",
    price=88400,
    confidence=0.86,
    reason="RSI 28.5 과매도 구간 진입 + MACD 골든크로스 확인"
)
