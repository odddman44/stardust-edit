import { isSafeLinkUrl } from '../document/urlPolicy.js';

export function sanitizePastedHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  parsed.querySelectorAll('script,style,img,iframe,object,embed,svg,math,link,meta,base,source,video,audio,form,input,button').forEach(element => element.remove());
  for (const element of parsed.body.querySelectorAll('*')) {
    const href = element.tagName === 'A' ? element.getAttribute('href') : null;
    const start = element.tagName === 'OL' ? element.getAttribute('start') : null;
    for (const attr of Array.from(element.attributes)) element.removeAttribute(attr.name);
    if (href && isSafeLinkUrl(href)) element.setAttribute('href', href);
    if (start && /^\d+$/.test(start) && Number(start) > 0) element.setAttribute('start', start);
  }
  return parsed.body.innerHTML;
}
