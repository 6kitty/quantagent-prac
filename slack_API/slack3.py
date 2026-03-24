import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from dotenv import load_dotenv

load_dotenv()

client = WebClient(token=os.environ["SLACK_BOT_TOKEN"])

# ─── 1:1 다이렉트 메시지 ──────────────────────────────────────
def send_dm(user_email: str, text: str) -> bool:
    try:
        resp = client.users_lookupByEmail(email=user_email)
        user_id = resp["user"]["id"]

        dm = client.conversations_open(users=[user_id])
        channel_id = dm["channel"]["id"]

        client.chat_postMessage(
            channel=channel_id,
            text=text,
            unfurl_links=False,
        )
        print(f"[DM 성공] {user_email} → '{text[:30]}...'")
        return True
    except SlackApiError as e:
        print(f"[DM 실패] {e.response['error']}")
        return False


# ─── 채널 공지 메시지 (Block Kit 리치 메시지) ──────────────────
def send_channel_notice(channel_id: str, title: str, body: str) -> bool:
    """
    channel_id: 채널 ID (C로 시작하는 값, slack2.py로 조회 가능)
    """
    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"📢 {title}"}
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": body}
        }
    ]

    try:
        client.chat_postMessage(
            channel=channel_id,
            text=title,  # fallback text (알림 미리보기)
            blocks=blocks,
        )
        print(f"[채널 공지 성공] {channel_id} → '{title}'")
        return True
    except SlackApiError as e:
        print(f"[채널 공지 실패] {e.response['error']}")
        return False


# ─── 실행 ─────────────────────────────────────────────────────
if __name__ == "__main__":
    # ① 1:1 DM 테스트
    send_dm(
        user_email="sixeunseoth@gmail.com",
        text="안녕하세요! slack3.py DM 테스트 메시지입니다."
    )

    # ② 채널 공지 테스트
    # 채널 ID는 slack2.py 실행 후 id= 값을 복사해서 사용
    CHANNEL_ID = "C0ANJPTR8A0"  # ← 실제 채널 ID로 교체
    send_channel_notice(
        channel_id=CHANNEL_ID,
        title="공지 테스트",
        body="*slack3.py* 채널 공지 테스트 메시지입니다.\n채널에 봇이 초대되어 있어야 전송됩니다."
    )
