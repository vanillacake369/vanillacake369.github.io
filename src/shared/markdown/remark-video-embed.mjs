/**
 * remark-video-embed
 *
 * Converts image syntax with video URLs into responsive iframe embeds:
 *   ![alt](https://www.youtube.com/watch?v=ID)  → YouTube iframe
 *   ![alt](https://youtu.be/ID)                 → YouTube iframe
 *   ![alt](https://vimeo.com/ID)                → Vimeo iframe
 *
 * Regular links [text](video-url) are left untouched.
 * Regular images ![alt](image.png) are left untouched.
 *
 * Works as a rehype plugin so raw HTML is not stripped by remark-rehype.
 */
import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

const YOUTUBE_RE =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_RE = /vimeo\.com\/(\d+)/;

export default function rehypeVideoEmbed() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || index == null) return;

      // Target: <img> inside a <p>
      if (node.tagName !== 'img') return;

      const url = node.properties?.src || '';
      const alt = node.properties?.alt || '';

      let iframeSrc = null;

      const ytMatch = url.match(YOUTUBE_RE);
      if (ytMatch) {
        iframeSrc = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
      }

      const vimeoMatch = !ytMatch ? url.match(VIMEO_RE) : null;
      if (vimeoMatch) {
        iframeSrc = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      }

      if (!iframeSrc) return;

      const iframe = h('iframe', {
        src: iframeSrc,
        title: alt || 'Video',
        loading: 'lazy',
        allow:
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowfullscreen: true,
        style:
          'display:block;width:100%;aspect-ratio:16/9;border:none;',
      });

      const figureChildren = [iframe];

      if (alt) {
        figureChildren.push(
          h(
            'figcaption',
            {
              style:
                'font-size:0.85rem;color:var(--color-text-secondary,#596155);padding:0.5rem 0.75rem;font-style:italic;border-top:1px solid var(--color-border,#d8d3c7);',
            },
            alt,
          ),
        );
      }

      const figure = h(
        'figure',
        {
          class: 'video-embed',
          style:
            'margin:1.5em 0;border:1px solid var(--color-border,#d8d3c7);border-radius:8px;overflow:hidden;',
        },
        figureChildren,
      );

      // If the <img> is the sole child of a <p>, replace the <p>
      if (parent.tagName === 'p' && parent.children.length === 1) {
        const grandparent = findParent(tree, parent);
        if (grandparent) {
          const pIndex = grandparent.children.indexOf(parent);
          if (pIndex !== -1) {
            grandparent.children.splice(pIndex, 1, figure);
            return;
          }
        }
      }

      // Otherwise just replace the <img>
      parent.children.splice(index, 1, figure);
    });
  };
}

function findParent(tree, target) {
  let result = null;
  visit(tree, (node) => {
    if (node.children && node.children.includes(target)) {
      result = node;
    }
  });
  return result;
}
