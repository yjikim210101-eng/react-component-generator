---
name: create-pr
description: |
  현재 브랜치의 변경사항을 분석해 템플릿에 맞는 PR 제목과 본문을 작성하고, 브랜치를 push한 뒤 GitHub PR을 생성한다.
  "PR 만들어줘", "PR 생성", "풀리퀘 올려줘", "create pr", "open a pull request", "/create-pr" 같은 요청에 활성화한다.
  기본 언어는 한국어이며, 인자로 `en`을 주면 영어 템플릿을 쓴다.
context: fork
allowed-tools: Read Glob Grep Bash
---

# create-pr: 변경사항 분석 후 PR 생성

현재 브랜치가 base 브랜치 대비 무엇을 바꿨는지 분석하고, 템플릿을 채워 PR을 만든다.
이 스킬은 분리된 컨텍스트(`context: fork`)에서 실행되므로 사용자에게 되물을 수 없다. 판단이 필요한 지점은 아래 기본값을 따르고, 결과 보고에 그 판단을 적는다.

## 인자

- 인자 없음 또는 `kr`: `references/pr-template.kr.md` 사용 (기본값)
- `en`: `references/pr-template.en.md` 사용
- 그 외 텍스트는 base 브랜치 이름으로 취급한다 (예: `/create-pr develop`). 기본 base는 저장소의 기본 브랜치.

## 절차

### 1. 사전 확인

```bash
git rev-parse --abbrev-ref HEAD
gh repo view --json defaultBranchRef -q .defaultBranchRef.name
git status --short
gh auth status
```

- 저장소가 아니거나 `gh`가 인증되지 않았으면 그 사실만 보고하고 종료한다.
- 현재 브랜치가 base(기본 브랜치)와 같으면 PR을 만들 수 없다. 사유를 보고하고 종료한다. 브랜치는 만들지 않는다.
- 커밋되지 않은 변경이 있으면 PR에 포함되지 않는다. 커밋하지 말고 보고서에 "미커밋 변경 있음"으로 알린다.
- 이미 같은 브랜치의 열린 PR이 있으면 새로 만들지 말고 URL을 보고한다.

```bash
gh pr list --head "$(git rev-parse --abbrev-ref HEAD)" --state open --json url,number
```

### 2. 변경사항 분석

```bash
git fetch origin <base>
git log origin/<base>..HEAD --oneline
git diff origin/<base>...HEAD --stat
git diff origin/<base>...HEAD
```

- 커밋 범위가 비어 있으면 PR을 만들 변경이 없다. 보고하고 종료한다.
- diff가 크면 파일로 리디렉션한 뒤 Read로 필요한 부분만 읽는다.
- 커밋 메시지가 아니라 **diff를 근거**로 쓴다. 둘이 다르면 diff를 따른다.
- `.env`, 키, 토큰 등 비밀 정보가 diff에 있으면 push하지 말고 위치를 보고한 뒤 종료한다.

### 3. 본문 작성

1. 선택한 언어의 템플릿 파일을 Read로 읽는다.
2. 템플릿의 모든 섹션을 채운다. 해당 사항이 없는 섹션은 지우지 말고 "해당 없음" (영어는 "N/A")으로 적는다.
3. **왜 필요한지**가 드러나게 쓴다. 파일명 나열은 피한다.
4. 테스트 항목은 실제로 확인한 것만 체크한다. 실행하지 않은 것을 체크하지 않는다. 테스트를 직접 돌리지 않았다면 "미실행"으로 적는다.
5. 본문 끝에 환경에 지정된 PR attribution 줄이 있으면 붙인다.

제목 규칙:
- 70자 이내 한 줄. 커밋 컨벤션의 type 접두사(`feat:`, `fix:`, `refactor:`, `chore:`)를 쓴다.
- 커밋이 하나면 그 커밋 메시지를 기준으로 하고, 여러 개면 전체를 아우르는 한 줄로 쓴다.
- 언어는 선택한 템플릿 언어를 따른다. 코드 식별자와 기술 용어는 원문 그대로 둔다.

### 4. push와 PR 생성

사용자가 `/create-pr`를 호출한 것은 **현재 브랜치 push와 PR 생성에 대한 명시적 요청**이다. 그 범위만 실행한다.

```bash
git push -u origin HEAD
gh pr create --base <base> --title "<제목>" --body "<본문>"
```

- 본문은 여러 줄이므로 heredoc으로 전달한다. 종료 구분자는 본문에 나오지 않는 이름(예: `PR_BODY_END`)을 쓴다.
- push는 현재 브랜치 한 개만 한다. `--force`, `--force-with-lease`는 쓰지 않는다.
- push가 거부되면(non-fast-forward 등) 우회하지 말고 원인을 보고하고 종료한다.
- 기본은 일반 PR이다. 사용자가 인자나 요청에서 draft를 말했을 때만 `--draft`를 붙인다.
- 리뷰어, 라벨, 마일스톤은 지정하지 않는다.

### 5. 보고

다음을 간결하게 보고한다.

- PR URL
- base와 head 브랜치, 포함된 커밋 수
- 사용한 템플릿 언어
- 스킬이 내린 판단(미커밋 변경 존재, 테스트 미실행 등)

## 하지 않는 것

- 기본 브랜치에서 PR을 만들기 위해 브랜치를 새로 만들거나 커밋하지 않는다.
- `--force` push, 브랜치 삭제, PR 병합(`gh pr merge`)은 하지 않는다.
- 이미 열린 PR을 덮어쓰거나 닫지 않는다.
- 본문에 비밀 정보나 `.env` 내용을 넣지 않는다.
- Read, Glob, Grep, Bash 외의 도구는 쓰지 않는다. 파일을 수정하지 않는다.
