# AI 기반 MOIP–JPO 특허심사 품질관리 조율체계 연구 체험 사이트 개발계획

> **개발용 LLM에 바로 전달할 구현 명세** · 2026년 9월  
> **기준 논문:** E(on). Jun, 「AI 기반 MOIP–JPO 특허심사 품질관리 조율체계 연구」, CAIPEX 학회지, 2026.9.  
> **연구 지원:** [CAIPEX](https://caipex.site/) 학회의 지원을 받는 연구  
> **배포 목표:** GitHub Pages 다중 페이지 정적 체험 사이트. 허가된 공개 자료를 실제 AI로 분석하는 확장 모드는 별도 서버 연결.  
> **명칭:** KJ-EQH = Korea–Japan Examination Quality Harmonizer. 논문의 **연구 제안명**이지 운영 중인 양국 공동시스템의 명칭이 아니다.

## 0. 개발용 LLM에 주는 최우선 지시

첨부 논문 DOCX/PDF와 이 문서를 기준으로, 방문자가 **같은 특허패밀리의 한국·일본 심사자료를 직접 대조하며 불일치의 원인을 찾아가는** 연구 체험 사이트의 **실행 가능한 전체 소스**를 구현하라. 방문자는 가상의 한국·일본 청구항 버전을 선택하고, 선행문헌 D1의 한쪽 인용 여부를 바꾸고, 양국의 원문 근거와 적용 기준을 대조한 뒤, `정당한 차이 / 재검토 후보 / 판단 유보`가 어떻게 갈리는지 직접 확인해야 한다.

**핵심 명제:** 심사결과가 다르다는 사실만으로 심사 오류가 되는 것은 아니다. 비교 대상 청구항의 시점과 범위, 문헌의 관련 날짜, 번역·증거, 양국의 별도 법적 기준을 먼저 맞춘다. 그 후에도 설명되지 않는 중요한 누락만 **사람이 검토할 후보**로 표시한다.

CAIPEX의 지원은 명시하되 한국 지식재산처(MOIP)·일본 특허청(JPO)의 공식 공동사업, 양청 간 합의, 운용 중인 시스템 또는 양청의 공식 결론처럼 표현하지 않는다. 현재 논문은 **시스템 설계와 검증계획**이며 제안한 KJ-EQH의 양청 실측 성능은 없다. 합성 수치와 연구 목표치를 성과처럼 표기하지 않는다.

사용자 요청의 “이번에도 마찬가지”에 맞춰 **한국어·영어·일본어**, `system | light | dark` 테마와 **system 기본값**, 사용자 제작 이미지의 지정 폴더 자동 적용, GitHub Pages 직접 URL, 개발용 MASTER PROMPT까지 포함한다.

## 1. 첫 화면에서 전달할 연구 이야기

> **같은 발명인데 한국과 일본의 심사결과가 다르다면, 무엇을 먼저 확인해야 할까?**  
> 같은 패밀리인가 → 같은 시점·범위의 청구항인가 → 당시 이용 가능한 문헌인가 → 동일한 구성요소를 어떻게 대응했는가 → 각국 기준이 어떻게 다른가 → 남은 차이가 재검토할 품질 신호인가?

홈의 주요 버튼은 `3분 비교 체험`과 `연구 구조 살펴보기`. 로그인 없이 작동하는 **전문가 검수 합성 사례**를 먼저 제공한다. 별도 공개자료 AI 분석 서버가 연결된 경우에만 `실제 AI로 공개 패밀리 분석` 버튼을 활성화한다. 두 모드의 상태 라벨은 화면마다 유지한다.

| 라벨 | 뜻 | 사용 위치 |
| --- | --- | --- |
| `CURRENT PUBLIC PRACTICE` | 출처로 확인한 기존 공개 협력·품질관리·정보조회 방식 | 연구 소개와 자료 페이지 |
| `RESEARCH PROPOSAL` | 논문이 제안하는 KJ-EQH, 공통 계약, Rule, 단계별 구현 | 설계·방법 페이지 |
| `SIMULATION` | 이 사이트의 합성 사건·미리 만든 결과·결정적 규칙 | 모든 가상 체험 화면 |
| `LIVE AI DRAFT` | 별도 서버의 AI가 공개·허가된 입력으로 작성한 **검토 초안** | 실제 AI 모드 |
| `TARGET` | 아직 검증해야 하는 목표치 | 방법·평가 페이지 |
| `MEASURED` | 재현 조건과 출처를 갖춘 실측 결과 | 현재는 빈 상태; 자료가 생긴 뒤에만 사용 |

공개 출처인 JPO의 [OPD](https://www.jpo.go.jp/e/support/j_platpat/patent_search/OPD_service.html)는 패밀리의 심사 경과자료를 함께 보는 서비스이며, [WIPO CASE](https://www.wipo.int/en/web/case)는 참여 관청이 제공한 자료를 권한에 따라 참조하는 체계다. 이 사이트의 KJ-EQH 불일치 분류나 공동 승인 기능이 두 서비스에 이미 들어 있다고 주장하지 않는다. [ST.96](https://www.wipo.int/standards/en/st96/)의 공통 XML 구조를 참고하되 청구항 대응·증거 span·규칙 버전은 **이 연구의 확장정보**라고 표시한다.

## 2. 사이트 정보 구조: 12개 직접 접속 페이지

| 경로 | 페이지명 | 반드시 구현할 내용과 행동 |
| --- | --- | --- |
| `/` | 연구의 문 | 연구 질문, CAIPEX 지원, 90초 설명, 3분 체험, 상태 라벨 |
| `/research/` | 논문과 연구의 범위 | 초록 쉬운 풀이, KJ-EQH 구조·가설·한계·논문 서지 |
| `/learn/` | 왜 결과가 다를까 | 패밀리/청구항 버전/인용문헌/사실대응/법역차이의 5가지 원인을 카드로 학습 |
| `/experience/` | 3분 조율 체험 | 가상 H-01 한 사건을 7단계로 완주하고 검토 상태가 실제 변경됨 |
| `/lab/family/` | 패밀리·시점 실험실 | 우선권 연결 신뢰도, 양국 출원, 보정 타임라인, 비교 시점 선택 |
| `/lab/claims/` | 청구항 대응 실험실 | KR–JP 원문 병렬 보기, 버전 diff, 구성요소 E1–E4 매핑·번역 확인 |
| `/lab/prior-art/` | 선행기술 실험실 | 실제 인용 D1 vs AI가 사후 발견한 D2, 날짜·출처·요소별 근거 |
| `/lab/discrepancies/` | 불일치 진단 실험실 | 7개 클래스 분류, `TRUE/FALSE/UNKNOWN/NOT_APPLICABLE`, 이유 추적 |
| `/lab/rules/` | 법역·규칙 실험실 | Common Quality, KR Legal, JP Legal, Cross-Office, Human-only 경계 |
| `/workspace/` | 조율 워크스페이스 | 두 관청의 독립 검토, 원문 근거, 검토 요청·기각·유보·차이점 보고서 |
| `/method/` | 검증과 거버넌스 | 공개/제한 자료 경계, 후향적 평가, 지표·분모·실패사례·단계별 검증 |
| `/sources/` | 출처와 연결 사이트 | 논문, MOIP/JPO/WIPO 원문, CAIPEX, 관련 연구 사이트, 3개 언어 용어집 |

전역 메뉴는 `연구 / 빠른 체험 / 비교 실험실 / 사람의 검토 / 방법과 자료`로 그룹화한다. 모바일에서 같은 항목으로 이동할 수 있어야 한다. 상단의 `선택한 사건 · KR 청구항 버전 · JP 청구항 버전 · 비교 기준일 · 현재 분류` 요약은 체험 중 계속 보인다. 모든 Lab에서 다음 단계와 원문으로 돌아가기 버튼을 제공한다.

### 2.1 3분 체험 H-01: D1 한쪽 인용

가상 패밀리 H-01의 공개·합성 자료만 사용한다. **기준 상태**는 동일한 시점에 실질적으로 대응하는 E1+E2+E3 구성의 KR/JP 청구항. 한국의 당시 심사자료에는 중요한 D1이 인용돼 있고 일본의 당시 기록에는 없다. D1의 관련 날짜와 원문·요소 대응이 합성 사건 안에서 명확히 준비되어 있다. 이때 `KJ-HARM-PA-001`은 **재검토 신호 `TRUE`**를 생성한다. 이는 JPO 심사가 잘못됐다는 결론이 아니다.

| 단계 | 사용자의 실제 행동 | 화면의 변화 |
| --- | --- | --- |
| 1 | 패밀리 연결을 확인 | KR/JP 사건의 우선권·패밀리 근거와 신뢰도가 표시됨 |
| 2 | 양국 청구항의 보정 시점을 맞춤 | E1–E3 대응과 diff가 병렬로 표시됨 |
| 3 | 한국의 D1 인용과 일본의 미인용을 선택 | `EXAMINER_CITED`와 `AI_DISCOVERED`를 다른 영역으로 보여줌 |
| 4 | D1 원문·관련 날짜·E3 대응 span을 열어 봄 | 검토 신호가 어떤 사실·증거에 의존하는지 Trace에 표시 |
| 5 | 한국 청구항을 E4가 추가된 **다른 보정 버전**으로 전환 | `CLAIM_VERSION_DIVERGENCE`가 먼저 나타나고 기존 경보가 무효화됨 |
| 6 | 같은 범위로 복원한 뒤 D1 날짜를 비교 기준일 이후로 전환 | 당시 이용 가능한 중요자료로 볼 수 없는 조건이 표시되고 신호 해제 |
| 7 | 일본 원문 번역 신뢰도 또는 dossier 문서를 낮음·누락으로 설정 | `UNKNOWN`: 필요한 원문·자료를 특정. 사람의 독립 검토 후 결론 기록 |

마지막 화면에 `검토해야 할 차이`, `정당하게 설명된 차이`, `아직 모르는 점` 세 바구니가 채워진다. `사람의 검토 요청`을 선택하면 JPO 측 검토자 역할 화면에 **상대 관청의 법률결론을 복사하지 않고 D1 원문을 독립 검토**하는 절차가 나온다. 사용자는 `CONFIRMED_GAP`, `REJECTED`, `LEGAL_DIVERGENCE`, `DEFERRED` 중 근거와 함께 고른다. 선택은 사이트 안의 시연 기록이며 실제 관청으로 전송되지 않는다.

### 2.2 추가 합성 시나리오

| ID | 상황 | 기대 분류·체험 포인트 |
| --- | --- | --- |
| H-02 | 양청 모두 미인용, AI가 나중에 D2 후보를 찾음 | `AI_DISCOVERED_REFERENCE`; 과거 심사관 인용으로 둔갑시키지 않음 |
| H-03 | 같은 D1이지만 E3 대응 구절과 원문 해석이 다름 | `FACT_DIVERGENCE`; 양국 원문 span을 클릭해 직접 대조 |
| H-04 | 일본 청구항은 E4를 포함하고 한국 청구항은 E1–E3 | `CLAIM_VERSION_DIVERGENCE`; 결과만 비교해 품질결함이라고 하지 않음 |
| H-05 | 사실관계는 같으나 적용 기준에 정당한 차이가 있음 | `LEGAL_PROFILE_DIVERGENCE`; KR 규칙을 JP에 강제로 적용하지 않음 |
| H-06 | 일본어 전문용어 번역의 의미가 불확실함 | `UNKNOWN`; 원문 가능한 사람에게 확인 요청 |
| H-07 | 한쪽 기록의 일부가 공개되지 않았음 | `UNKNOWN_DATA_RESTRICTED`; 접근권한 없는 문서를 확보한 척하지 않음 |
| H-08 | 반복되는 증거 누락 패턴을 AI가 규칙 후보로 제시 | `DRAFT → REVIEW → REGRESSION → SHADOW → APPROVED`; AI의 즉시 활성화 금지 |

사례 자료에는 실제 출원인의 개인정보, 미공개 출원, 기관 내부 의견을 넣지 않는다. 실제 공개 사건을 추후 사용하려면 인용·재사용 조건과 비식별 필요성을 별도로 확인한다.

## 3. 핵심 실험실의 동작 계약

### 3.1 패밀리·청구항 타임라인

좌측 KR, 우측 JP의 **서로 다른 절차 타임라인**을 보여준다. 우선권·패밀리 식별 신뢰도, 출원/공개/보정/통지/인용의 날짜, 각 사건의 공개 범위를 선택한다. 중간의 `비교 가능한 스냅샷`은 **해당 시점의 청구항 텍스트와 그 시점에 조회 가능했던 기록**을 조합한다. 사용자가 다른 버전을 고르면 구성이 `E1+E2+E3 → E1+E2+E3+E4`로 변한 diff와 경보의 무효화 이유를 같이 보여준다.

패밀리 식별이 낮은 신뢰도면 경보 계산을 멈추고 `UNKNOWN_FAMILY`로 둔다. `같은 패밀리`가 `같은 청구항 범위`를 자동으로 뜻하지 않는다. 적용 Rule 버전과 출원/보정 시점은 데이터에 고정한다. 사용자가 현재의 청구항을 과거의 인용문헌 기록과 섞는 오류를 방지한다.

### 3.2 한·일 원문과 구성요소 대응

KR 청구항 원문과 JP 원문을 병렬로 제공하고 번역은 **원문 옆의 별도 층**으로 표시한다. E1–E4 요소 카드를 선택하면 두 원문의 정확한 구절과 문서 위치로 이동한다. `E3 대응 확실 / 의미상 유사하지만 불확실 / 대응 없음`을 구별한다. 언어모델이 제안한 대응은 `AI 초안` 배지이며 심사관 또는 검토자가 원문을 확인하기 전에는 확정하지 않는다.

`번역 오류 시뮬레이션`에서 용어 하나를 바꾸면 요소 대응 신뢰도가 낮아지고 관련 규칙 결과가 `UNKNOWN`으로 바뀐다. 값만 바뀌는 슬라이더가 아니라 **어느 구절의 의미가 왜 달라졌는지**를 보여준다. 일본어 원문에 한글 해설을 제공해도 인용 구절은 원문 그대로 보존한다.

### 3.3 선행기술과 Evidence Trace

문헌 목록은 `해당 사건 당시 심사관이 실제로 인용`과 `후향적으로 AI가 발견한 검색 후보`를 시각·데이터 모두 분리한다. 각 문헌의 공개/우선일, family, 출처, 인용된 청구요소, 원문 위치, 취득시각, 현재 이용 가능 여부를 표시한다. `원문 보기` → `해당 구성 강조` → `규칙 입력으로 돌아가기` 양방향 탐색이 가능하다. 외부 자료가 일부만 있으면 문헌의 요지만 보고 **E3의 개시가 확인됐다**고 선언하지 않는다.

사례 D1의 구조화 결과와 원문을 비교해 사용자가 `이 구절은 E3가 아니다`를 선택하면 요소대응 Fact가 수정되고 Trace와 경보가 다시 계산된다. 이때 AI의 후보 D2는 과거 심사관의 인용 자료로 바뀌지 않는다.

### 3.4 불일치 분류와 점검 규칙

논문의 7개 분류를 그대로 둔다. `DATA_DIVERGENCE`, `CLAIM_VERSION_DIVERGENCE`, `SEARCH_DIVERGENCE`, `FACT_DIVERGENCE`, `LEGAL_PROFILE_DIVERGENCE`, `QUALITY_DEFECT_CANDIDATE`, `UNKNOWN`. 하나의 사건에 여러 원인이 공존할 수 있으므로 **분류의 원인 그래프**를 보여준다. 처리 순서는 `자료 존재 → 패밀리·버전 → 문헌 날짜·검색 → 사실/원문 대응 → 법역 → 설명되지 않는 중요 품질 이슈`다. 앞 단계가 미확인인데 마지막 품질 결함을 확정하지 않는다.

| 평가 상태 | 뜻 | 표시할 다음 행동 |
| --- | --- | --- |
| `TRUE` | 규칙의 **품질 재검토 신호 조건**이 근거와 함께 충족 | 해당 관청의 사람이 독립 검토 |
| `FALSE` | 필요한 자료를 확인했지만 신호 조건 불충족 | 근거를 남기고 종료 또는 다음 규칙 |
| `UNKNOWN` | 자료·번역·대응이 부족해 판정 불가 | 정확히 어떤 문서·원문·검증이 필요한지 제시 |
| `NOT_APPLICABLE` | 사건·시점·법역·청구범위가 규칙 적용 대상 아님 | 비교 조건 재선택 |

`TRUE = 다른 관청의 심사 오류 확정`이라는 문구는 금지한다. 색뿐 아니라 상태명·아이콘·설명문을 같이 사용한다.

**KJ-HARM-PA-001 시연 규칙:** 실질적으로 대응하는 KR–JP 청구항, 이용 가능한 중요 D1, 한쪽의 실제 인용·다른 쪽의 미인용, 구성요소 근거와 비교시점이 모두 확인되면 `TRUE` **검토 후보**. 청구범위가 실질적으로 다르거나 D1을 기준일 당시 이용할 수 없었다면 적용 제외/신호 불충족의 근거를 보여준다. 확인에 필요한 dossier나 번역이 빠졌다면 `UNKNOWN`. 심사관은 D1을 독립적으로 검토한다.

### 3.5 규칙의 네 경계

| 층 | 용도 | 이 사이트에서 하는 일 |
| --- | --- | --- |
| Common Quality Rules | 자료·버전·인용·원문 출처의 형식 및 증거 검사 | 양쪽에 같은 의미로 적용 가능한 예시 실행 |
| KR Legal Profile | 한국 법적 평가 기준 | 별도 탭에서 출처·유효 시점 확인, JP에 적용 금지 |
| JP Legal Profile | 일본 법적 평가 기준 | 원문·번역·유효 시점 병기, KR에 적용 금지 |
| Cross-Office Harmony Rules | 원문·검색·요소대응의 불일치 신호 | 심사관 검토 후보만 생성 |
| Human-only | 법적 경계 사례·최종 특허성 판단·정책 변경 | 자동 승인·자동 처분 버튼 없음 |

공통 사실·증거 계약을 공유하되 양청이 같은 LLM이나 같은 법률 기준을 써야 한다고 설계하지 않는다. 규칙을 변경하는 실험실에서는 `DRAFT → 사람 검토 → 회귀시험 → Shadow → 승인`을 **가상 상태 전이**로 보여준다. 공동 승인 절차는 연구 제안이지 실제 양청의 현행 제도라고 쓰지 않는다.

### 3.6 독립 검토 워크스페이스

역할 `KR 검토자 / JP 검토자 / 품질연구자`를 **시뮬레이션 선택기**로 제공한다. 첫 검토에서는 상대청의 결론을 가리는 `Blind re-check` 버튼으로 D1과 본국 청구항·관련 기준만 확인할 수 있다. 그다음 상대청의 근거를 열어 `확인 / 정당한 법역 차이 / 근거 부족 / 기각`과 이유를 기록한다. 역할 선택은 실사용 기관 계정이나 권한으로 오해되지 않게 `가상 역할` 표기한다.

요약 보고서는 `같은 패밀리/청구항 확인 정도`, `비교시점`, `당시 인용 vs 후향 발견`, `각국 원문·해석`, `규칙 버전`, `사람 검토 결과`, `자료 부족`, `시연 상태`를 포함한다. HTML 인쇄 또는 다운로드 가능한 JSON/Markdown을 제공한다. 공식 거절이유나 양청 간 통보문 양식처럼 만들지 않는다.

## 4. 실제 AI로 공개 사례를 분석하는 확장 모드

사용자가 이번에도 **실제 작동하는 AI 체험**을 원한다는 앞선 계획의 취지를 반영한다. GitHub Pages 자체는 정적 파일을 배포하므로 비밀 모델 키를 프런트 JS에 넣지 않는다. **별도 호스팅된 연구용 API**가 준비되면, 공개·허가된 동일 패밀리 자료에 대해 실제 AI가 청구항 요소대응과 문헌별 증거 초안을 만든다. API가 없는 배포에서도 합성 8개 사건의 정적 체험은 완성되어야 한다.

### 4.1 최소 라이브 기능과 사실성

1. 연구 사용자가 **공개된** KR·JP 청구항의 두 버전과 D1 원문을 붙여 넣거나 공개 접근이 허용된 문서만 선택한다.
2. 서버가 원문을 문단/청구항/span 단위로 구조화하고 출원·보정·문헌 날짜를 파싱한다.
3. AI가 `family_match_candidate`, `claim_element_mapping`, `evidence_span_candidates`, `translation_uncertainties`를 스키마에 맞는 JSON **초안**으로 반환한다.
4. 사용자가 비교 버전과 대응 구절을 수정하고 확정한다. 원문에 존재하지 않는 인용·문단은 서버 검증에서 거부한다.
5. 결정적 공통 규칙은 확인된 Fact에 대해서만 불일치 신호를 계산한다. 자료가 빠졌으면 `UNKNOWN`.
6. KR/JP 법률 판단은 독립 탭·사람 검토로 남긴다. 라이브 AI는 상대청 공식 기록을 수정하거나 양국 법률결론을 자동 확정하지 않는다.

첫 버전에서 **모든 관청 사건을 자동 조회할 수 있다고 전제하지 않는다**. KIPRIS Plus·J-PlatPat/OPD·WIPO CASE의 접근범위와 이용조건, 인증 방식을 확인한 뒤에만 어댑터를 연결한다. 사용자가 직접 제공한 문서만 분석하면 검색 범위를 `제공 자료 내부 분석`이라고 명시한다. 현재 자료를 못 받으면 `자료 없음/접근 제한`이지 `문헌 미인용 확정`이 아니다.

### 4.2 별도 서버와 API 계약

권장 구현은 `FastAPI + Pydantic` 또는 프로젝트의 기존 Node API 체계 중 운영환경에 맞는 하나. 모델 인터페이스는 `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` 등의 **서버 측** `.env`에서 설정한다. 공개 웹 번들·GitHub Pages 저장소·공유 URL에 모델/데이터베이스 키를 넣지 않는다. 인증된 사용자, 호출량 제한, 문서 크기 제한, 허용 origin, 전송기록, 삭제 정책, 외부 문서의 prompt injection을 처리한다.

| 엔드포인트 | 핵심 동작 | 검증·출력 |
| --- | --- | --- |
| `GET /v1/capabilities` | 사용 가능한 모델·검색 어댑터·자료 유형 확인 | 연결 안 됨을 프런트에 명확히 표시 |
| `POST /v1/families` | 공개 KR·JP 원문/메타데이터 등록 | 가족 관계는 `candidate`, 날짜·공개범위·provenance 기록 |
| `POST /v1/families/{id}/align` | 버전별 구성요소·원문 span 대조 | AI 초안 + 번역 불확실 + 신뢰도 + 비교 불가 사유 |
| `PATCH /v1/families/{id}/facts` | 사람이 요소·날짜·출처 수정 | 버전 diff, 이유, 의존 Rule 무효화 |
| `POST /v1/families/{id}/check` | 승인된 Fact로 품질 신호 평가 | Rule ID/version, TRUE/FALSE/UNKNOWN/NA, Evidence Trace |
| `POST /v1/families/{id}/review` | 독립 검토 의견 기록 | 확인/기각/법역차이/보류와 사람의 근거 |
| `GET /v1/families/{id}/report` | 연구용 보고서 내보내기 | 자료범위·시점·출처·모델/Rule 버전·유보사항 |

오래 걸리는 분석은 `job_id`와 `queued/running/needs_human_review/completed/failed` 상태로 표시한다. 요청 실패를 사전 작성한 AI 답으로 바꿔치기하지 않는다. `서버 미연결`이면 합성 사건 체험 링크를 제공한다. 표준 ST.96 스키마에 없는 필드는 `harmonyExtension`이라고 명시하고 실제 상호운용성 검증 전에는 “ST.96 호환 완료”라고 표현하지 않는다.

### 4.3 공개 체험과 실제 업무의 데이터 경계

| 등급 | 예 | 이 사이트의 처리 |
| --- | --- | --- |
| `PUBLIC` | 공개 공보·허용된 공개 심사경과 | 허가된 범위의 링크/조회, 출처·취득시각 기록 |
| `OFFICE-SHARED` | 협력제도상 제한 접근 문서 | 공개 체험에 포함하지 않음; 실제 업무는 승인·인증 경로가 있어야 함 |
| `RESTRICTED-DERIVED` | 비공개 원문에서 도출된 제한적 파생정보 | 공개 사이트/API에 넣지 않음; 기관 승인 연구에만 조건부 검토 |
| `CONFIDENTIAL-RAW` | 미공개 출원·내부 심사 의견 | 사이트에서 업로드·외부 전송 금지, 별도 법적 근거·협약 전제 |

라이브 공개 체험은 `PUBLIC` 또는 사용권이 명확한 합성 자료로 제한한다. 공개 사이트가 양청 사이로 원문을 실제 송수신하는 `연합형 운영망`처럼 묘사하지 않는다. 가상 `KR node / JP node` 애니메이션은 **분산 설계 시뮬레이션**이라고 지속 표시한다. 실제 기관용 설계에서는 원문을 각 관청의 승인 환경에 두고, 허용된 최소 정보만 교환하며, 접근·감사·법적 근거가 필요하다.

## 5. 자료 모델과 정적 시뮬레이터

합성 사건을 화면 문자열에 하드코딩하지 말고 `/src/data/cases/`의 엄격한 JSON과 다국어 사전으로 둔다. 핵심 객체에 논문의 구분을 보존한다.

```ts
type Office = 'KR' | 'JP';
type DataClass = 'PUBLIC' | 'OFFICE_SHARED' | 'RESTRICTED_DERIVED' | 'CONFIDENTIAL_RAW';
type Verdict = 'TRUE' | 'FALSE' | 'UNKNOWN' | 'NOT_APPLICABLE';
type Divergence =
  | 'DATA_DIVERGENCE' | 'CLAIM_VERSION_DIVERGENCE'
  | 'SEARCH_DIVERGENCE' | 'FACT_DIVERGENCE'
  | 'LEGAL_PROFILE_DIVERGENCE' | 'QUALITY_DEFECT_CANDIDATE' | 'UNKNOWN';
type ReferenceOrigin = 'EXAMINER_CITED' | 'AI_DISCOVERED_AFTERWARD';

interface SourceSpan {
  id: string;
  documentId: string;
  office: Office;
  originalLanguage: 'ko' | 'ja' | 'en';
  originalText: string;
  page?: number;
  paragraph?: string;
  start?: number;
  end?: number;
  retrievedAt: string;
  contentHash: string;
}
interface ClaimVersion {
  id: string;
  office: Office;
  claimNumber: number;
  effectiveDate: string;
  versionHash: string;
  originalTextSpanIds: string[];
  elements: Array<{ id: string; sourceSpanIds: string[] }>;
}
interface PriorArtRecord {
  id: string;
  publicationDate: string;
  origin: ReferenceOrigin;
  citedByOffice?: Office;
  sourceSpanIds: string[];
  retrievedAt: string;
}
interface HarmonyCase {
  id: string;
  fictional: true;
  familyLink: { confidence: number; sourceSpanIds: string[] };
  documentClass: DataClass;
  claimVersions: ClaimVersion[];
  priorArt: PriorArtRecord[];
  sourceSpans: SourceSpan[];
  ruleVersions: Array<{ id: string; version: string; effectiveFrom: string }>;
}
interface HarmonyTrace {
  selectedKrClaimVersionId: string;
  selectedJpClaimVersionId: string;
  comparisonDate: string;
  divergence: Divergence[];
  verdict: Verdict;
  ruleId: string;
  ruleVersion: string;
  usedSourceSpanIds: string[];
  missingEvidence: string[];
  explanationKeys: string[];
  reviewerDecision?: 'CONFIRMED_GAP' | 'REJECTED' | 'LEGAL_DIVERGENCE' | 'DEFERRED';
}
```

`evaluateHarmony(case, selectedVersions, comparisonDate, documentAvailability, translationVerification, reviewerEdits)`는 **순수·결정적 함수**. 같은 입력에서 같은 Trace를 반환한다. 순서는 `자료등급·접근 가능성 검사 → 패밀리 연결 → 시점·청구항 정렬 → 문헌 관련 날짜 → 요소별 근거·번역 → 법역 프로필 → materiality → 검토 신호`. `UNKNOWN`은 `FALSE`와 다른 결과이며, 사용자가 자료를 추가했을 때만 해당 결손이 해소된다. `TRUE`가 떠도 심사관의 최종 검토 결과는 별도의 상태다.

체험 상태는 `sessionStorage`에 두고 `초기화/기록 지우기`로 삭제한다. 언어·테마만 `localStorage`에 저장한다. 공유 URL에는 합성 사건 ID, 열거형 버전·단계 등만 담고 원문/자유 입력/실제 출원번호는 넣지 않는다. 브라우저 새로고침과 다른 페이지 이동 후에도 단계가 복원된다.

## 6. 연구 결과를 배우는 평가 페이지

논문의 성공 조건은 **양청의 최종 결론을 같게 만드는 것**이 아니다. 정당한 청구항·법역 차이를 제외한 뒤 일방의 중요 미탐을 얼마나 추가로 발견했는지와, 그 과정의 허위 경보·검토비용·자료 보호를 평가한다.

`/method/`에서 각각의 지표에 `정의 · 분모 · 예외 · 필요한 Gold Set · 사람 검증 · 현재 근거 상태`를 펼친다.

- **조정된 양국 정합률** = `1 − 설명되지 않은 중요 불일치 수 / 양국에서 비교 가능한 중요 쟁점 수`. 비교 가능한 중요 쟁점이 0이면 계산하지 않는다. 다른 청구항 버전이나 정당한 법역 차이를 분모에 섞지 않는다. 이 값만 높아졌다고 결함 발견률이 증가한 것은 아니다.
- **일방 미탐 추가 발견률** = `상대 관청의 근거 또는 제안 체계에서 찾아 최종 확인한 일방 미탐 수 / 후향적으로 확인된 전체 일방 미탐 수`. Gold Set이 없는 데 숫자를 만들지 않는다.
- 함께 볼 지표: 중요 쟁점 Recall, Evidence Provenance Coverage, 허위 인용률, Claim Alignment F1, 정당한 법역 차이 분류, UNKNOWN calibration, 심사관 추가 검토시간, Alert Yield, 재현성, 승인 없는 Rule 활성화/제한자료 외부전송.

표나 그래프의 임의 숫자는 모두 `SIMULATION · 교육용 합성 데이터`를 축·툴팁과 표 제목에 표시한다. 논문의 후향적 후보 `3,000~5,000건`, 전문가 판정 `300~500건`, 검토시간 개선 등은 **잠정 표본/목표**이지 확보한 데이터나 결과가 아니다. `MEASURED` 탭은 실측 카드(실험 ID, 패밀리/시점 분리, 기준선, 표본, 사람 평가, 모델/Rule/검색 버전, 실패, 변동성·신뢰구간, 재현자료)가 없으면 빈 상태로 둔다.

거버넌스 페이지에서는 `자료계약 정립 → 후향적 평가자료 → 검색·규칙 시제품 → 심사관 참여 관찰평가 → 제한적 업무지원 → 확장 검토`의 제안 로드맵을 보여준다. 각 단계의 Go/No-Go를 논문과 연결하고 예정 기간을 확정 사업 일정처럼 쓰지 않는다.

## 7. 시각 디자인과 상호작용

사이트는 **학술적 조사실과 두 관청 간 증거 대조대**의 느낌으로 만든다. 밝은 모드: 따뜻한 종이색, 짙은 남색 본문, KR/JP를 구별하는 차분한 두 색, 청록색의 검토 포인트. 어두운 모드: 잉크색 배경과 적절한 대비의 선·본문. 국기·관청 문장·정부 로고를 공식 협력의 상징처럼 크게 사용하지 않는다. KR/JP 식별은 텍스트와 아이콘을 함께 쓴다.

- 타임라인과 요소 대응, Evidence Trace는 **정확한 SVG/HTML**로 그린다. 장식용 이미지를 날짜·구성요소·법적 결론의 근거로 사용하지 않는다.
- `WHY THIS SIGNAL?`을 누르면 현재 선택한 청구항·문헌·Rule의 의존관계가 하이라이트된다. `WHAT WOULD CHANGE IT?`은 비교 가능한 버전, 빠진 문헌, 번역 확인 등 **구체적인 다음 행동**을 알려준다.
- 동작은 키보드로 끝까지 완료 가능, 모든 상태변화를 텍스트로도 설명, 포커스/표 헤더/ARIA 레이블 제공. `prefers-reduced-motion`에서는 선·노드 애니메이션을 생략한다.
- 360px 모바일 화면에서는 KR/JP 원문 두 열을 억지로 축소하지 말고 `KR / JP / 구성요소 대응` 탭과 고정된 사건 요약으로 보여준다. 입력·언어·테마 메뉴가 화면 밖으로 나가지 않는다.

## 8. 언어와 테마의 정확한 규격

### 8.1 테마

`system | light | dark` 세 선택값. 저장값이 없으면 **`system`**으로 시작한다. system은 `prefers-color-scheme`의 현재 값을 따르고 OS 변경에도 반응한다. 수동 light/dark는 OS와 별개로 저장된 사용자 선택을 적용한다. `localStorage`가 막혀도 system으로 정상 동작한다. 첫 렌더 전에 실제 색을 맞추어 깜빡임을 줄인다. UI에는 `시스템 · 현재 다크`처럼 **선택값과 적용 색**을 모두 보여준다.

### 8.2 한국어·영어·일본어

`ko | en | ja`, 기본 `ko`. 헤더 오른쪽과 모바일 메뉴에서 바꾼다. 명시 URL `?lang=ja` → 저장된 선택 → `ko` 순. 변경 시 **같은 페이지·사건·버전·검토 단계**가 유지된다. 메뉴, Lab의 모든 설명, Rule의 이유, 차트·표·툴팁, 이미지 대체텍스트, 인쇄 보고서의 UI 설명을 번역한다. 한국어와 일본어 **원문 증거는 원어 그대로** 두고 해설 번역만 병기하며, 원문과 번역문을 시각·데이터상 구분한다. `html lang`을 갱신하고 번역 키가 없으면 빌드 오류로 처리한다.

| 위치 | 한국어 | English | 日本語 |
| --- | --- | --- | --- |
| 홈 질문 | 같은 발명, 다른 심사결과. 무엇이 달랐을까요? | Same invention, different examination outcomes. What changed? | 同じ発明、異なる審査結果。何が違ったのでしょうか。 |
| 시작 | 가상 사건 비교하기 | Compare a sample family | 模擬ファミリーを比較する |
| 신호 | 재검토가 필요한 차이 | Difference requiring review | 再検討が必要な相違 |
| 설명된 차이 | 청구항 버전 차이로 설명됩니다 | Explained by different claim versions | 請求項の版の違いで説明できます |
| 유보 | 원문 자료가 부족하여 판단을 유보합니다 | Source evidence is missing; review is deferred | 原文資料が不足しているため、判断を保留します |
| 승인 | 해당 관청의 심사관이 독립적으로 판단합니다 | Each office makes an independent decision | 各庁の審査官が独立して判断します |

용어집에는 `same family`, `claim version`, `priority`, `examiner-cited`, `AI-discovered`, `evidence span`, `legal profile`, `quality review signal`, `abstain/UNKNOWN`의 자연스러운 한·영·일 대응을 둔다. 고유한 Rule ID와 상태 코드는 번역하지 않고 설명만 번역한다.

## 9. 사용자가 생성할 이미지 파일과 프롬프트

이미지가 없어도 사이트는 CSS/정확한 SVG/텍스트로 완성한다. 사용자가 생성한 파일을 `public/assets/images/`에 아래 **정확한 파일명**으로 넣으면 자동 적용한다. WebP 우선, 같은 basename의 PNG도 허용한다. 실제 문서/국기/관청 로고/수치 그래프/법조문을 이미지 생성으로 만들지 않는다. 중요한 도표는 코드로 그린다. 각 그림의 한·영·일 ALT 문구를 준비한다.

| 파일명 | 비율·최소 크기 | 사용 위치 | ALT 의미 |
| --- | --- | --- | --- |
| `harmony-hero.webp` | 16:9 · 1600×900 | 홈 | 두 연구 기록이 증거를 중심으로 만나는 추상 연구 공간 |
| `family-timeline.webp` | 3:2 · 1200×800 | 패밀리 실험실 | 서로 다른 시점의 기록을 나란히 확인하는 연구 장면 |
| `claim-alignment.webp` | 3:2 · 1200×800 | 청구항 실험실 | 두 언어의 원문 층이 구성요소별로 연결되는 모습 |
| `evidence-bridge.webp` | 3:2 · 1200×800 | 선행기술·불일치 Lab | 두 자료집 사이에 선택된 근거만 검증되며 이어지는 모습 |
| `human-review.webp` | 4:3 · 1200×900 | 워크스페이스 | 사람이 각 원문을 독립적으로 살피는 장면 |
| `research-horizon.webp` | 21:9 · 1680×720 | 방법·로드맵 | 검증·피드백 단계가 이어지는 연구 전망 |

**공통 네거티브:** no text, letters, numbers, fake patent documents, fake graphs, official government seals, agency logos, flags as branding, recognizable patent-office buildings, legal verdict stamps, humanoid robots, fake UI labels.

**A. `harmony-hero.webp`**  
> Premium panoramic editorial illustration for an academic research website about comparing Korean and Japanese patent examination evidence. Two calm streams of abstract research records approach a shared evidence review space while maintaining clearly independent paths. Paper-white background, deep navy, restrained teal and indigo accents, generous left-side negative space for HTML headline. Trustworthy, precise, sophisticated; no text, numbers, flags, logos, seals, real patent pages, people portraits or charts. 16:9.

**B. `family-timeline.webp`**  
> Abstract academic visualization of two parallel archival timelines with layered document revisions and carefully marked comparison points. Suggest the importance of comparing the correct historical version, but show no real dates or readable documents. Pale gray-white, dark blue, teal and subtle copper details. No text, numbers, official symbols or fake charts. 3:2.

**C. `claim-alignment.webp`**  
> Refined conceptual image of two translucent original-language document layers linked by a few precise corresponding fragments, with some fragments deliberately unmatched. The exact claim text and element mapping will be overlaid separately as accessible HTML/SVG. Clean research editorial style, muted navy and teal. No actual letters, patent claims, text, graphs or logos. 3:2.

**D. `evidence-bridge.webp`**  
> Two separate evidence libraries connected through a narrow, carefully validated bridge of source fragments, with one candidate held aside for review. Represent selective exchange and provenance without implying official integration. Calm institutional research aesthetic, bright background, navy, teal and a subtle amber uncertainty accent. No readable content, flags, seals, charts or logos. 3:2.

**E. `human-review.webp`**  
> A respectful editorial scene of independent human expert review at a desk, hands comparing two abstract unlettered document stacks and highlighted source fragments. Quiet natural light, professional research setting, deep blue and teal accents. No identifiable face, government emblem, readable document, legal verdict stamp, logo or posed handshake. 4:3.

**F. `research-horizon.webp`**  
> Wide panoramic academic research landscape showing distinct modular phases for data alignment, evidence verification, human review and cautious future evaluation. Pale cool-white background, deep navy, teal, restrained light, ample empty space for HTML overlay. No text, labels, numbers, government architecture, fake graphs or logos. 21:9.

## 10. 구현 구조, 배포와 관련 사이트

**권장 스택:** Astro + TypeScript + React islands + 로컬 CSS. 논문·방법·자료 페이지는 정적 HTML, 패밀리 비교와 Trace는 최소한의 클라이언트 JS. 번들 내 합성 JSON으로 오프라인에서도 모든 가상 체험이 동작한다.

```text
kj-eqh-research-experience/
├─ site/
│  ├─ public/assets/images/      # 사용자가 생성한 이미지; 누락 시 CSS 대체
│  ├─ src/pages/                 # 위의 12개 직접 접속 페이지
│  ├─ src/components/            # Header, ThemeSelect, LanguageSelect, StatusBadge
│  ├─ src/labs/                  # Family, Claims, PriorArt, Discrepancy, Rules, Review
│  ├─ src/data/cases/            # 합성 H-01~H-08과 문서·Rule Trace
│  ├─ src/lib/                   # 결정적 평가기, URL·상태·출처 검증
│  ├─ src/i18n/{ko,en,ja}.ts
│  ├─ src/styles/
│  └─ astro.config.mjs
├─ server/                       # 라이브 AI 사용 시 별도 배포
│  ├─ api/                       # 인증된 공개자료 분석 API
│  ├─ alignment/                 # claim version·요소 매핑
│  ├─ evidence/                  # 원문 span 검증과 Rule 적용
│  ├─ ai/                        # 모델 제공자 어댑터·strict JSON
│  ├─ .env.example               # 키 이름만 기록; 실제 값 금지
│  └─ tests/
├─ tests/                        # H-01 분기, 보호 경계, 경로·번역 검증
├─ .github/workflows/pages.yml
├─ README.md
└─ package.json
```

GitHub Pages가 저장소 하위 경로 `https://USER.github.io/REPO/`에서 제공되면 Astro의 `base='/REPO/'`, 루트 사이트 또는 사용자 지정 도메인이면 `base='/'`. 내부 링크·이미지·언어 이동에 공통 `sitePath`를 사용하고 하위 경로에서 직접 URL로 접근/새로고침이 되어야 한다. GitHub Actions는 의존성 설치 → 타입 검사 → 시나리오 테스트 → 정적 빌드 → `dist/` 업로드·Pages 배포. 별도 AI 서버 배포는 **정적 배포와 다른 작업**으로 README에 명시한다.

**연결 카드:** [CAIPEX](https://caipex.site/)는 연구 지원 주체로 홈·연구·푸터에 표기한다. 이전 계획과 마찬가지로 [research.moip.ai.kr](https://research.moip.ai.kr/), [layer.moip.ai.kr](https://layer.moip.ai.kr/), [moip.ai.kr](https://moip.ai.kr/), [eqai.moip.ai.kr](https://eqai.moip.ai.kr/)을 `/sources/`의 관련 사이트에 둔다. 배포 전에 각 사이트에 접속해 현재 제목·내용·링크와 맞는 한 문장 소개를 작성한다. 연결 사이트의 실제 기능·운영주체·공식성은 주소만 보고 지어내지 않는다. 논문 PDF/DOCX를 공개 사이트에 직접 배포하려면 공개 허가와 적절한 버전을 확인하고, 그렇지 않으면 정확한 서지와 `자료 문의`만 표시한다.

## 11. 구현 순서와 완료 기준

1. **구조:** 12페이지, 디자인 토큰, 시스템 기본 테마, 한·영·일, CAIPEX 지원·연구 상태 구분, GitHub Pages 경로.
2. **핵심 체험:** H-01을 자료·청구항 버전·D1 날짜·번역 불확실성·사람의 최종 검토까지 실제로 연결. 그다음 H-02~H-08.
3. **연구 설명:** KJ-EQH 데이터 모델, 분류·Rule 경계, WIPO CASE/OPD/ST.96과의 관계, 방법·지표 및 목표/실측 구분.
4. **라이브 확장:** 별도 서버의 공개 청구항 비교·AI 초안·span 검증. 자료 접근 권한이 없는 검색원은 실제 실행처럼 보여주지 않음.
5. **검수:** 직접 URL·모바일·키보드·다국어·테마·자료보호·허위 인용·정당한 차이의 분류·이미지 없는 상태 점검.

| 항목 | 인수 기준 |
| --- | --- |
| 3분 체험 | H-01의 7단계를 클릭으로 완주; 버전·D1 날짜·원문 누락에 따라 Trace와 상태가 변함 |
| 원인 분리 | 7개 불일치 클래스가 논문의 의미와 일치; 품질결함 후보 전에 자료·시점·법역 확인 |
| 결론 경계 | `TRUE`는 검토 후보. AI나 상대청이 다른 관청의 처분을 자동 대체하지 않음 |
| 데이터 | 당시 심사관 인용과 사후 AI 발견을 구분; 출처·원문 span·시각·Rule 버전 연결 |
| UNKNOWN | 번역/문서/패밀리 정보 부족이면 FALSE 대신 구체적 부족자료와 유보 표시 |
| 규칙 | KR Legal Profile은 JP에 적용되지 않고, 승인 없는 Rule 활성화 없음 |
| 보호 | 공개 합성 자료만 정적 저장; 미공개 원문·실제 API 키·기관 내부 기록 없음 |
| 라이브 AI | 별도 API가 연결되면 실제 AI 초안을 요청, 실패 시 실패 표시, 원문 없는 인용 차단 |
| 평가 | 목표·시연값·실측 구분; 분모가 0일 때 조정 정합률 계산하지 않음 |
| 테마/언어 | system 기본·OS 변경 반응, ko/en/ja 전체 체험 번역·원문/번역 분리 |
| 기기/접근성 | 360px 화면에서 완주, 키보드 초점·상태 텍스트·reduced motion 지원 |
| 배포 | 12페이지 직접 접속·새로고침 및 이미지·관련 링크가 루트/하위 경로에서 동작 |

의미 있는 자동검증은 `H-01 기본 TRUE → 다른 청구항 버전이면 CLAIM_VERSION_DIVERGENCE → 문헌 날짜 뒤면 신호 없음 → 원문 누락이면 UNKNOWN`, H-05 법역 차이를 오류로 오인하지 않음, H-07 제한자료를 공개 경로에 싣지 않음, 동일 입력·Rule 버전의 재실행 일치, 번역 키 완전성, GitHub Pages base 경로다. E2E에서는 한·영·일의 3분 체험과 모바일 검토 요청을 실제 브라우저로 확인한다.

**인수 산출물:** 배포 가능한 사이트 소스, 검증된 합성 사건 8건과 단계별 Trace, 번역 사전, 이미지 자리표시자, 결정적 규칙과 테스트 결과, README, Pages workflow, PC·모바일 화면 캡처. 라이브 확장을 구현한다면 서버 소스·`.env.example`·API 문서·보안/보관 정책과 실제 연결 테스트를 추가한다.

## 12. 연구·기술 출처

- **기준 논문:** E(on). Jun, 「AI 기반 MOIP–JPO 특허심사 품질관리 조율체계 연구」, CAIPEX 학회지, 2026.9. 이 문서의 불일치 분류, KJ-HARM-PA-001, 데이터 등급, 평가 지표의 직접 근거.
- [JPO 특허심사 품질관리](https://www.jpo.go.jp/e/introduction/hinshitu/shinsa/tokkyo/) · [JPO OPD 안내](https://www.jpo.go.jp/e/support/j_platpat/patent_search/OPD_service.html): 현재 공개된 품질관리·패밀리 심사경과 조회 설명.
- [WIPO CASE](https://www.wipo.int/en/web/case) · [WIPO ST.96](https://www.wipo.int/standards/en/st96/): 자료 접근·교환 개념과 XML 공통 구성요소. 제안된 품질 확장정보를 표준 자체로 표현하지 않음.
- [지식재산처](https://www.moip.go.kr/) · [KIPRIS Plus](https://plus.kipris.or.kr/): 공개 정책·공보·인용·청구항 이력의 제공범위를 배포 직전에 확인.
- [CAIPEX](https://caipex.site/): 연구 지원 학회. 사이트 내 표기는 제공된 논문의 발간 정보와 일치시킴.
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) · [Pages 배포](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site): 정적 호스팅·배포 설정.

---

## 개발용 LLM에 그대로 전달하는 MASTER PROMPT

> 첨부 CAIPEX 논문 「AI 기반 MOIP–JPO 특허심사 품질관리 조율체계 연구」와 이 Markdown 계획서를 모두 읽고, GitHub Pages에 배포 가능한 Astro + TypeScript 다중 페이지 연구 체험 사이트 전체 소스를 구현하세요. 첫 화면에서 “같은 발명인데 한국과 일본의 심사결과가 다르다면 무엇을 먼저 확인해야 하는가”를 묻고, 합성 패밀리 H-01의 3분 체험에서 패밀리 확인 → 양국 청구항 시점 정렬 → D1 실제 인용과 AI 사후 발견 구분 → 원문 증거 대조 → 정당한 청구항/법역 차이와 재검토 후보 분리 → UNKNOWN 처리 → 사람의 독립 검토를 실제로 클릭하여 완주하게 하세요. 논문에 나온 7개 불일치 클래스, KJ-HARM-PA-001, 자료 4등급, Common/KR/JP/Cross-Office/Human-only Rule 경계를 정확하게 반영하고 H-02~H-08 사례도 구현하세요. 한국어·영어·일본어를 전체 화면에 적용하고 테마는 system/light/dark 세 가지이며 기본값은 system입니다. 사용자가 지정된 폴더에 WebP/PNG 이미지를 넣으면 자동 적용되고 이미지 없이도 화면이 완성되어야 합니다. CAIPEX 학회의 지원을 명시하고 사용자가 지정한 관련 사이트를 검증 후 링크하세요. GitHub Pages에 비밀 키를 넣지 마세요. 실제 AI 분석은 허가된 공개자료만 받는 별도 인증 서버에 연결하고, 서버가 없으면 완성된 합성 체험을 제공하세요. 제안 시스템을 현재의 양청 공식 공동사업이나 검증된 실측 성과로 표현하지 말고, 각국 심사관의 독립적인 최종 판단을 보존하세요. 모든 12개 URL의 직접 접속, 모바일·키보드, 번역, 분류·Rule, UNKNOWN, 출처, 배포를 테스트하고 README와 workflow를 완성하세요.
