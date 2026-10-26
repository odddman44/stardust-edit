import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

export function ImageView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  return <NodeViewWrapper as="figure" className="cosmos-image" contentEditable={false}>
    <img src={node.attrs.src} alt={node.attrs.alt} data-drag-handle draggable />
    <figcaption><input aria-label="사진 설명" placeholder="사진 설명을 적어주세요" value={node.attrs.caption}
      onChange={event => updateAttributes({ caption: event.target.value })} /></figcaption>
    <details className="cosmos-image-info"><summary>사진 정보</summary>
      <label>대체 텍스트<input aria-label="사진 대체 텍스트" placeholder="사진의 내용을 설명해주세요" value={node.attrs.alt}
        onChange={event => updateAttributes({ alt: event.target.value })} /></label>
      <button type="button" onClick={deleteNode}>사진 삭제</button>
    </details>
  </NodeViewWrapper>;
}
