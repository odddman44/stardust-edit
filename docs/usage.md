# 사용 방법

## React 편집기

```tsx
'use client';

import { useRef, useState } from 'react';
import type { CosmosDocument } from '@cosmoslog/editor';
import { CosmosEditor } from '@cosmoslog/editor/react';
import type { CosmosEditorHandle, UploadImage } from '@cosmoslog/editor/react';
import '@cosmoslog/editor/styles.css';

export function PostEditor({ documentId, initialDocument, uploadImage, onSave }: {
  documentId: string;
  initialDocument: CosmosDocument;
  uploadImage?: UploadImage;
  onSave: (document: CosmosDocument) => Promise<void>;
}) {
  const ref = useRef<CosmosEditorHandle>(null);
  const [message, setMessage] = useState('');
  async function save() {
    const result = ref.current?.getDocument();
    if (!result) return;
    if (!result.ok) { setMessage(result.error.message); return; }
    try {
      await onSave(result.value);
      setMessage('저장했습니다.');
    } catch { setMessage('저장하지 못했습니다. 다시 시도해주세요.'); }
  }
  return <>
    <CosmosEditor key={documentId} ref={ref} initialDocument={initialDocument}
      uploadImage={uploadImage} onError={error => setMessage(error.message)}
      onChange={(_document, info) => setMessage(info.pendingUploadCount ? '사진 업로드 중입니다.' : '변경 사항이 있습니다.')} />
    <button type="button" onClick={save}>저장</button>
    <p role="status">{message}</p>
  </>;
}
```

`initialDocument`는 생성할 때만 적용됩니다. 다른 글을 열 때는 `key={documentId}`를 바꾸세요. 부모가 다시 렌더링되어도 편집 중인 문서를 초기화하지 않습니다. 제어형 `value`와 라이브러리 자체 자동 저장은 제공하지 않습니다.

서버에서 읽은 데이터는 `parseDocument(input: unknown)`로 검증할 수 있습니다. 잘못된 입력을 빈 문서로 바꾸어 덮어쓰지 마세요. `createEmptyDocument()`는 명시적으로 새 글을 만들 때 사용합니다.

## 이미지 업로드

```ts
const uploadImage = async (file: File): Promise<{ url: string }> => {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/api/images', { method: 'POST', body: form });
  if (!response.ok) throw new Error('이미지 저장 실패');
  return response.json();
};
```

`/api/images`는 소비 앱에서 구현할 예시 경로입니다. 서버에서 파일 형식·크기·권한을 검증하고 안전한 영구 URL을 반환하세요. 함수가 없으면 이미지 추가는 비활성화되지만 기존 이미지는 표시합니다. `http:`, `https:`, 사이트 내 `/경로`를 지원하며 임시 `blob:`·`data:` URL은 영구 문서로 받지 않습니다.

변경 콜백의 `info`에는 `pendingUploadCount`와 `failedUploadCount`가 있습니다. 업로드 대기·실패 상태가 남아 있으면 최종 `getDocument()`는 `UPLOAD_INCOMPLETE`를 반환합니다. 임시 노드와 파일은 변경 문서 JSON에 저장하지 않습니다.

## 서버 읽기 화면

```tsx
import { renderDocumentToHtml } from '@cosmoslog/editor/renderer';
import '@cosmoslog/editor/styles.css';

export function Article({ document }: { document: unknown }) {
  const result = renderDocumentToHtml(document);
  if (!result.ok) return <p>문서를 표시하지 못했습니다.</p>;
  return <article dangerouslySetInnerHTML={{ __html: result.value }} />;
}
```

렌더러는 브라우저 DOM·편집기 인스턴스·React 훅 없이 실행합니다. 검증한 문서의 HTML만 반환하며 원시 HTML 블록은 지원하지 않습니다. 읽기 체크박스는 비활성 상태로 출력합니다.

## 단축키와 배치

`/`로 블록을 고르고 방향키·Enter·Escape로 조작합니다. `# `, `## `, `### `, `- `, `1. `, `> `, 백틱 세 개 등의 입력 규칙을 지원합니다. 조합 중에는 사용자 정의 메뉴 명령을 실행하지 않습니다.

블록 메뉴에서 2열을 만들거나 내용을 다른 열로 옮길 수 있습니다. 열 해제는 왼쪽 다음 오른쪽 순서로 보존합니다. 2열은 본문 컨테이너 너비 768px 미만에서 세로로 표시됩니다. 비어 있지 않은 열 행 전체 삭제는 확인이 필요합니다.

## 오류와 내보내기

오류는 `{ code, message, path? }` 형식이며 문서·렌더러 함수는 `{ ok: true, value }` 또는 `{ ok: false, error }`를 반환합니다. `onError`에는 초기 문서 오류와 업로드 실패 등이 전달됩니다.

`exportDocumentToMarkdown`은 `{ markdown, warnings }`를 반환합니다. [변환 규칙](document-format.md)을 확인하고, 편집 가능한 원본은 JSON으로 보관하세요.
