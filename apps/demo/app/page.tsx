import { EditorDemo } from './EditorDemo';

export default function Page() {
  return <main className="demo-shell">
    <header className="demo-header"><a className="demo-brand" href="/">✳ <span>COSMOSLOG <span className="demo-divider">/</span> EDITOR</span></a><span className="demo-version">LOCAL DEMO · 0.1</span></header>
    <div className="demo-intro"><p className="demo-eyebrow">A LITTLE SPACE FOR YOUR THOUGHTS</p><h1>생각을 한 페이지로.</h1><p>문장을 쓰고, 사진을 놓고, 나만의 이야기를 완성하세요.</p></div>
    <EditorDemo />
    <footer className="demo-footer"><span>나의 속도로, 나의 문장으로.</span><a href="/read">읽기 화면 보기 ↗</a></footer>
  </main>;
}
