# Cosmoslog Editor

React에서 쉽게 붙여 쓰는 블록 에디터입니다. 문법을 몰라도 메뉴로 작성하고, 익숙해지면 단축키로 빠르게 기록할 수 있습니다.

- 문단·제목·목록·체크리스트·인용·코드·사진·구분선
- `/` 블록 메뉴, 마크다운 입력 단축키, 선택 영역 서식
- 사진 선택·붙여넣기·드롭, 업로드 주입과 재시도
- 동일 너비 2열, 좁은 컨테이너에서는 세로 표시
- 버전이 있는 JSON 저장, DOM 없는 서버 HTML 렌더링, Markdown 내보내기
- 범위를 제한한 기본 CSS와 시스템 밝음·어두움 표현

## 로컬에서 실행

Node.js 22.12 이상과 pnpm 11을 사용합니다.

```sh
pnpm install
pnpm --filter @cosmoslog/editor build
pnpm --filter demo dev
```

데모는 [localhost:3000](http://localhost:3000)에서 실행합니다. 저장 버튼은 이 브라우저에 JSON을 저장합니다. 사진 업로드는 포함된 샘플 이미지로 대체하는 시연이며 선택한 원본을 서버에 저장하지 않습니다.

## 소비 앱에서 사용

패키지 이름은 현재 `@cosmoslog/editor`입니다. npm 공개 전에는 이 저장소에서 만든 tarball을 설치할 수 있습니다.

```sh
pnpm --filter @cosmoslog/editor build
cd packages/editor
npm pack
# 소비 앱에서 생성한 .tgz 파일을 설치합니다.
```

```tsx
'use client';

import { CosmosEditor } from '@cosmoslog/editor/react';
import '@cosmoslog/editor/styles.css';

export function PostEditor() {
  return <CosmosEditor onChange={(document, info) => {
    // 문서와 대기·실패 수를 소비 앱의 저장 UI에 연결합니다.
    console.log(document, info);
  }} />;
}
```

사진 추가는 `uploadImage: (file: File) => Promise<{ url: string }>`를 전달하면 활성화됩니다. 저장소·로그인·권한·자동 저장 정책은 소비 앱이 정합니다.

[사용 방법](docs/usage.md) · [문서 형식과 변환 규칙](docs/document-format.md) · [호환성과 검증](docs/compatibility.md)

## 개발과 검증

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
pnpm verify:package
```

`verify:package`는 실제 tarball을 별도 프로젝트에 설치하여 React+Vite와 Next.js 빌드를 확인합니다. 설치에 npm 레지스트리 접근이 필요합니다.

첫 버전은 React 19·Next.js 16과 최신 브라우저를 대상으로 합니다. 실제 한글 IME·모바일 실기기 검증 상태는 호환성 문서를 확인하세요. 원고지·추가 테마·협업·표·임베드는 포함하지 않습니다.

## 라이선스

[MIT](LICENSE). Tiptap·ProseMirror·React 등 의존성의 라이선스는 각각 유지됩니다.
