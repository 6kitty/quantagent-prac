"""
전략 검증 파이프라인 토이 프로젝트
─────────────────────────────────────────────────────────────
Phase 1. Web Search    : WebSearchTool로 전략 관련 최신 리서치 수집
Phase 2. Confidence    : Structured Output으로 각 근거별 일치도 + reasoning 평가
Phase 3. DB 저장       : SQLite에 리서치 세션 및 근거 항목 저장
Phase 4. Judge LLM     : DB 데이터를 읽어 독립 Judge가 전략 유효성 최종 판단
─────────────────────────────────────────────────────────────
"""

import os
import sqlite3
from datetime import datetime
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import PromptAgentDefinition, WebSearchTool
from openai import AzureOpenAI
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# ─── 검증할 투자 전략 ──────────────────────────────────────
STRATEGY = (
    "삼성전자 AI 반도체 모멘텀 전략 — "
    "HBM 수요 증가와 AI 슈퍼사이클에 기반한 중장기 매수 포지션"
)

# ═══════════════════════════════════════════════════════════
# Pydantic 스키마 정의
# ═══════════════════════════════════════════════════════════

class EvidenceItem(BaseModel):
    title: str
    url: str
    confidence_score: float       # 0.0 ~ 1.0: 전략과의 일치도
    confidence_reasoning: str     # 이 점수를 부여한 근거
    stance: str                   # "지지" / "반박" / "중립"

class ResearchReport(BaseModel):
    strategy: str
    evidence_items: list[EvidenceItem]
    overall_summary: str

class JudgeVerdict(BaseModel):
    strategy_validated: bool
    confidence_level: str         # "HIGH" / "MEDIUM" / "LOW"
    verdict_summary: str
    key_evidence_for: list[str]
    key_evidence_against: list[str]
    final_recommendation: str     # "진행" / "보류" / "기각"


# ═══════════════════════════════════════════════════════════
# Phase 1: Web Search로 리서치 수집
# ═══════════════════════════════════════════════════════════

def phase1_web_research() -> tuple[str, list[dict]]:
    print("[Phase 1] 웹 리서치 시작...")

    project = AIProjectClient(
        endpoint=os.environ["AZURE_FOUNDRY_ENDPOINT"],
        credential=DefaultAzureCredential(),
    )
    openai_client = project.get_openai_client()

    agent = project.agents.create_version(
        agent_name="strategy-researcher",
        definition=PromptAgentDefinition(
            model="gpt-4o",
            instructions=(
                "당신은 퀀트 리서처입니다. "
                "주어진 투자 전략의 유효성을 검증하기 위한 최신 시장 데이터와 뉴스를 수집하세요."
            ),
            tools=[WebSearchTool()],
        ),
        description="Strategy validation researcher",
    )

    text_parts: list[str] = []
    citations: list[dict] = []

    stream = openai_client.responses.create(
        stream=True,
        tool_choice="required",
        input=f"다음 투자 전략을 검증하기 위한 최신 데이터와 근거를 수집해주세요:\n{STRATEGY}",
        extra_body={"agent_reference": {"name": agent.name, "type": "agent_reference"}},
    )

    for event in stream:
        if event.type == "response.output_text.delta":
            text_parts.append(event.delta)
        elif event.type == "response.output_item.done":
            if event.item.type == "message" and event.item.content:
                last = event.item.content[-1]
                if last.type == "output_text":
                    for ann in last.annotations:
                        if ann.type == "url_citation":
                            citations.append({
                                "title": getattr(ann, "title", ann.url),
                                "url": ann.url,
                            })

    project.agents.delete_version(agent_name=agent.name, agent_version=agent.version)

    research_text = "".join(text_parts)
    print(f"[Phase 1] 완료 — 출처 {len(citations)}개 수집\n")
    return research_text, citations


# ═══════════════════════════════════════════════════════════
# Phase 2: Structured Output으로 Confidence 스코어링
# ═══════════════════════════════════════════════════════════

def phase2_score_confidence(research_text: str, citations: list[dict]) -> ResearchReport:
    print("[Phase 2] Confidence 스코어링 시작...")

    aoai = AzureOpenAI(
        api_key=os.environ["AZURE_OPENAI_KEY"],
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_version="2024-08-01-preview",
    )

    citations_str = "\n".join(
        f"- [{c['title']}]({c['url']})" for c in citations
    )

    response = aoai.beta.chat.completions.parse(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 투자 전략 검증 전문가입니다. "
                    "수집된 리서치 결과와 출처들을 분석하여 각 항목이 주어진 전략을 "
                    "얼마나 지지하는지 confidence_score(0.0~1.0)와 reasoning을 포함해 평가하세요."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"[검증 대상 전략]\n{STRATEGY}\n\n"
                    f"[리서치 결과 요약]\n{research_text[:3000]}\n\n"
                    f"[수집된 출처 목록]\n{citations_str}\n\n"
                    "각 출처별로 전략과의 일치도(confidence_score), 근거(reasoning), "
                    "입장(stance: 지지/반박/중립)을 평가하세요."
                ),
            },
        ],
        response_format=ResearchReport,
    )

    report: ResearchReport = response.choices[0].message.parsed
    print(f"[Phase 2] 완료 — {len(report.evidence_items)}개 항목 평가\n")
    return report


# ═══════════════════════════════════════════════════════════
# Phase 3: SQLite DB 저장
# ═══════════════════════════════════════════════════════════

def phase3_save_to_db(
    report: ResearchReport,
    db_path: str = "azure_AOAI/strategy_research.db",
) -> int:
    print("[Phase 3] DB 저장 시작...")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS research_sessions (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            strategy      TEXT,
            overall_summary TEXT,
            created_at    TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS evidence_items (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id            INTEGER,
            title                 TEXT,
            url                   TEXT,
            confidence_score      REAL,
            confidence_reasoning  TEXT,
            stance                TEXT,
            FOREIGN KEY (session_id) REFERENCES research_sessions(id)
        )
    """)

    cur.execute(
        "INSERT INTO research_sessions (strategy, overall_summary, created_at) VALUES (?, ?, ?)",
        (report.strategy, report.overall_summary, datetime.now().isoformat()),
    )
    session_id = cur.lastrowid

    for item in report.evidence_items:
        cur.execute(
            """INSERT INTO evidence_items
               (session_id, title, url, confidence_score, confidence_reasoning, stance)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (session_id, item.title, item.url,
             item.confidence_score, item.confidence_reasoning, item.stance),
        )

    conn.commit()
    conn.close()
    print(f"[Phase 3] 완료 — session_id={session_id}, db={db_path}\n")
    return session_id


# ═══════════════════════════════════════════════════════════
# Phase 4: Judge LLM 최종 판단
# ═══════════════════════════════════════════════════════════

def phase4_judge(
    session_id: int,
    db_path: str = "azure_AOAI/strategy_research.db",
) -> JudgeVerdict:
    print("[Phase 4] Judge LLM 판단 시작...")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute(
        "SELECT strategy, overall_summary FROM research_sessions WHERE id=?",
        (session_id,),
    )
    strategy, overall_summary = cur.fetchone()

    cur.execute(
        """SELECT title, url, confidence_score, confidence_reasoning, stance
           FROM evidence_items WHERE session_id=?""",
        (session_id,),
    )
    items = cur.fetchall()
    conn.close()

    evidence_str = "\n".join(
        f"- [{row[0]}] score={row[2]:.2f} | stance={row[4]}\n  reasoning: {row[3]}"
        for row in items
    )

    aoai = AzureOpenAI(
        api_key=os.environ["AZURE_OPENAI_KEY"],
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_version="2024-08-01-preview",
    )

    response = aoai.beta.chat.completions.parse(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 독립적인 투자 전략 심사위원(Judge)입니다. "
                    "제공된 리서치 근거들을 종합하여 전략의 유효성을 최종 판단하세요. "
                    "편향 없이 지지 근거와 반박 근거를 균형 있게 검토해야 합니다."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"[검증 대상 전략]\n{strategy}\n\n"
                    f"[전략 요약]\n{overall_summary}\n\n"
                    f"[수집된 근거 목록]\n{evidence_str}\n\n"
                    "위 근거들을 바탕으로 전략의 유효성을 최종 판단하고, "
                    "최종 권고사항(진행/보류/기각)을 결정하세요."
                ),
            },
        ],
        response_format=JudgeVerdict,
    )

    verdict: JudgeVerdict = response.choices[0].message.parsed
    print(f"[Phase 4] 완료 — {verdict.final_recommendation} ({verdict.confidence_level})\n")
    return verdict


# ═══════════════════════════════════════════════════════════
# 메인 파이프라인
# ═══════════════════════════════════════════════════════════

if __name__ == "__main__":
    print(f"\n{'='*60}")
    print("전략 검증 파이프라인")
    print(f"전략: {STRATEGY}")
    print(f"{'='*60}\n")

    # Phase 1: 웹 리서치
    research_text, citations = phase1_web_research()

    # Phase 2: Confidence 스코어링
    report = phase2_score_confidence(research_text, citations)

    # Phase 3: DB 저장
    session_id = phase3_save_to_db(report)

    # Phase 4: Judge 판단
    verdict = phase4_judge(session_id)

    # ─── 최종 출력 ─────────────────────────────────────────
    print(f"{'='*60}")
    print("=== 최종 Judge 판단 ===")
    print(f"전략 유효성  : {'✅ 유효' if verdict.strategy_validated else '❌ 무효'}")
    print(f"신뢰도 수준  : {verdict.confidence_level}")
    print(f"최종 권고    : {verdict.final_recommendation}")
    print(f"\n판단 요약:\n{verdict.verdict_summary}")
    print("\n[지지 근거]")
    for e in verdict.key_evidence_for:
        print(f"  + {e}")
    print("\n[반박 근거]")
    for e in verdict.key_evidence_against:
        print(f"  - {e}")
    print(f"{'='*60}\n")
