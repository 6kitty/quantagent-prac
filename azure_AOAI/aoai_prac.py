import os
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import PromptAgentDefinition, WebSearchTool
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# AIProjectClient: Foundry 프로젝트 엔드포인트
project = AIProjectClient(
    endpoint=os.environ["AZURE_FOUNDRY_ENDPOINT"],
    credential=DefaultAzureCredential(),
)

openai = project.get_openai_client()

# ─── Agent 생성 (WebSearchTool 포함) ──────────────────────
agent = project.agents.create_version(
    agent_name="finance-analyst",
    definition=PromptAgentDefinition(
        model="gpt-4o",
        instructions="당신은 금융 시장 애널리스트입니다. 최신 데이터를 검색해 분석하세요.",
        tools=[WebSearchTool()],
    ),
    description="Web search agent for financial analysis.",
)

# ─── Responses API로 실행 (streaming) ─────────────────────
stream_response = openai.responses.create(
    stream=True,
    tool_choice="required",
    input="삼성전자 현재 시장 상황과 반도체 업황 전망을 분석해주세요.",
    extra_body={"agent_reference": {"name": agent.name, "type": "agent_reference"}},
)

# ─── Citations 분리 로직 ───────────────────────────────────
class Citation(BaseModel):
    title:   str
    url:     str
    content: Optional[str] = None

citations: list[Citation] = []
text_parts: list[str] = []

for event in stream_response:
    if event.type == "response.output_text.delta":
        text_parts.append(event.delta)
    elif event.type == "response.output_item.done":
        if event.item.type == "message":
            item = event.item
            if item.content and item.content[-1].type == "output_text":
                for annotation in item.content[-1].annotations:
                    if annotation.type == "url_citation":
                        citations.append(Citation(
                            title=getattr(annotation, "title", annotation.url),
                            url=annotation.url,
                        ))

# ─── Agent 정리 ───────────────────────────────────────────
project.agents.delete_version(agent_name=agent.name, agent_version=agent.version)

analysis_text = "".join(text_parts)

print("=== 분석 결과 ===")
print(analysis_text)
print("\n=== 출처 목록 ===")
for i, c in enumerate(citations, 1):
    print(f"[{i}] {c.title}")
    print(f"    {c.url}")
