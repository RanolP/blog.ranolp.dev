import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { LinkMentionNodeView } from './node-view';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    linkMention: {
      /**
       * Insert a link mention with the given URL, title, and favicon
       */
      setLinkMention: (options: {
        url: string;
        title?: string;
        favicon?: string;
        hostname?: string;
      }) => ReturnType;
    };
  }
}

export interface LinkMentionAttributes {
  url: string;
  title?: string;
  customTitle?: string;
  favicon?: string;
  hostname?: string;
}

/**
 * Link Mention Extension for TipTap
 * Creates a Notion-like link mention that displays website favicon and title
 */
export const LinkMention = Node.create({
  name: 'linkMention',

  group: 'inline',

  inline: true,

  atom: true,

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
      title: {
        default: null,
        parseHTML: (element) => {
          return element.getAttribute('data-title');
        },
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {};
          }
          return {
            'data-title': attributes.title,
          };
        },
      },
      customTitle: {
        default: null,
        parseHTML: (element) => {
          return element.getAttribute('data-custom-title');
        },
        renderHTML: (attributes) => {
          if (!attributes.customTitle) {
            return {};
          }
          return {
            'data-custom-title': attributes.customTitle,
          };
        },
      },
      favicon: {
        default: null,
        parseHTML: (element) => {
          return element.getAttribute('data-favicon');
        },
        renderHTML: (attributes) => {
          if (!attributes.favicon) {
            return {};
          }
          return {
            'data-favicon': attributes.favicon,
          };
        },
      },
      hostname: {
        default: null,
        parseHTML: (element) => {
          return element.getAttribute('data-hostname');
        },
        renderHTML: (attributes) => {
          if (!attributes.hostname) {
            return {};
          }
          return {
            'data-hostname': attributes.hostname,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="link-mention"]',
        getAttrs: (element) => {
          if (typeof element === 'string') {
            return false;
          }
          const url = element.getAttribute('data-url');
          return url
            ? {
                url,
                title: element.getAttribute('data-title') || undefined,
                customTitle: element.getAttribute('data-custom-title') || undefined,
                favicon: element.getAttribute('data-favicon') || undefined,
                hostname: element.getAttribute('data-hostname') || undefined,
              }
            : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'link-mention',
      }),
    ];
  },

  addCommands() {
    return {
      setLinkMention:
        (options: {
          url: string;
          title?: string;
          favicon?: string;
          hostname?: string;
        }) =>
        ({ commands }) => {
          if (!options.url) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              url: options.url,
              title: options.title,
              favicon: options.favicon,
              hostname: options.hostname,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkMentionNodeView);
  },
});

/**
 * Create Link Mention extension for SSR
 * Renders full HTML structure matching the client NodeView to prevent hydration mismatch
 */
export function createLinkMentionExtensionForSSR() {
  return LinkMention.extend({
    addNodeView() {
      return null;
    },
    renderHTML({ node, HTMLAttributes }) {
      const attrs = node.attrs as LinkMentionAttributes;
      const { url, title, customTitle, favicon, hostname } = attrs;
      const displayTitle = customTitle || title || hostname || url;

      // Build content structure matching React NodeView exactly
      const content: any[] = ['span', { class: 'link-mention-content' }];

      // Favicon or placeholder (matching React component behavior)
      if (favicon) {
        content.push([
          'img',
          {
            class: 'link-mention-favicon',
            src: favicon,
            alt: '',
          },
        ]);
      } else {
        content.push([
          'span',
          { class: 'link-mention-favicon link-mention-favicon-placeholder' },
          hostname?.[0]?.toUpperCase() || '🌐',
        ]);
      }

      // Title
      content.push(['span', { class: 'link-mention-title' }, displayTitle]);

      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          'data-type': 'link-mention',
          class: 'link-mention',
        }),
        [
          'a',
          {
            href: url,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'link-mention-link',
          },
          content,
        ],
      ];
    },
  });
}
