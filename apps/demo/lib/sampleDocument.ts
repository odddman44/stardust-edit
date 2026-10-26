import type { CosmosDocument } from '@cosmoslog/editor';

export const sampleDocument: CosmosDocument = { version: 1, content: { type: 'doc', content: [
  { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '서울의 한 페이지' }] },
  { type: 'paragraph', content: [{ type: 'text', text: '낯익은 골목에서도 새로운 이야기를 발견합니다. 오늘의 풍경, 오래 기억하고 싶은 맛, 문득 떠오른 생각을 여기에 담아보세요.' }] },
  { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '천천히 걷는 오후' }] },
  { type: 'paragraph', content: [{ type: 'text', text: '계획 없이 걷다가 작은 카페에 들어갔어요. 창가 자리에 앉으니, 골목의 시간이 조금 느리게 흘렀습니다.' }] },
  { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: '좋은 기록은 특별한 하루보다, 평범한 하루를 바라보는 마음에서 시작됩니다.' }] }] },
  { type: 'paragraph', content: [{ type: 'text', text: '이 문장을 지우고 나의 이야기로 시작해도 좋아요.' }] }
] } };
