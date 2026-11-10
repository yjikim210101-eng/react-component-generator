# AGENTS.md

## Operational Commands

- 패키지 매니저는 `bun` 고정 (`bun.lock` 존재). npm/yarn/pnpm 사용 금지.
- 개발 서버 (API + Vite 동시): `bun run dev` (API 3002, Vite 5173)
- API 서버만: `bun run server`
- 테스트 전체 (프론트 + 서버): `bun run test` (vitest run). 감시 모드는 `bun run test:watch`.
- 린트: `bun run lint`
- 빌드: `bun run build` (`tsc -b && vite build`)

주의: `bun test`는 Bun 내장 러너를 실행하므로 쓰지 않는다. 이 프로젝트의 테스트는 vitest + jsdom 기반이다 (`vite.config.ts:17-22`).

## Golden Rules

### Immutable

- API 키 값을 클라이언트 응답에 포함하지 않는다. `/api/config`는 키 존재 여부(boolean)만 반환한다 (`server/index.ts:147-157`). 키 문자열을 응답, 로그, 클라이언트 번들에 노출하는 변경 금지.
- `.env`는 커밋하지 않는다 (`.gitignore`). 키를 코드에 하드코딩하지 않는다.
- 민감 파일(`.env`, `.env.*`, `*credential*`, `*secret*`, `*.pem`, `*.key`, `.npmrc`, `.netrc`, `.aws/`, `.ssh/` 등)은 읽기·수정·생성 모두 금지다. `.claude/settings.json`의 `permissions.deny`로 Read/Edit/Write/Bash/PowerShell을 차단한다. cat, grep, 리다이렉션 등 셸로 우회해 접근하지 않는다. 키가 필요하면 사용자에게 직접 설정해 달라고 요청한다. 차단 패턴을 바꿀 때 `deny` 목록과 이 규칙을 함께 갱신한다.
- 사용자가 UI에서 입력한 API 키는 프로바이더별로 localStorage(`rcg:apiKeys`)에만 저장한다 (`src/App.tsx:23`). 사용자 요청으로 도입된 결정이다. sessionStorage, 쿠키, 로그, 서버 응답 등 다른 곳에 복제하지 않는다. 키는 요청 본문으로만 서버에 보낸다.

### Hard Constraint

- AI가 생성한 코드는 `react-live`의 `noInline` 모드로 실행된다 (`src/components/LivePreview.tsx:11`). 코드에 `render(<Component />)` 호출이 없으면 미리보기가 그려지지 않는다. 생성 코드 후처리를 바꿀 때 `render(` 보장 로직(`server/generator.ts` `ensureRenderCall`)을 유지한다.
- 생성 코드는 import 없이 전역 `React`만 쓰고 순수 JavaScript여야 한다 (`server/index.ts:11,20`). 프롬프트나 프리뷰 scope를 바꿀 때 이 전제를 함께 맞춘다.
- `tsconfig.app.json`은 `src`만, `tsconfig.node.json`은 `vite.config.ts`만 포함한다. `server/`는 어떤 tsconfig에도 없어서 `bun run build`의 타입 검사를 받지 않는다. 서버 변경은 `bun run lint`와 테스트로 검증한다.
- `erasableSyntaxOnly`, `verbatimModuleSyntax`가 켜져 있다 (`tsconfig.app.json`). enum, namespace, 파라미터 프로퍼티를 쓰지 않고 타입 import는 `import type`으로 쓴다 (예: `src/hooks/useComponentGenerator.ts:2`).

### Asymmetry

- 모델 폴백은 Google 경로에만 있다 (`server/index.ts:134-136`). Anthropic은 단일 모델 고정이다 (`server/index.ts:77`). 폴백 동작을 바꿀 때 두 경로가 다르다는 점을 전제로 한다.

### Test Boundary

- 순수 함수(`server/generator.ts`, `server/fallback.ts`)와 `PromptInput`만 테스트가 있다. `server/index.ts`는 import 시 `Bun.serve`를 실행하는 부수효과 모듈이라 테스트가 없다. 테스트 가능한 로직은 `server/index.ts`에 추가하지 말고 부수효과 없는 별도 모듈로 분리한 뒤 테스트를 함께 작성한다.

## Project Context

프롬프트로 React 컴포넌트를 AI가 생성하고 미리보기와 코드를 보여주는 도구. 소개와 실행 방법은 `README.md` 참고.

Tech Stack: React 19, TypeScript, Vite, react-live, Bun(API 서버), vitest, Testing Library, ESLint.

## Standards & References

- 커밋: `<type>: <한국어 요약>` (type: feat, fix, refactor, chore). 본문은 필요할 때만. 상세 절차는 `.claude/skills/commit/SKILL.md`.
- 기본 브랜치에서 직접 작업하지 않고 새 브랜치를 만든다.

## Context Map

- **[프론트엔드 수정 (React/UI/훅/테스트)](./src/AGENTS.md)** — `src/` 아래 컴포넌트, 훅, 스타일 작업 시.
- **[API 서버 수정 (Bun/프로바이더 호출)](./server/AGENTS.md)** — `server/` 아래 엔드포인트, 프롬프트, 폴백 작업 시.

## Maintenance Policy

이 문서의 규칙과 실제 코드가 어긋나면 작업을 멈추지 말고 AGENTS.md 업데이트를 제안한다.
