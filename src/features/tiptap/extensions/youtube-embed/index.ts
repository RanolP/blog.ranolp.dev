import { Node, nodePasteRule, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { YouTubeEmbedNodeView } from './node-view';

// Re-export client component for client-side usage
export { YouTubeClient } from './client';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      /**
       * Insert a YouTube embed with the given URL
       */
      setYouTubeEmbed: (options: { url: string }) => ReturnType;
    };
  }
}

/**
 * YouTube Embed Extension for TipTap
 * Similar to Twitter embed but uses YouTube iframe for rendering
 * 
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 */
export const YouTubeEmbed = Node.create({
  name: 'youtube',

  group: 'block',

  atom: true,

  draggable: true,

  addPasteRules() {
    const youtubeUrl =
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/g;

    return [
      nodePasteRule({
        find: youtubeUrl,
        type: this.type,
        getAttributes: (match) => {
          return { url: match.input };
        },
      }),
    ];
  },

  addAttributes() {
    return {
      url: {
        default: null,
        parseHTML: (element) => {
          return element.getAttribute('data-url');
        },
        renderHTML: (attributes) => {
          if (!attributes.url) {
            return {};
          }
          return {
            'data-url': attributes.url,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'youtube',
        getAttrs: (element) => {
          if (typeof element === 'string') {
            return false;
          }
          const url = element.getAttribute('data-url');
          return url ? { url } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['youtube', mergeAttributes(HTMLAttributes)];
  },

  addCommands() {
    return {
      setYouTubeEmbed:
        (options: { url: string }) =>
        ({ commands }) => {
          if (!options.url) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              url: options.url,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeEmbedNodeView);
  },
});

/**
 * Create YouTube embed extension for SSR
 * Since we use React Server Components, we don't need renderHTML for YouTube embeds
 * They're extracted and rendered directly as React components in TiptapSSR
 */
export function createYouTubeEmbedExtensionForSSR() {
  return YouTubeEmbed.extend({
    addNodeView() {
      return null;
    },
    // No renderHTML needed - YouTube embeds are handled by React Server Components
  });
}

