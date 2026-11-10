// PreToolUse(Edit|Write) 훅: 코드 생성·수정 직전에 .claude/rules/tdd.md 규칙을 상기시킨다.
const input = JSON.parse(await Bun.stdin.text());
const filePath: string = (input?.tool_input?.file_path ?? "").replaceAll("\\", "/");

// .ts/.tsx 파일만 대상. 테스트 파일은 건너뛴다 (테스트를 쓰는 중에는 상기가 필요 없다).
const isSource = /\.tsx?$/.test(filePath);
const isTest = /\.(test|spec)\.tsx?$/.test(filePath);
if (!isSource || isTest) process.exit(0);

const reminder = `[TDD 규칙 상기] .claude/rules/tdd.md 는 Rigid 규칙이다. 지금 수정하려는 파일: ${filePath}
- 순서: RED(실패 테스트 작성, 반드시 실행해 "기능 미구현" 사유로 실패 확인) → GREEN(최소 코드) → REFACTOR(green 유지).
- 이 편집 전에 해당 동작의 실패하는 테스트를 이미 작성하고 실행해 실패를 확인했는가? 아니라면 이 편집을 멈추고 테스트부터 쓴다.
- 버그 수정이면 버그를 재현하는 실패 테스트가 먼저다. 하나의 동작 = 하나의 테스트.
- 테스트보다 먼저 쓴 프로덕션 코드는 주석 처리나 보관 없이 삭제하고 RED부터 다시 시작한다.
- 테스트가 요구하지 않는 기능·분기·옵션은 넣지 않는다 (YAGNI).
- 순수 UI(마크업·스타일), 타입 정의, 설정 파일은 TDD 예외다. 경계가 모호하면 적용하는 쪽으로 판단한다.
- 단, server/index.ts 는 부수효과 모듈이라 테스트가 없다. 테스트 가능한 로직은 별도 모듈로 분리해 테스트와 함께 작성한다.`;

console.log(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: reminder },
  }),
);
