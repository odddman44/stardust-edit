import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import type { UploadManager } from '../uploads/uploadManager.js';

export function UploadPlaceholderView({ node, extension, deleteNode }: NodeViewProps) {
  const manager = (extension.options.getManager as () => UploadManager | null)();
  const state = manager?.getState(node.attrs.id);
  return <NodeViewWrapper className="cosmos-upload" contentEditable={false}>
    {node.attrs.previewUrl && <img src={node.attrs.previewUrl} alt="업로드 중인 사진 미리보기" />}
    <div className="cosmos-upload-status" role="status">
      {state?.status === 'failed' ? <><span>{state.error.message}</span><button type="button" onClick={() => manager?.retry(node.attrs.id)}>다시 시도</button></>
        : <span>사진을 업로드하고 있어요…</span>}
      <button type="button" onClick={deleteNode} aria-label="업로드 제거">제거</button>
    </div>
  </NodeViewWrapper>;
}
