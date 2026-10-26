import { renderDocumentToHtml } from '@cosmoslog/editor/renderer';
import { sampleDocument } from '../../lib/sampleDocument';

export default function ReadPage() {
  const result = renderDocumentToHtml(sampleDocument);
  return <main className="demo-read"><a className="demo-read-back" href="/">← 편집기로 돌아가기</a>
    <p className="demo-eyebrow">A PAGE FROM COSMOSLOG</p>
    {result.ok ? <article dangerouslySetInnerHTML={{ __html: result.value }} /> : <p role="alert">{result.error.message}</p>}
  </main>;
}
