import type { ReactNode } from 'react';
import '@cosmoslog/editor/styles.css';
import './globals.css';

export const metadata = { title: 'Cosmoslog Editor', description: '문장을 쓰고, 나만의 페이지를 만드세요.' };

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
