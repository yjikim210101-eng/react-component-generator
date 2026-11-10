# src/AGENTS.md

## Module Context

React 19 SPA. 사용자 입력을 받아 `/api/generate`를 호출하고 결과를 `react-live`로 렌더링한다. AI 프로바이더를 직접 호출하지 않고 항상 `server/`를 거친다.

## Tech Stack & Constraints

- 서버 호출은 상대 경로 `/api/*`만 쓴다 (`src/hooks/useComponentGenerator.ts:23`, `src/App.tsx:25`). Vite proxy가 3002로 넘긴다. `localhost:3002`를 하드코딩하거나 AI 엔드포인트를 브라우저에서 직접 호출하지 않는다.
- 스타일은 `src/App.css`, `src/index.css`의 일반 className 방식이다. CSS-in-JS, CSS modules, UI 라이브러리를 새로 도입하지 않는다.
- ESLint가 `react-refresh/only-export-components`를 적용한다 (`eslint.config.js:17`). 컴포넌트 파일에서 컴포넌트 외의 값을 export하지 않는다. 상수와 헬퍼는 모듈 내부에 두거나 별도 파일로 분리한다.

## Implementation Patterns

- 컴포넌트는 `src/components/`에서 named export, `App`만 default export (`src/main.tsx:4`). props는 같은 파일의 `interface XxxProps`로 선언한다.
- 서버 호출과 목록 상태는 `useComponentGenerator` 훅에 둔다. 컴포넌트에서 직접 `fetch('/api/generate')`를 호출하지 않는다.
- 공용 타입은 `src/types/index.ts`에 두고 `import type`으로 가져온다.
- UI 문구는 한국어다. 접근성 속성(`aria-label`, `role`)도 한국어로 쓴다.

## Testing Strategy

- 실행은 루트에서 `bun run test`. 테스트 파일은 대상 옆에 `*.test.tsx`로 둔다.
- 쿼리는 Testing Library의 role 기반(`getByRole`)과 `userEvent.setup()`을 쓴다 (`src/components/PromptInput.test.tsx:12-14`). 정리는 `src/test/setup.ts`의 `cleanup`이 자동 처리한다.
- 테스트가 있는 곳은 `PromptInput`뿐이다. `App`, `useComponentGenerator`, `ComponentCard`, `LivePreview`, `CodeView`는 테스트가 없다. 이 파일들의 동작을 바꾸면 변경 범위만큼 테스트를 추가한다. `fetch`는 `vi.stubGlobal` 등으로 모킹하고 실제 네트워크를 호출하지 않는다.

## Local Golden Rules

- 하지 마라: `PromptInput`의 버튼 문구(`컴포넌트 생성`, `생성 중...`)를 테스트 갱신 없이 바꾸는 것. 테스트가 문구로 버튼을 찾는다 (`PromptInput.test.tsx:7,17,21`).
- 하지 마라: `isLoading` 가드를 한쪽에서만 제거하는 것. 중복 생성은 `PromptInput`의 제출 조건(`PromptInput.tsx:220`), 생성 버튼 `disabled`(`PromptInput.tsx:247`), 재생성 버튼 `disabled`(`ComponentCard.tsx:128`)에서 막는다. `App.handleGenerate`(`App.tsx:33`)에는 가드가 없어 UI 가드에 의존한다.
- 하지 마라: `apiKey`를 localStorage, sessionStorage, 쿠키, 로그에 저장하는 것. 프로바이더를 바꾸면 입력된 키를 초기화한다 (`App.tsx:41-44`). 이 동작을 유지한다. 키는 요청 본문에만 실어 보낸다 (`useComponentGenerator.ts:26`).
- 하지 마라: `LivePreview`에서 `noInline`을 제거하는 것 (`LivePreview.tsx:11`). 서버가 생성하는 `render(...)` 형식 코드가 그려지지 않는다.
- 하라: 새 프로바이더를 추가하면 `src/types/index.ts`의 `Provider`와 `src/App.tsx:8-11`의 `PROVIDER_CONFIG`, 서버의 `Provider`(`server/index.ts:57`)를 함께 수정한다. 타입이 클라이언트와 서버에 따로 정의되어 있어 컴파일러가 불일치를 잡지 못한다.
- 하라: 재생성은 `handleGenerate`를 거치므로 API 키 검증이 함께 적용된다 (`App.tsx:187`). 재생성 경로를 `generate`에 직접 연결하지 않는다.
