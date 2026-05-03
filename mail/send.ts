/**
 * Brevo Transactional Email 송신 헬퍼
 * ─────────────────────────────────────────────────────────────────────────────
 * 사용:
 *   import { sendDailyReport } from "./send";
 *   await sendDailyReport({
 *     to: "user@example.com",
 *     props: { userName: "...", date: "...", ... }
 *   });
 *
 * 환경 변수:
 *   BREVO_API_KEY     Brevo 대시보드 → SMTP & API → API Keys
 *   BREVO_SENDER      예) "QuantAgent <noreply@quantagent.kr>"
 */

import { render } from "@react-email/render";
import DailyReport, { DailyReportProps } from "./emails/DailyReport.js";

interface SendArgs {
  to: string | { email: string; name?: string };
  props: DailyReportProps;
  subject?: string;
}

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export async function sendDailyReport({ to, props, subject }: SendArgs) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY 환경 변수가 없습니다.");

  const senderHeader = process.env.BREVO_SENDER ?? "QuantAgent <noreply@quantagent.kr>";
  const senderMatch = senderHeader.match(/^(.*?)\s*<(.+)>$/);
  const sender = senderMatch
    ? { name: senderMatch[1], email: senderMatch[2] }
    : { email: senderHeader };

  // React Email 컴포넌트 → HTML/TEXT 두 본 모두 생성 (스팸 점수 개선)
  const htmlContent = await render(DailyReport(props));
  const textContent = await render(DailyReport(props), { plainText: true });

  const recipient = typeof to === "string" ? { email: to } : to;
  const subjectLine =
    subject ??
    `[${props.date}] ${props.userName}님의 QuantAgent 데일리 리포트 — 후보 ${props.candidates.length}종목`;

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender,
      to: [recipient],
      subject: subjectLine,
      htmlContent,
      textContent,
      // 추적/태그
      tags: ["daily-report", `date-${props.date}`],
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Brevo 송신 실패 (${res.status}): ${errorBody}`);
  }

  return (await res.json()) as { messageId: string };
}
