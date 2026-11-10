// PreToolUse(Bash) 훅: git commit 직전에 전체 테스트를 돌려 실패하면 커밋을 차단한다.
const input = JSON.parse(await Bun.stdin.text());
const command: string = input?.tool_input?.command ?? "";

if (!/\bgit\s+(?:-\S+\s+)*commit\b/.test(command)) process.exit(0);

const proc = Bun.spawnSync(["bun", "run", "test"], {
  cwd: input.cwd ?? process.cwd(),
  stdout: "pipe",
  stderr: "pipe",
});

if (proc.exitCode === 0) process.exit(0);

const tail = (buf: Uint8Array) => new TextDecoder().decode(buf).split("\n").slice(-40).join("\n");
console.error(`테스트가 실패해서 커밋을 차단했습니다. 모든 테스트를 통과시킨 뒤 다시 커밋하세요.\n\n${tail(proc.stdout)}\n${tail(proc.stderr)}`);
process.exit(2);
