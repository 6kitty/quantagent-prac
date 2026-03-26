import os
from openai import AzureOpenAI  # 중요: OpenAI 대신 AzureOpenAI를 임포트하세요!
from dotenv import load_dotenv

load_dotenv()
client = AzureOpenAI(
    api_key=os.environ["AZURE_OPENAI_KEY"],
    # base_url 대신 azure_endpoint를 사용하는 것이 더 안전합니다.
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"], 
    api_version="2024-06-01",  # AzureOpenAI 클래스에서는 이 인자를 정상적으로 인식합니다.
)

response = client.chat.completions.create(
    model="gpt-4o",  # 주의: gpt-4o 같은 모델명이 아니라, Azure 포털에서 설정한 '배포 이름'을 쓰셔야 합니다.
    messages=[
        {"role": "user", "content": "안녕! 잘 작동하니?"}
    ],
    max_tokens=2000,
)

print(response.choices[0].message.content)