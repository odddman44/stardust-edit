'use client';

import { useEffect, useRef, useState } from 'react';
import { createEmptyDocument, parseDocument } from '@cosmoslog/editor';
import type { CosmosDocument } from '@cosmoslog/editor';
import { CosmosEditor } from '@cosmoslog/editor/react';
import type { CosmosEditorHandle } from '@cosmoslog/editor/react';
import { sampleDocument } from '../lib/sampleDocument';
import { demoUpload } from '../lib/demoUpload';
import { renderPreview } from './actions';

const storageKey = 'cosmoslog-demo-document';

export function EditorDemo() {
  const [initial, setInitial] = useState<CosmosDocument | null>(null);
  const [documentId, setDocumentId] = useState(0);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('이 기기에만 저장됩니다');
  const [preview, setPreview] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const ref = useRef<CosmosEditorHandle>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = parseDocument(saved ? JSON.parse(saved) : sampleDocument);
      if (parsed.ok) setInitial(parsed.value);
      else setError(parsed.error.message);
    } catch {
      setError('저장된 문서를 읽지 못했습니다. 기존 데이터는 유지됩니다.');
    }
  }, []);

  function save() {
    const result = ref.current?.getDocument();
    if (!result) return;
    if (!result.ok) { setError(result.error.message); return; }
    try {
      localStorage.setItem(storageKey, JSON.stringify(result.value));
      setStatus('이 기기에 저장됨');
      setError('');
    } catch { setError('기기의 저장 공간을 확인해주세요.'); }
  }

  async function showPreview() {
    const result = ref.current?.getDocument();
    if (!result) return;
    if (!result.ok) { setError(result.error.message); return; }
    setPreviewBusy(true);
    try {
      const rendered = await renderPreview(result.value);
      if (rendered.ok) { setPreview(rendered.value); setError(''); }
      else setError(rendered.error.message);
    } catch { setError('미리보기를 불러오지 못했습니다. 다시 시도해주세요.'); }
    finally { setPreviewBusy(false); }
  }

  function newDocument() {
    if (!window.confirm('현재 화면의 내용을 지우고 새 문서를 만들까요? 저장한 문서도 초기화됩니다.')) return;
    try {
      localStorage.removeItem(storageKey);
      setInitial(createEmptyDocument());
      setDocumentId(value => value + 1);
      setPreview(null);
      setError('');
      setStatus('새 문서');
    } catch { setError('기기 저장 공간에 접근하지 못했습니다.'); }
  }

  async function downloadMarkdown() {
    const current = ref.current?.getDocument();
    if (!current) return;
    if (!current.ok) { setError(current.error.message); return; }
    try {
      const { exportDocumentToMarkdown } = await import('@cosmoslog/editor/renderer');
      const result = exportDocumentToMarkdown(current.value);
      if (!result.ok) { setError(result.error.message); return; }
      const url = URL.createObjectURL(new Blob([result.value.markdown], { type: 'text/markdown;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cosmoslog-document.md';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setError('');
      setExportMessage(result.value.warnings.includes('COLUMNS_FLATTENED')
        ? '2열은 왼쪽·오른쪽 순서의 세로 본문으로 변환했습니다.'
        : result.value.warnings.includes('CAPTION_AS_PARAGRAPH') ? '사진 캡션을 별도 문단으로 변환했습니다.' : 'Markdown 파일을 만들었습니다.');
    } catch { setError('Markdown 파일을 만들지 못했습니다. 다시 시도해주세요.'); }
  }

  return <section className="demo-workspace" aria-label="문서 작업 공간">
    <div className="demo-actions"><div className="demo-status" role="status"><span className="demo-status-dot" />{status}</div><div className="demo-action-buttons">
      <button type="button" onClick={newDocument}>새 문서</button>
      <button type="button" onClick={downloadMarkdown} disabled={!initial}>Markdown 내보내기</button>
      <button type="button" onClick={showPreview} disabled={!initial || previewBusy}>{previewBusy ? '불러오는 중…' : '서버 미리보기'}</button>
      <button className="demo-save" type="button" onClick={save} disabled={!initial}>저장 <span aria-hidden="true">↗</span></button>
    </div></div>
    {error && <div className="demo-error" role="alert">{error}</div>}
    {exportMessage && <p role="status" className="demo-export-message">{exportMessage}</p>}
    <div className="demo-paper">
      <div className="demo-paper-meta"><span>YOUR STORY</span><span>01</span></div>
      {initial ? <CosmosEditor key={documentId} ref={ref} initialDocument={initial} uploadImage={demoUpload}
        onChange={(_document, info) => { setStatus(info.pendingUploadCount ? `사진 ${info.pendingUploadCount}개 업로드 중` : info.failedUploadCount ? '사진 업로드를 확인해주세요' : '저장하지 않은 변경 사항'); setPreview(null); }}
        onError={failure => setError(failure.message)} />
        : !error && <p className="demo-loading">문서를 준비하고 있어요…</p>}
      <div className="demo-paper-hint">가볍게 시작하세요. <kbd>#</kbd> 제목 <span>·</span> <kbd>-</kbd> 목록</div>
      <p className="demo-upload-note">사진 업로드는 샘플 이미지로 시연합니다. 선택한 원본 파일은 서버에 저장되지 않습니다.</p>
    </div>
    {preview !== null && <section className="demo-preview" aria-label="읽기 미리보기"><div className="demo-preview-label">읽기 미리보기 <span>서버에서 렌더링한 문서</span></div><div dangerouslySetInnerHTML={{ __html: preview }} /></section>}
  </section>;
}
