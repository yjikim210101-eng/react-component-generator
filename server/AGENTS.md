# server/AGENTS.md

## Module Context

Bun 런타임에서 실행되는 AI API 프록시. Vite dev 서버가 `/api`를 `localhost:3002`로 프록시한다 (`vite.config.ts:9-14`). 프론트엔드(`src/`)와 코드를 공유하지 않는다.

## Tech Stack & Constraints

- 런타임은 Bun (`Bun.serve`, `process.env`). Node 전용 API나 Express 같은 프레임워크를 추가하지 않는다.
- AI 호출은 SDK 없이 `fetch`로 직접 한다 (`server/index.ts:69,101`). 새 프로바이더도 같은 방식을 따른다.
- 포트 3002는 `server/index.ts:139`와 `vite.config.ts:11` 두 곳에 있다. 바꾸면 둘 다 수정한다.

## Implementation Patterns

- 응답 후처리는 `stripCodeFences` -> `ensureRenderCall` 순서 (`server/index.ts:188`).
- 모든 `Response`에 `CORS_HEADERS`를 붙인다. 새 라우트나 에러 응답도 예외 없이 포함한다 (`server/index.ts:51-55`).
- 프로바이더 키 해석은 클라이언트 입력 우선, 환경변수 차선이다 (`resolveApiKey`, `server/index.ts:64-66`).
- 에러 분기는 에러 메시지 문자열의 `503`/`429` 포함 여부로 한다 (`server/index.ts:194,201`). 호출 함수의 에러 메시지에 상태 코드를 유지해야 매핑이 동작한다 (`server/index.ts:85,112`).

## Testing Strategy

- 테스트 실행: 루트에서 `bun run test` (vitest). `server/**/*.test.ts`가 포함된다 (`vite.config.ts:21`).
- 테스트 대상은 부수효과 없는 순수 모듈이다. 새 로직은 `generator.ts`, `fallback.ts`처럼 별도 모듈로 만들고 `*.test.ts`를 옆에 둔다. 한국어 `it` 설명을 쓰는 기존 스타일을 따른다.

## Local Golden Rules

- 하지 마라: 요청 본문의 `apiKey`나 환경변수 키를 `console.log`, 에러 메시지, 응답에 넣는 것. Google 호출은 키가 URL 쿼리에 들어가므로 (`server/index.ts:99`) 요청 URL을 에러 메시지에 포함하지 않는다.
- 하지 마라: `withModelFallback` 안에서 에러 종류를 구분하지 않는다는 점을 무시한 변경. 현재는 모든 에러에서 다음 모델로 넘어간다 (`server/fallback.ts:13-19`). 인증 오류까지 재시도되므로 동작을 바꿀 때 테스트(`server/fallback.test.ts`)를 갱신한다.
- 하지 마라: Gemini의 `MAX_TOKENS` 잘림 감지를 제거하는 것. 잘린 코드는 미리보기에서 깨진다 (`server/index.ts:123-125`). Anthropic 경로에는 이 검사가 없다.
- 하라: `SYSTEM_PROMPT`를 수정하면 `render(<ComponentName />)` 규칙과 import 금지, TypeScript 문법 금지 규칙을 유지한다. 프론트 프리뷰가 이 전제에 의존한다.
