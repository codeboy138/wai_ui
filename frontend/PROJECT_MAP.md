# WAI Studio Frontend 작업 지침 (ChatGPT 컨텍스트용)

⚠️ 이 문서는 두 부분으로 구성됩니다.  
- **[A] 고정 아키텍처 & 기본 지침**: 프로젝트의 불변 규칙 (임의 수정/삭제 금지)  
- **[B] 현재 작업 흐름 전달 템플릿**: 각 세션마다 현재 상태를 채워 넣는 부분  

새 챗봇 세션을 시작할 때 **[A] + [B] 전체를 복사·붙여넣기** 하되,  
[A]는 그대로 유지하고, [B]만 현재 상황에 맞게 수정합니다.

> **중요:** 이 문서 안에는 예시용 자동 저장 헤더(대괄호 포함 패턴)를 넣지 않습니다.  
> 실제 자동 저장 시에만 이 파일의 첫 줄처럼 `WAI:UPDATE:파일경로` 형식을 사용합니다.  
> (문서 안의 설명에서는 `WAI : UPDATE` 같이 콜론 주변에 공백을 넣어 표기합니다.)

---

## [A] 고정 아키텍처 & 기본 지침 (변경 금지 섹션)

이 섹션은 **프로젝트의 공식 규칙/아키텍처**입니다.  
사용자의 명시적인 “지침 개정” 요청이 없는 한 내용을 바꾸지 않습니다.

---

### 1. 환경 / 경로

- **Git 루트**: `C:\wai-ui`  
- **프론트엔드 루트**: `C:\wai-ui\frontend`  
- **이 문서 파일 위치**: `C:\wai-ui\frontend\PROJECT_MAP.md`  
- **주요 스크립트**
  - 자동 동기화: `C:\wai-ui\wai_magic.py`
  - 정상 버전 스냅샷: `C:\wai-ui\snapshot_frontend.bat`

---

### 2. 파일 관리 및 Git 전략

#### 2.1. wai_magic.py (파일 단위 자동 저장·커밋)

**역할**

ChatGPT가 제공한 코드를 클립보드에 복사하면:

- 헤더를 읽어서  
  - `frontend/상대/경로/파일명` 에 파일 저장  
  - 해당 파일만 `git add` + `git commit` (+ 필요 시 `git push`)

**입력 형식 (항상 “파일 전체” 필수)**

- 실제 사용할 때 형식(예시, 공백 없이):  
  `### [WAI:UPDATE:상대/경로/파일명]`  
- 이 문서 안에서는 설명용으로만 `WAI : UPDATE` 처럼 공백을 섞어서 적습니다  
  (자동 저장 파서가 예시 줄을 오인식하지 않도록 하기 위함).

---

#### 2.1.1. 전체 코드 제공 의무 (⚠️ 매우 중요, 필수 준수)

이 프로젝트에서 `wai_magic.py`를 통해 파일을 수정할 때,  
**“파일 전체 코드”를 제공하지 않는 행위는 치명적 오류**로 간주합니다.

- `wai_magic.py` 는 해당 파일을 **통째로 덮어쓴 뒤 커밋**합니다.
- ChatGPT가 파일의 **일부 코드만** 응답하면:
  - 나머지 기존 코드는 **전부 사라진 상태**로 저장·커밋됩니다.
- 결과:
  - JS/HTML 구조가 깨져 **실행 불가 / 화면 붕괴**
  - Git 이력에 “망가진 버전”이 남아 **복구 작업이 매우 어려워짐**

따라서 다음과 같은 패턴은 **전면 금지**입니다.

- “위에 있던 코드는 그대로 두고, 아래 부분만 이렇게 바꾸세요”
- “중간 함수만 이렇게 수정하세요”
- “이 구문만 추가하세요”
- “나머지는 생략합니다 / … / 기존 코드는 동일합니다” 등

**챗봇 특성에 대한 엄격한 금지 규칙**

ChatGPT는 코드 제안 시 다음을 **절대 사용해서는 안 됩니다.**

- `...`, `생략`, `중략`, `기타 코드는 동일` 등의 표현  
- “위 코드 일부는 그대로 두고, 아래만 수정”이라는 설명  
- “기존 코드에 이 부분만 추가하세요”와 같은 부분 패치 지시  

항상:

- 해당 파일을 수정할 때는, 그 파일의 **“최종 완성본 전체 내용”** 을 한 번에 제시해야 합니다.
- 이전 대화에서 보냈던 코드에 의존하여  
  “앞부분은 같은 것으로 간주하고 뒷부분만 보낸다” → **허용되지 않습니다.**

---

#### 2.1.2. ChatGPT 자체 점검 의무

ChatGPT는 응답을 생성할 때마다 스스로 다음을 확인합니다.

1. 지금 수정 대상으로 언급한 것이 **실제 파일 이름**인지?  
   (예: `index.html`, `js/components/TimelinePanel.js` 등)
2. 현재 응답이 그 파일의 **전체 내용**인지?  
   (특정 함수/블록 일부만 내보낸 건 아닌지)
3. `...`, `생략`, `중략`, “나머지는 동일” 등의 표현이 들어가 있지 않은지?

만약 “이건 전체 파일이 아니라 일부 같다”고 판단될 경우,  
반드시 사용자에게 먼저 요청합니다.

> “이 파일은 `wai_magic.py`로 통째로 덮어써지기 때문에,  
> 안전하게 수정하려면 **현재 파일의 전체 내용**이 필요합니다.  
> 1) 지금 로컬에 있는 해당 파일의 전체 코드를 붙여주시거나,  
> 2) 아니면 제가 이 파일을 **새 전체 버전으로 재정의해도 되는지**  
>    명시적으로 허용해 주세요.”

이 과정을 거친 뒤에만,  
새 전체 코드를 `WAI:UPDATE:경로` 형식의 헤더와 함께 제안합니다.

---

#### 2.1.3. 여러 파일 수정 시 규칙

여러 파일을 동시에 수정할 때는, **파일마다 한 블록씩** 제공합니다.

- 예시(설명용 표기):

  - `### [WAI : UPDATE:경로1]`  
    → 실제 헤더에서는 공백 없이 `WAI:UPDATE:경로1` 사용  
  - `...파일1 전체 코드...`

  - `### [WAI : UPDATE:경로2]`  
    → 실제 헤더에서는 공백 없이 `WAI:UPDATE:경로2` 사용  
  - `...파일2 전체 코드...`

각 블록은 **해당 파일의 전체 내용**이어야 하며,  
어떤 블록에서도 아래 표현을 쓰지 않습니다.

- `...`
- `생략`
- `중략`
- “나머지는 동일”
- “기존 코드와 동일”

**요약**

- `wai_magic.py`를 통한 모든 수정은  
  **“전체 파일 코드”만 통째로** 제안해야 합니다.
- **부분 수정 / 생략 / 중략 / 압축은 전면 금지**입니다.

---

#### 2.2. snapshot_frontend.bat (정상 버전 스냅샷용)

**역할**

- 현재 프론트엔드가 **정상 동작하는 시점**을  
  GitHub에 **복구 가능한 정상 버전 스냅샷**으로 저장합니다.

**위치**

- `C:\wai-ui\snapshot_frontend.bat`

**동작 개요**

1. 새 CMD 창에서 실행  
2. `frontend/WAI_SNAPSHOT_VERSION.md` 에  
   `wai_ui_YYYY-MM-DD_HH:MM:SS.xx` 형식 태그를 기록 (매번 내용 변경)  
3. `git add frontend`  
4. `git commit -m "[WAI:SNAPSHOT] wai_ui_날짜_시간 frontend stable"`  
5. `git push origin`  
6. `git rev-parse HEAD` 와 `git ls-remote origin HEAD` 를 비교해  
   로컬 HEAD와 원격 HEAD 일치 여부를 CMD 창에 출력  

**사용 원칙**

- 기능/작업 하나가 **완료되었고**,  
  프론트엔드가 **정상 동작함을 확인한 직후에만** 실행합니다.
- 이렇게 만들어진 `[WAI:SNAPSHOT] ... frontend stable` 커밋들은  
  나중에 언제든 되돌릴 수 있는 **“정상 버전 복구 포인트”**입니다.

---

### 3. UI 관련 절대 원칙

- 대상: **WAI Studio 에디터 전체 화면**

**최우선 원칙**

> “현재 눈에 보이는 화면(레이아웃/구도/배치/동작)을 그대로 유지한다.”

다음은, 사용자가 **명시적으로 허용**하지 않는 한 **절대 금지**입니다.

- 레이아웃 구조 변경  
- 요소 위치/정렬 변경  
- 탭/패널/버튼의 개수나 배치 변경  
- 사용자가 체감하는 UI/UX 동작 변화  

**변경 허용 범위**

- 내부 코드/아키텍처:
  - JS 구조 리팩터링
  - 파일 분리
  - 네이밍 정리
  - 상태 관리 구조 개선
  - Python 브리지 / store / inspector 내부 로직 개선
  - 등 **화면에 직접 보이지 않는 부분**

**기술 스택**

- Electron  
- Vue 3 (CDN)  
- Tailwind CSS (CDN)  
- ES6 JavaScript  
- (향후 Vite/Webpack 기반 빌드로 확장 가능성 있음)

---

### 4. 리팩터링 핵심 원칙

#### 4.1. 분리된 진실의 원천 (Separated Source of Truth)

**DOM (HTML)**

- `id` : 의미/경로 식별자
- `data-action` : Python/JS 액션 정의
- `title` : 사용자 툴팁
- `class` : 스타일(BEM)
- `data-dev` : 100% 제거

**로직/명세**

- `docs/element-specs.js` 등 **외부 JS**에서 관리  
  (IO, Logic, Python/JS 함수명 등)

**ID에 상태/로직 금지**

- ID는 **역할/의미/위치만 표현**
- 상태/로직/순서 등은 ID에 포함하지 않음
- 예 (지양): `id="btn-save-active"`
- 예 (지향): `id="timeline-clip-item"`
- 활성/비활성, 선택 상태 등은 **class BEM modifier**로 표현:
  - `.c-tab--active`, `.c-btn--disabled`

#### 4.2. 파일 최대 분할 (Max 200 lines per file)

- JS/HTML 파일은 **200줄 이내**를 목표
- 분할 기준:
  - 컴포넌트 단위 (Header, TimelinePanel, PreviewCanvas 등)
  - 기능 단위 (panelResizer, pythonBridge, devMode 등)
  - 유틸리티 단위 (dom utils, constants 등)
- 공통 로직은 **mixin/유틸**로 추출

#### 4.3. 최소 속성 원칙 (Minimal Attributes)

HTML 요소당 **평균 4개 이하 속성** 목표:

- `id` (필수)
- `class` (필수, BEM)
- `data-action` (인터랙션 요소에만)
- `title` (툴팁, 가능하면 필수)

`data-dev` 는 전면 제거.

**속성 값 규칙**

- `id`, `data-action`, `class` 값:
  - 영문 소문자 + 숫자 + `-` + `_` 만 사용
  - 한글, 공백, 특수문자(?, !, @ 등) 금지
- 예:
  - `id="nav-main-explore-btn"`
  - `data-action="py:nav_explore|js:openExplorer"`

---

### 5. 네이밍 / 명세 규칙

#### 5.1. ID 네이밍

**금지 (네거티브 규칙)**

- 위치/순서 기반 이름:
  - `tab1`, `tab2`, `left-tab`, `top-tab` 등

**권장 (의미 기반 이름)**

- 기능/콘텐츠 기반:
  - `nav-main-explore-tab`
  - `panel-timeline-main`
  - `panel-layer-matrix` 등

**구조 예시**

- 패턴: `[영역]-[서브영역]-[기능]-[타입]`
- 예:
  - `nav-main-explore-btn`
  - `panel-left-assets-header`
  - `timeline-track-audio-row`
  - `canvas-layer-top-box`

**ID 안정성**

- ID는 **변하지 않는 고유 식별자**
- 상태/순서/색상/언어 등 변동 정보는 ID에 넣지 않음
- 반복 요소(`v-for`)는:
  - `timeline-clip-{id}`, `canvas-box-{id}` 등 유일한 패턴으로 생성

#### 5.2. data-action

**포맷**

- `py:함수명`          → Python 호출  
- `js:액션명`          → JS 액션 호출  
- `py:함수명|js:액션명` → Python + JS 복합 실행  

**적용 대상**

- 클릭/입력 등 인터랙션 있는 모든 요소
- Python/JS 호출이 필요한 UI 요소

**실행 순서**

- 좌→우 순서로 실행:
  - `data-action="py:save_project|js:notifySave"`
    - 먼저 `py:save_project`
    - 이후 `js:notifySave`

**이벤트**

- 기본: `click` 이벤트에만 적용
  - DOM: `addEventListener('click', ...)`
  - Vue: `@click`
- `input` / `change` / `keydown` 등 다른 이벤트 필요 시:
  - 별도 규약(`data-action-event`)을 정의
  - 이 문서와 `element-specs.js` 에 명시

**함수명 컨벤션**

- Python: `snake_case` (예: `save_project`)
- JS: `camelCase` (예: `openProjectModal`)

#### 5.3. docs/element-specs.js

**역할**

- 각 `id` 에 대한 IO/로직/함수명 등 **기술 명세 중앙 관리**
- Inspector/Dev 모드, Python 브리지 등에서 참조

**필수 필드**

- `io` : 입출력 설명
- `logic` : 행위/로직 설명

**선택 필드 (권장)**

- `py_func`, `py_params`
- `js_action`
- `methods`
- `affects`
- `desc`
- `module`
- `events` (기본: `"click"`)
- `deprecated` (boolean)

**동적 요소**

- ID 패턴에 `{id}` 사용:
  - 예: `timeline-clip-{id}`, `canvas-box-{id}`
- 런타임에 정규식 매칭
- `examples` 배열에 실제 예시 ID 기록 권장

---

### 6. Inspector / Dev 모드

**Inspect 모드**

- 마우스 호버:
  - ID + 크기(가로/세로) 표시
- 클릭:
  - ID를 클립보드에 복사
  - Toast 등으로 안내 메시지 출력

**element-specs 기반 모드 (기존 data-dev 대체)**

- `data-dev` 제거 후, `element-specs.js` 기반으로 동작
- ID 기준으로 IO/Logic/함수명 등을 조회·표시

**폴백 규칙**

- `element-specs.js` 에 spec 이 없는 ID:
  - Tooltip/패널:
    - `Spec: NOT FOUND`
    - `data-action`이 있으면 함께 표시
  - 콘솔:
    - `[INSPECT] spec not found for id="..."`
- ID 없이 `data-action`만 있는 경우:
  - `ID: (none)` + `data-action` 표시
  - 가능하면 해당 요소에 ID를 부여해야 할 TODO 로 간주

---

### 7. Python 연동 / 자동화

**브리지 규격**

- 기본 호출: `firePython(funcName, params)`
  - 내부적으로 `window.backend[funcName](params)` 호출
- `data-action` 의 `py:함수명` 과  
  `element-specs.js` 의 `py_func` 를 일치시키는 것을 원칙으로 함

**자동 바인딩 우선순위**

1. `js:` 액션:
   - Vue `methods` 또는 전역 `store.actions` 우선 호출
2. `py:` 액션:
   - `window.backend[...]` 로 Python 호출

**실패 처리**

- 일반 기능:
  - 콘솔 경고만 출력, UI는 가능한 한 유지
- 치명 기능(저장/내보내기 등):
  - SweetAlert 등으로 사용자에게 명시적으로 알림

**정적 검사 항목**

- 모든 `[data-action]` 요소:
  - `element-specs.js` 에 대응 spec 존재 여부 확인
- 모든 `py:` 함수:
  - `window.backend` 에 해당 이름 함수가 실제 존재하는지 확인

---

### 8. ChatGPT 응답 규칙

1. **항상 존댓말 사용**
2. **수정 단위는 “파일 전체”**
   - 헤더: `WAI:UPDATE:경로` 형식 + 전체 내용
3. **레이아웃/화면/UX 는 사용자의 명시 허가 없이는 절대 변경 금지**
4. **네이밍은 기능/의미 기반, 위치/순서 기반 이름 금지**
5. **맥락 고정**
   - 항상 `C:\wai-ui`, `frontend`, `wai_magic.py`, `snapshot_frontend.bat`, `frontend\PROJECT_MAP.md` 가 존재한다고 가정
   - 이 [A] 섹션의 원칙과 모순되는 제안은 하지 않음

---

### 9. 핵심 키워드 (기억용)

- 화면 고정: “보이는 UI는 건드리지 않는다 (허가 시만 예외)”
- 파일 전체 업데이트: `WAI:UPDATE:...` 헤더 + 전체 코드
- 부분 수정·생략·중략·압축 전면 금지 (특히 `wai_magic.py` 연동 시)
- 자동 저장: `wai_magic.py`
- 정상 버전 스냅샷: `snapshot_frontend.bat` + `[WAI:SNAPSHOT] ... frontend stable`
- 네이밍: 기능·의미 기반, 위치/순서 기반 금지

---

## [B] 현재 작업 흐름 전달 템플릿 (세션마다 갱신 섹션)

이 섹션은 **각 세션마다 자유롭게 수정/갱신**합니다.  
형식은 유지하고, 내용만 현재 상황에 맞게 채워 넣습니다.

---

### B-1. 현재 리포지토리 / 브랜치 상태

- 사용 브랜치: (예: `main`)
- 마지막 스냅샷 커밋 (있다면):
  - 메시지: (예: `[WAI:SNAPSHOT] wai_ui_2025-12-10_ 8:39:10.37 frontend stable`)
  - 대략 시각: (예: `2025-12-10 오전 8시 40분경`)
- 최근 `git pull` / `git fetch` 여부:
  - (예: “오늘 새벽에 pull 완료”)

---

### B-2. 현재 프론트엔드 파일 구조

> 새 세션 시작 시, 아래 명령의 출력 결과를 붙여 주세요.

**사용한 명령 (둘 중 하나)**

- PowerShell:

```powershell
cd C:\wai-ui\frontend
ls -r
# 또는
cd C:\wai-ui\frontend
Get-ChildItem -Recurse
