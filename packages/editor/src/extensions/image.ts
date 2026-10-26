import Image from '@tiptap/extension-image';

export const ImageNode = Image.extend({
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      caption: { default: '' }
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-type="cosmos-image"]', getAttrs: element => ({
      src: element.querySelector('img')?.getAttribute('src'),
      alt: element.querySelector('img')?.getAttribute('alt') ?? '',
      caption: element.querySelector('figcaption')?.textContent ?? ''
    }) }];
  },
  renderHTML({ node }) {
    return ['figure', { class: 'cosmos-image', 'data-type': 'cosmos-image' },
      ['img', { src: node.attrs.src, alt: node.attrs.alt, loading: 'lazy' }],
      ['figcaption', {}, node.attrs.caption]];
  },
  addInputRules() { return []; }
}).configure({ allowBase64: false, resize: false });
