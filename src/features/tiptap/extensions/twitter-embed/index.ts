import { Node, nodePasteRule, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TwitterEmbedNodeView } from './node-view';

// Re-export client component for SSR usage
export { TweetClient } from './client';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    twitter: {
      /**
       * Insert a Twitter embed with the given URL
       */
      setTwitterEmbed: (options: { url: string }) => ReturnType;
    };
  }
}

/**
 * Twitter Embed Extension for TipTap
 * Based on: https://gist.github.com/ajayvignesh01/02b8e8f8bbec660d8644bfcea9ba3621
 * Uses react-tweet library for rendering tweets
 */
export const TwitterEmbed = Node.create({
  name: 'twitter',

  group: 'block',

  atom: true,

  draggable: true,

  addPasteRules() {
    const twitterUrl = /^https:\/\/(twitter\.com|x\.com)\/.*\/status\/.*/g;

    return [
      nodePasteRule({
        find: twitterUrl,
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
        tag: 'twitter',
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
    return ['twitter', mergeAttributes(HTMLAttributes)];
  },

  addCommands() {
    return {
      setTwitterEmbed:
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
    return ReactNodeViewRenderer(TwitterEmbedNodeView);
  },
});

/**
 * Create Twitter embed extension for SSR
 * Since we use React Server Components, we don't need renderHTML for Twitter embeds
 * They're extracted and rendered directly as React components in TiptapSSR
 */
export function createTwitterEmbedExtensionForSSR() {
  return TwitterEmbed.extend({
    addNodeView() {
      return null;
    },
    // No renderHTML needed - Twitter embeds are handled by React Server Components
  });
}
