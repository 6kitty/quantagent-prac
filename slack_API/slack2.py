import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from dotenv import load_dotenv

load_dotenv()

client = WebClient(token=os.environ["SLACK_BOT_TOKEN"])


def list_channels():
    """봇이 접근 가능한 채널 목록 출력"""
    print("=" * 50)
    print("CHANNELS")
    print("=" * 50)
    try:
        channels = []
        cursor = None
        while True:
            resp = client.conversations_list(
                types="public_channel,private_channel",
                limit=200,
                cursor=cursor,
            )
            channels.extend(resp["channels"])
            cursor = resp.get("response_metadata", {}).get("next_cursor")
            if not cursor:
                break

        for ch in sorted(channels, key=lambda x: x["name"]):
            is_private = "🔒" if ch.get("is_private") else "  "
            member_count = ch.get("num_members", "?")
            print(f"  {is_private} #{ch['name']:<30} id={ch['id']}  members={member_count}")

        print(f"\n총 {len(channels)}개 채널\n")
    except SlackApiError as e:
        print(f"채널 조회 실패: {e.response['error']}")


def list_users():
    """워크스페이스 유저 목록 출력 (봇·비활성 제외)"""
    print("=" * 50)
    print("USERS")
    print("=" * 50)
    try:
        users = []
        cursor = None
        while True:
            resp = client.users_list(limit=200, cursor=cursor)
            users.extend(resp["members"])
            cursor = resp.get("response_metadata", {}).get("next_cursor")
            if not cursor:
                break

        active_users = [
            u for u in users
            if not u.get("is_bot") and not u.get("deleted") and u["id"] != "USLACKBOT"
        ]

        for u in sorted(active_users, key=lambda x: x.get("real_name", "")):
            email = u.get("profile", {}).get("email", "no email")
            print(f"  {u.get('real_name', u['name']):<25} id={u['id']}  email={email}")

        print(f"\n총 {len(active_users)}명 (봇·탈퇴 제외)\n")
    except SlackApiError as e:
        print(f"유저 조회 실패: {e.response['error']}")


if __name__ == "__main__":
    list_channels()
    list_users()
