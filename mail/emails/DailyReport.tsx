import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
  Button,
} from "@react-email/components";

// ─────────────────────────────────────────────────────────────────────────────
// 데이터 타입 — 서버에서 props로 주입
// ─────────────────────────────────────────────────────────────────────────────
export interface Candidate {
  code: string;
  name: string;
  sector: string;
  citation: {
    quote: string;
    source: string;
    date: string;
  };
  signal: {
    type: "매수" | "매도" | "관찰";
    reason: string; // 백테스트 지표 + 오늘 시황 반영
  };
}

export interface DailyReportProps {
  userName: string;
  date: string; // YYYY-MM-DD
  strategyTitle: string;
  marketSummary: {
    kospi: { close: number; changePct: number };
    kosdaq: { close: number; changePct: number };
    usdKrw: { close: number; changePct: number };
    foreignNet: number; // 억원
    note: string;
  };
  topNews: Array<{
    title: string;
    source: string;
    publishedAt: string;
    url?: string;
  }>;
  /** 오늘의 후보 종목 — citation(선정 근거)과 signal(매수/매도 신호)을 같은 종목에 묶음 */
  candidates: Candidate[];
  /** 마무리 자연어 코멘트 — 백테스트 성과 + 오늘 시황 + 비정형 데이터 + 리스크 */
  closing: string;
  reportUrl: string;
  unsubscribeUrl: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 미리보기용 기본 props
// ─────────────────────────────────────────────────────────────────────────────
const defaultProps: DailyReportProps = {
  userName: "육은서",
  date: "2025-12-08",
  strategyTitle: "정형 팩터 + 비정형 신호 복합 스코어 KOSPI200 월간 리밸런싱",
  marketSummary: {
    kospi: { close: 2634.2, changePct: 0.43 },
    kosdaq: { close: 859.1, changePct: -0.12 },
    usdKrw: { close: 1387.5, changePct: 0.08 },
    foreignNet: 2300,
    note: "외국인 2,300억 순매수. 반도체·2차전지 강세, 금융·유틸리티 약세.",
  },
  topNews: [
    { title: "삼성전자 HBM3E 엔비디아 공급 승인 완료", source: "한경", publishedAt: "07:12" },
    { title: "한국은행 기준금리 동결 3.00% 유지", source: "연합뉴스", publishedAt: "06:45" },
    { title: "美 PCE 예상치 하회… 연준 금리인하 기대 재상승", source: "한경", publishedAt: "06:20" },
    { title: "현대차 아이오닉9 美 출시, 첫 주 사전계약 1.2만 대", source: "매일경제", publishedAt: "06:05" },
    { title: "SK하이닉스 HBM4 선공급 계약, 2026 매출 +47% 전망", source: "미래에셋증권 리포트", publishedAt: "05:50" },
  ],
  candidates: [
    {
      code: "005930",
      name: "삼성전자",
      sector: "반도체",
      citation: {
        quote: "HBM3E 수율 안정화로 2026E EPS +21% 전망, 4Q D램 가격 반등 기대",
        source: "한국투자증권",
        date: "2025.04.21",
      },
      signal: {
        type: "매수",
        reason: "백테스트 모멘텀 스코어 92.4 + 외국인 순매수 5거래일 연속 + revision_breadth +18%p",
      },
    },
    {
      code: "000660",
      name: "SK하이닉스",
      sector: "반도체",
      citation: {
        quote: "HBM4 선공급 계약 체결, AI 서버향 매출 2026E +47% 전망",
        source: "미래에셋증권",
        date: "2025.04.18",
      },
      signal: {
        type: "매수",
        reason: "백테스트 종합 스코어 90.1 + 목표가 컨센 +22% 상향 + 거래량 20일 평균 ×1.6",
      },
    },
    {
      code: "035420",
      name: "NAVER",
      sector: "인터넷",
      citation: {
        quote: "HyperCLOVA X 기업 SaaS 수주 확대, 광고·커머스 트리플 성장 궤도 진입",
        source: "NH투자증권",
        date: "2025.04.15",
      },
      signal: {
        type: "매수",
        reason: "백테스트 종합 스코어 87.6 + AI SaaS 컨센서스 상향 가속",
      },
    },
    {
      code: "207940",
      name: "삼성바이오로직스",
      sector: "바이오",
      citation: {
        quote: "4공장 풀가동 + 5공장 2025Q4 가동, 수주잔고 2.1조 원 사상 최대",
        source: "키움증권",
        date: "2025.04.10",
      },
      signal: {
        type: "관찰",
        reason: "백테스트 퀄리티 93 우수, 단기 RSI 과열(73)로 진입 타이밍 대기",
      },
    },
    {
      code: "005380",
      name: "현대차",
      sector: "자동차",
      citation: {
        quote: "아이오닉9 글로벌 출시 + 北美 현지생산 확대, 2026E ROE 12% 전망",
        source: "삼성증권",
        date: "2025.04.09",
      },
      signal: {
        type: "매수",
        reason: "백테스트 종합 83.8 + 아이오닉9 사전계약 호조 뉴스 sentiment 87",
      },
    },
  ],
  closing:
    "이번 전략은 10년 백테스트 기준 KOSPI200 대비 +52.1%p 초과 수익을 기록했습니다. 오늘은 외국인 순매수와 반도체·2차전지 강세 환경이 후보 종목 모멘텀을 뒷받침할 것으로 보입니다. 다만 반도체·인터넷 비중이 40%에 달해 섹터 집중 리스크가 가장 큰 변수입니다. HBM 가격 조정 신호나 외국인 대규모 이탈 시점에는 비중 축소를 검토하세요.",
  reportUrl: "https://quantagent.kr/report/2025-12-08",
  unsubscribeUrl: "https://quantagent.kr/unsubscribe?u=demo",
};

// ─────────────────────────────────────────────────────────────────────────────
// 디자인 토큰
// ─────────────────────────────────────────────────────────────────────────────
const colors = {
  primary: "#1d4ed8",
  primaryLight: "#3b82f6",
  primarySoft: "#dbeafe",
  primaryFaint: "#eff6ff",
  text: "#0f172a",
  subtext: "#475569",
  muted: "#94a3b8",
  border: "#e2e8f0",
  bgPage: "#f1f5f9",
  bgCard: "#ffffff",
  bgSubtle: "#f8fafc",
  positive: "#1d4ed8",
  negative: "#dc2626",
};

const fontStack = `'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

// ─────────────────────────────────────────────────────────────────────────────
// 본문 — 5개 섹션
// ─────────────────────────────────────────────────────────────────────────────
export default function DailyReport(props: Partial<DailyReportProps> = {}) {
  const p = { ...defaultProps, ...props };

  return (
    <Html lang="ko">
      <Head />
      <Preview>{`${p.date} · KOSPI ${p.marketSummary.kospi.changePct >= 0 ? "+" : ""}${p.marketSummary.kospi.changePct}% · 오늘의 후보 ${p.candidates.length}종목`}</Preview>
      <Body style={{ backgroundColor: colors.bgPage, fontFamily: fontStack, margin: 0, padding: "32px 0" }}>
        <Container style={containerStyle}>
          {/* ─── 헤더 ───────────────────────────────────────────────── */}
          <Section style={{ padding: "28px 32px 20px" }}>
            <Text style={{ ...badgeStyle, margin: 0 }}>QuantAgent · Daily Report</Text>
            <Heading as="h1" style={titleStyle}>
              {p.userName}님, 오늘의 전략 리포트입니다
            </Heading>
            <Text style={{ ...subtitleStyle, margin: "6px 0 0" }}>
              {p.date} · {p.strategyTitle}
            </Text>
          </Section>

          <Hr style={hrStyle} />

          {/* ─── 1. 전일 시황 ────────────────────────────────────────── */}
          <Section style={sectionStyle}>
            <Text style={sectionLabelStyle}>1 · 전일 시황</Text>
            <Row style={{ marginTop: 12 }}>
              <Column style={{ width: "25%", paddingRight: 6 }}>
                <MarketCell label="KOSPI" value={p.marketSummary.kospi.close.toLocaleString("ko-KR", { minimumFractionDigits: 2 })} change={p.marketSummary.kospi.changePct} />
              </Column>
              <Column style={{ width: "25%", paddingRight: 6 }}>
                <MarketCell label="KOSDAQ" value={p.marketSummary.kosdaq.close.toLocaleString("ko-KR", { minimumFractionDigits: 2 })} change={p.marketSummary.kosdaq.changePct} />
              </Column>
              <Column style={{ width: "25%", paddingRight: 6 }}>
                <MarketCell label="원/달러" value={p.marketSummary.usdKrw.close.toLocaleString("ko-KR")} change={p.marketSummary.usdKrw.changePct} />
              </Column>
              <Column style={{ width: "25%" }}>
                <MarketCell
                  label="외국인 순매수"
                  value={`${p.marketSummary.foreignNet >= 0 ? "+" : ""}${p.marketSummary.foreignNet.toLocaleString("ko-KR")}억`}
                  changeText={p.marketSummary.foreignNet >= 0 ? "순매수" : "순매도"}
                  positive={p.marketSummary.foreignNet >= 0}
                />
              </Column>
            </Row>
            <Text style={{ ...bodyTextStyle, marginTop: 14 }}>{p.marketSummary.note}</Text>
          </Section>

          <Hr style={hrStyle} />

          {/* ─── 2. 주요 뉴스 요약 ──────────────────────────────────── */}
          <Section style={sectionStyle}>
            <Text style={sectionLabelStyle}>2 · 주요 뉴스 요약</Text>
            {p.topNews.map((n, i) => (
              <Row key={i} style={{ marginTop: i === 0 ? 12 : 8 }}>
                <Column style={{ width: 28, verticalAlign: "top" }}>
                  <Text style={{ ...newsIndexStyle, margin: 0 }}>{i + 1}</Text>
                </Column>
                <Column>
                  <Text style={{ ...newsTitleStyle, margin: 0 }}>
                    {n.url ? <Link href={n.url} style={newsLinkStyle}>{n.title}</Link> : n.title}
                  </Text>
                  <Text style={{ ...newsMetaStyle, margin: "2px 0 0" }}>
                    {n.source} · {n.publishedAt}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hrStyle} />

          {/* ─── 3. 오늘의 후보 종목 (선정 근거 인용) ──────────────────── */}
          <Section style={sectionStyle}>
            <Text style={sectionLabelStyle}>3 · 오늘의 후보 종목</Text>
            {p.candidates.map((c, i) => (
              <div
                key={c.code}
                style={{
                  backgroundColor: colors.bgSubtle,
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginTop: i === 0 ? 12 : 8,
                }}
              >
                <Text style={{ ...rationaleNameStyle, margin: 0 }}>
                  {c.name}
                  <span style={{ color: colors.muted, fontWeight: 400, marginLeft: 6, fontSize: 11 }}>{c.code}</span>
                  <span style={{ ...sectorChipStyle, marginLeft: 8 }}>{c.sector}</span>
                </Text>
                <Text style={{ ...rationaleQuoteStyle, margin: "8px 0 4px" }}>“{c.citation.quote}”</Text>
                <Text style={{ ...rationaleSourceStyle, margin: 0 }}>
                  — {c.citation.source} {c.citation.date}
                </Text>
              </div>
            ))}
          </Section>

          <Hr style={hrStyle} />

          {/* ─── 4. 매수 · 매도 · 관찰 신호 (위 후보 종목의 백테스트 + 시황 반영 신호) ── */}
          <Section style={sectionStyle}>
            <Text style={sectionLabelStyle}>4 · 매수 · 매도 · 관찰 신호</Text>
            {p.candidates.map((c, i) => (
              <Row key={c.code} style={{ marginTop: i === 0 ? 12 : 10 }}>
                <Column style={{ width: 64, verticalAlign: "top", paddingTop: 2 }}>
                  <SignalBadge type={c.signal.type} />
                </Column>
                <Column>
                  <Text style={{ ...signalNameStyle, margin: 0 }}>
                    {c.name}
                    <span style={{ color: colors.muted, fontWeight: 400, fontSize: 11, marginLeft: 6 }}>{c.code}</span>
                  </Text>
                  <Text style={{ ...signalReasonStyle, margin: "3px 0 0" }}>{c.signal.reason}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hrStyle} />

          {/* ─── 5. 마무리 — 자연어 코멘트 ───────────────────────────── */}
          <Section style={sectionStyle}>
            <Text style={sectionLabelStyle}>5 · 정리</Text>
            <Text style={{ ...closingStyle, margin: "12px 0 0" }}>{p.closing}</Text>
          </Section>

          {/* ─── CTA ─────────────────────────────────────────────────── */}
          <Section style={{ padding: "8px 32px 32px", textAlign: "center" }}>
            <Button href={p.reportUrl} style={ctaButtonStyle}>
              전체 리포트 보기
            </Button>
          </Section>

          {/* ─── 푸터 ────────────────────────────────────────────────── */}
          <Section style={footerStyle}>
            <Text style={{ ...footerTextStyle, margin: 0 }}>
              본 리포트는 시뮬레이션 결과이며 실제 투자 성과와 다를 수 있습니다.
              <br />
              수수료 0.015% · 거래세 0.23% · 슬리피지 0.1% 차감 후 기준
            </Text>
            <Text style={{ ...footerTextStyle, margin: "10px 0 0" }}>
              <Link href={p.reportUrl} style={footerLinkStyle}>대시보드</Link>
              {" · "}
              <Link href={p.unsubscribeUrl} style={footerLinkStyle}>수신 거부</Link>
            </Text>
            <Text style={{ ...footerCopyStyle, margin: "8px 0 0" }}>
              © 2025 QuantAgent · 한이음 ICT 멘토링 개미핥기
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 서브 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
function MarketCell({
  label,
  value,
  change,
  changeText,
  positive,
}: {
  label: string;
  value: string;
  change?: number;
  changeText?: string;
  positive?: boolean;
}) {
  const isPositive = change !== undefined ? change >= 0 : positive;
  const changeColor = isPositive ? colors.positive : colors.negative;
  return (
    <div style={{ backgroundColor: colors.bgSubtle, borderRadius: 6, padding: "10px 12px" }}>
      <Text style={{ fontSize: 10, color: colors.muted, margin: 0, lineHeight: 1.4 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.text, fontWeight: 700, margin: "2px 0 0", lineHeight: 1.3 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: changeColor, fontWeight: 600, margin: "2px 0 0", lineHeight: 1.3 }}>
        {change !== undefined ? `${change >= 0 ? "+" : ""}${change}%` : changeText}
      </Text>
    </div>
  );
}

function SignalBadge({ type }: { type: "매수" | "매도" | "관찰" }) {
  const map: Record<string, { bg: string; color: string }> = {
    매수: { bg: "#dcfce7", color: "#15803d" },
    매도: { bg: "#fee2e2", color: "#b91c1c" },
    관찰: { bg: "#fef3c7", color: "#92400e" },
  };
  const c = map[type] ?? { bg: colors.primarySoft, color: colors.primary };
  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: c.bg,
        color: c.color,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 4,
      }}
    >
      {type}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 스타일 — 본문 텍스트는 모두 12pt / lineHeight 1.6 / color subtext 로 통일
// ─────────────────────────────────────────────────────────────────────────────
const containerStyle = {
  width: 600,
  maxWidth: "100%",
  backgroundColor: colors.bgCard,
  borderRadius: 12,
  margin: "0 auto",
  border: `1px solid ${colors.border}`,
  overflow: "hidden" as const,
};

const sectionStyle = {
  padding: "20px 32px",
};

const hrStyle = {
  border: "none",
  borderTop: `1px solid ${colors.border}`,
  margin: 0,
};

const badgeStyle = {
  fontSize: 10,
  fontWeight: 700,
  color: colors.primary,
  letterSpacing: 1.2,
  textTransform: "uppercase" as const,
};

const titleStyle = {
  fontSize: 20,
  fontWeight: 800,
  color: colors.text,
  margin: "8px 0 0",
  lineHeight: 1.3,
};

const subtitleStyle = {
  fontSize: 12,
  color: colors.subtext,
  lineHeight: 1.6,
};

const sectionLabelStyle = {
  fontSize: 11,
  color: colors.muted,
  fontWeight: 700,
  letterSpacing: 1.2,
  textTransform: "uppercase" as const,
  margin: 0,
};

// 본문 통일 — 시황 코멘트 / 마무리 / 인용 / 신호 근거 모두 동일 베이스
const bodyTextStyle = {
  fontSize: 12,
  color: colors.subtext,
  lineHeight: 1.6,
  margin: 0,
};

const closingStyle = {
  fontSize: 12,
  color: colors.subtext,
  lineHeight: 1.7,
};

const newsIndexStyle = {
  fontSize: 11,
  color: colors.primary,
  fontWeight: 700,
  width: 18,
  height: 18,
  textAlign: "center" as const,
  lineHeight: "18px",
  backgroundColor: colors.primarySoft,
  borderRadius: 4,
};

const newsTitleStyle = {
  fontSize: 13,
  color: colors.text,
  fontWeight: 600,
  lineHeight: 1.5,
};

const newsLinkStyle = {
  color: colors.text,
  textDecoration: "none",
};

const newsMetaStyle = {
  fontSize: 11,
  color: colors.muted,
  lineHeight: 1.5,
};

const sectorChipStyle = {
  display: "inline-block",
  backgroundColor: colors.primarySoft,
  color: colors.primary,
  fontSize: 10,
  fontWeight: 600,
  padding: "1px 7px",
  borderRadius: 4,
  verticalAlign: "middle" as const,
};

const rationaleNameStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: colors.text,
  lineHeight: 1.5,
};

const rationaleQuoteStyle = {
  fontSize: 12,
  color: colors.text,
  lineHeight: 1.6,
  fontStyle: "italic" as const,
};

const rationaleSourceStyle = {
  fontSize: 11,
  color: colors.primary,
  fontWeight: 600,
};

const signalNameStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: colors.text,
};

const signalReasonStyle = {
  fontSize: 12,
  color: colors.subtext,
  lineHeight: 1.6,
};

const ctaButtonStyle = {
  backgroundColor: colors.primary,
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 700,
  padding: "12px 28px",
  borderRadius: 6,
  textDecoration: "none",
  display: "inline-block",
};

const footerStyle = {
  backgroundColor: colors.bgSubtle,
  padding: "20px 32px",
  textAlign: "center" as const,
  borderTop: `1px solid ${colors.border}`,
};

const footerTextStyle = {
  fontSize: 11,
  color: colors.subtext,
  lineHeight: 1.6,
};

const footerLinkStyle = {
  color: colors.primary,
  textDecoration: "none",
  fontWeight: 600,
};

const footerCopyStyle = {
  fontSize: 10,
  color: colors.muted,
};
