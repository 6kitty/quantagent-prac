# QuantAgent 이메일 (Brevo)

데일리 리포트 자동 발송을 위한 React Email 프로젝트.

## 구성

```
mail/
├── emails/
│   └── DailyReport.tsx      # 6 섹션 뉴스레터 (props 기반 동적 렌더)
├── send.ts                  # Brevo Transactional API 송신 헬퍼
├── package.json
└── tsconfig.json
```

## 설치

```bash
cd mail
npm install
```

## 미리보기 (dev 서버)

```bash
npm run dev
```

→ http://localhost:3030 에서 디자인 미리보기. `emails/DailyReport.tsx`를 저장하면 즉시 리렌더.

## HTML 정적 export

```bash
npm run export
```

→ `out/` 폴더에 HTML 파일 생성. Brevo 대시보드 템플릿으로 업로드 가능.

## 발송 (서버 사이드)

```ts
import { sendDailyReport } from "./mail/send";

await sendDailyReport({
  to: "user@example.com",
  props: {
    userName: "육은서",
    date: "2025-12-08",
    strategyTitle: "...",
    marketSummary: { ... },
    topNews: [ ... ],
    candidates: [ ... ],
    rationales: [ ... ],
    signals: [ ... ],
    performance: { ... },
    reportUrl: "https://quantagent.kr/report/...",
    unsubscribeUrl: "https://quantagent.kr/unsubscribe?u=...",
  },
});
```

## 5개 섹션

1. **전일 시황** — KOSPI / KOSDAQ / 원달러 / 외국인 순매수 + 한 줄 코멘트
2. **주요 뉴스 요약** — 톱 5 뉴스 (제목 · 출처 · 시간)
3. **오늘의 후보 종목** — 사용자 전략 기반 상위 종목 + 선정 근거 인용 (애널리스트 리포트 / 뉴스)
4. **매수 · 매도 · 관찰 신호** — 위 후보 종목별 백테스트 지표 + 오늘 시황 반영 신호
5. **정리** — 백테스트 성과 + 오늘 시황 + 비정형 신호 + 리스크를 묶은 자연어 마무리

## 디자인 토큰

리포트 페이지(`recharts`)와 동일한 디자인 시스템:

- 메인 블루: `#1d4ed8`
- 텍스트: `#0f172a` (메인) / `#475569` (보조) / `#94a3b8` (희미)
- 보더: `#e2e8f0`
- 배경: `#f1f5f9` (페이지) / `#ffffff` (카드) / `#f8fafc` (서브)
- 손해/위험: `#dc2626`
- 폭: 600px (모바일은 미디어 쿼리로 100%)

## 환경 변수

```bash
BREVO_API_KEY=xkeysib-...
BREVO_SENDER="QuantAgent <noreply@quantagent.kr>"
```

## 자동 발송 (예시 cron)

매일 오전 8시 발송 (Node.js cron 또는 GitHub Actions):

```ts
// 08:00 KST 트리거 → 사용자 목록 조회 → 각 사용자별 데이터 빌드 → sendDailyReport
for (const user of activeUsers) {
  const props = await buildDailyReportProps(user);
  await sendDailyReport({ to: user.email, props });
}
```
