# KJ-EQH 연구 체험 사이트 (moipharmony.caipex.site)

**KJ-EQH** = Korea–Japan Examination Quality Harmonizer — 논문 「AI 기반 MOIP–JPO 특허심사
품질관리 조율체계 연구」(E(on). Jun, CAIPEX 학회지, 2026.9.)의 **연구 제안명**입니다.
운영 중인 양국 공동시스템이 아니며, 양청 실측 성능이 없습니다.

이 저장소는 논문 「AI 기반 MOIP–JPO 특허심사 품질관리 조율체계 연구」의 개발계획서를 구현한
**GitHub Pages 정적 연구 체험 사이트** 전체 소스입니다.
배포 주소: **https://moipharmony.caipex.site** · 저장소: `teamprotofelix/moipharmony`

> 상태 구분: `CURRENT PUBLIC PRACTICE` · `RESEARCH PROPOSAL` · `SIMULATION` ·
> `LIVE AI DRAFT` · `TARGET` · `MEASURED` — 모든 화면에서 라벨로 구분합니다.

## 사이트 구성 (12개 직접 접속 페이지)

| 경로 | 내용 |
| --- | --- |
| `/` | 연구의 문 — 연구 질문, 90초 설명, 3분 체험 진입, CAIPEX 지원 표기 |
| `/research/` | 논문과 연구의 범위 — 초록 풀이, 구조·가설·한계·서지 |
| `/learn/` | 왜 결과가 다를까 — 5가지 원인 카드 |
| `/experience/` | **3분 조율 체험** — 합성 H-01 7단계 완주, 세 바구니, 사람 검토 |
| `/lab/family/` | 패밀리·시점 실험실 — 타임라인 SVG, 신뢰도, 비교 스냅샷 |
| `/lab/claims/` | 청구항 대응 실험실 — 원문 병렬, diff, E1–E4 매핑, 번역 시뮬레이션 |
| `/lab/prior-art/` | 선행기술 실험실 — EXAMINER_CITED vs AI_DISCOVERED 분리, 증거 Trace |
| `/lab/discrepancies/` | 불일치 진단 실험실 — 7 클래스, 원인 그래프, TRUE/FALSE/UNKNOWN/NA |
| `/lab/rules/` | 법역·규칙 실험실 — 4 경계, 법역 프로필, 규칙 수명주기 |
| `/workspace/` | 조율 워크스페이스 — 가상 역할, Blind re-check, 검토 의견, 보고서 내보내기 |
| `/method/` | 검증과 거버넌스 — 지표 정의·분모·예외, TARGET/MEASURED, 로드맵 |
| `/sources/` | 출처와 연결 — MOIP/JPO/WIPO/CAIPEX, 3개 언어 용어집 |

합성 사건 H-01~H-08은 `src/data/cases/*.json`의 공개·합성 자료입니다. 실제 출원인의
개인정보, 미공개 출원, 기관 내부 의견을 포함하지 않습니다. `H-07`의 접근 제한 문서는
원문 없이 문서 식별자만 존재합니다(보호 경계 테스트로 검증됨).

## 기술 스택과 구조

- **Astro 5 + TypeScript** 정적 생성(SSG). React 없이 바닐라 TS 아일랜드 — 상호작용
  실험실은 결정적 규칙 평가기를 직접 호출합니다.
- **결정적 평가기** `src/lib/evaluate.ts` — `evaluateHarmony(...)`는 순수 함수로,
  같은 입력·같은 Rule 버전이면 같은 Trace를 반환합니다(재현성 테스트 포함).
  처리 순서: 자료등급·접근성 → 패밀리 연결 → 시점·청구항 정렬 → 문헌 날짜 → 원문·번역
  → 법역 프로필 → materiality → 검토 신호.
- **3개 언어(ko 기본) + 테마(system 기본)** — 정적 페이지는 ko로 빌드되고,
  `src/lib/i18n-runtime.ts`가 `?lang=en|ja`와 저장된 선택에 따라 텍스트·링크·제목을
  런타임 교체합니다. 원문 증거(한국어·일본어)는 번역하지 않고 해설만 병기합니다.
- **체험 상태**는 `sessionStorage`(새로고침·페이지 이동 후 복원, 기록 지우기로 삭제),
  언어·테마만 `localStorage`. 공유 URL에는 사건 ID·버전·단계 등 열거형 값만 담습니다.

```text
src/
├─ pages/            # 12개 직접 접속 페이지
├─ components/       # BaseLayout, Header, Footer, StatusBadge, HeroImage, CaseSummaryBar
├─ data/             # types.ts + cases/h01..h08.json (합성 사례)
├─ lib/              # evaluate.ts(결정적 평가기), state.ts, i18n-runtime.ts, lab-common.ts, ui.ts
├─ i18n/             # ko.ts / en.ts / ja.ts (키 집합은 Dict 타입으로 강제)
└─ styles/global.css
tests/               # vitest — 평가기 시나리오, i18n 키 완전성·문구 가드, 런타임 번역(jsdom)
public/
├─ CNAME             # moipharmony.caipex.site
└─ assets/images/    # 사용자 생성 이미지(아래 참조) — 없으면 CSS/SVG 대체
```

## 개발 명령

```bash
npm install
npm run dev       # 로컬 개발 (localhost:4321)
npm run check     # astro check — 타입 검사(번역 키 누락 = 빌드 오류)
npm test          # vitest — 평가기 시나리오·i18n·자료 보호·재현성
npm run build     # dist/ 정적 산출물
npm run preview   # 빌드 결과 확인
```

## 배포 (GitHub Pages)

1. **자동 배포** — `.github/workflows/pages.yml`이 push 시 `의존성 설치 → 타입 검사 →
   시나리오 테스트 → 정적 빌드 → Pages 배포`를 수행합니다.
2. **Pages 활성화(최초 1회)** — 저장소 `Settings → Pages → Build and deployment →
   Source: GitHub Actions` 선택. 이후 push마다 자동 배포됩니다.
3. **커스텀 도메인** — `public/CNAME`(moipharmony.caipex.site)이 배포 산출물에 포함되어
   자동 적용됩니다. DNS에는 이미 GitHub Pages를 가리키는 CNAME 레코드가 설정되어 있어야
   합니다(현재 확인됨: `moipharmony.caipex.site → GitHub Pages IP`).
4. **하위 경로 미리보기** — 도메인 설정 전 `teamprotofelix.github.io/moipharmony/`로
   미리보려면 `astro.config.mjs`의 `base`를 `'/moipharmony/'`로 임시 변경하세요.
   도메인 적용 후에는 `'/'`를 유지합니다.

## 사용자 생성 이미지 (선택)

`public/assets/images/`에 아래 **정확한 파일명**의 WebP(우선)/PNG를 넣으면 빌드 시 자동
적용됩니다. 파일이 없어도 화면은 CSS/SVG 대체로 완성됩니다. 생성 프롬프트·비율·ALT는
[public/assets/images/README.md](public/assets/images/README.md) 참조.

`harmony-hero` · `family-timeline` · `claim-alignment` · `evidence-bridge` ·
`human-review` · `research-horizon`

## 라이브 AI 확장 모드 (별도 서버 — 미구현)

GitHub Pages는 정적 배포이므로 **모델 키를 프런트에 넣지 않습니다.** 허가된 공개자료
분석을 켜려면 별도 서버를 두고 다음 계약을 구현합니다(계획 §4.2).

- `GET  /v1/capabilities` — 모델·어댑터·자료 유형; 미연결 시 프런트에 명시
- `POST /v1/families` — 공개 KR·JP 원문/메타 등록(가족은 `candidate`, provenance 기록)
- `POST /v1/families/{id}/align` — AI 요소대응·증거 초안 + 번역 불확실 + 비교 불가 사유
- `PATCH /v1/families/{id}/facts` — 사람 수정(버전 diff, 의존 Rule 무효화)
- `POST /v1/families/{id}/check` — 승인된 Fact로 TRUE/FALSE/UNKNOWN/NA + Evidence Trace
- `POST /v1/families/{id}/review` — 사람 검토 의견 기록
- `GET  /v1/families/{id}/report` — 자료범위·시점·출처·모델/Rule 버전·유보사항

서버 측 `.env`(`LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`)만 사용하고, 인증·호출량·
문서 크기 제한·허용 origin·전송기록·삭제 정책·prompt injection 방어를 갖춥니다.
긴 분석은 `job_id` + `queued/running/needs_human_review/completed/failed`로 표시하고,
실패를 미리 작성한 답으로 바꿔치기하지 않습니다. ST.96 외 확장 필드는
`harmonyExtension`으로 명시합니다. 서버 미연결 시에도 합성 8개 사건 체험은 완전히 동작합니다.

## 자료 보호 경계

| 등급 | 처리 |
| --- | --- |
| `PUBLIC` | 허가 범위의 링크/조회, 출처·취득시각 기록 |
| `OFFICE-SHARED` | 공개 체험에 미포함 |
| `RESTRICTED-DERIVED` | 공개 사이트/API에 미포함(원문 없이 식별자만 — H-07) |
| `CONFIDENTIAL-RAW` | 업로드·외부 전송 금지 |

## 검증 (수락 기준 ↔ 자동검증)

- H-01 기본 `TRUE` → 버전 전환 `CLAIM_VERSION_DIVERGENCE`/`NOT_APPLICABLE` → D1 날짜
  이동 `FALSE` → 원문·dossier 누락 `UNKNOWN` — `tests/evaluate.test.ts`
- H-05 법역 차이를 오류로 오인하지 않음 / H-07 제한자료 비공개 — 동일 파일
- 동일 입력·Rule 버전 재실행 일치(결정성) — 동일 파일
- 번역 키 완전성·금지 문구 가드·런타임 언어 교체 — `tests/i18n.test.ts`, `tests/i18n-runtime.test.ts`
- 키보드 완주·360px 대응·reduced motion·원문/번역 분리 — CSS·마크업으로 구현

## 연구·기술 출처

[CAIPEX](https://caipex.site/) · [MOIP](https://www.moip.go.kr/) ·
[JPO 품질관리](https://www.jpo.go.jp/e/introduction/hinshitu/shinsa/tokkyo/) ·
[JPO OPD](https://www.jpo.go.jp/e/support/j_platpat/patent_search/OPD_service.html) ·
[WIPO CASE](https://www.wipo.int/en/web/case) · [WIPO ST.96](https://www.wipo.int/standards/en/st96/) ·
[KIPRIS Plus](https://plus.kipris.or.kr/) · [GitHub Pages](https://docs.github.com/en/pages)
