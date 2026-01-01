import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { GalleryNodeView } from './node-view';

// Re-export client component for SSR usage
export { GalleryClient } from './client';

export type GalleryDisplayMode = 'carousel' | 'grid' | 'list';

export interface GridSpan {
  col: number;
  row: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gallery: {
      /**
       * Insert a gallery with the given images and options
       */
      setGallery: (options: {
        images: string[];
        displayMode?: GalleryDisplayMode;
        columns?: number;
        gridSpans?: GridSpan[];
      }) => ReturnType;
    };
  }
}

/**
 * Gallery Extension for TipTap
 * Supports multiple display modes: carousel, masonry, grid, and list
 */
export const Gallery = Node.create({
  name: 'gallery',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element) => {
          const imagesAttr = element.getAttribute('data-images');
          if (!imagesAttr) return [];
          try {
            return JSON.parse(imagesAttr);
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => {
          if (!attributes.images || !Array.isArray(attributes.images)) {
            return {};
          }
          return {
            'data-images': JSON.stringify(attributes.images),
          };
        },
      },
      displayMode: {
        default: 'grid',
        parseHTML: (element) => {
          return (
            (element.getAttribute('data-display-mode') as GalleryDisplayMode) ||
            'grid'
          );
        },
        renderHTML: (attributes) => {
          return {
            'data-display-mode': attributes.displayMode || 'grid',
          };
        },
      },
      columns: {
        default: 3,
        parseHTML: (element) => {
          const cols = element.getAttribute('data-columns');
          return cols ? parseInt(cols, 10) : 3;
        },
        renderHTML: (attributes) => {
          return {
            'data-columns': String(attributes.columns || 3),
          };
        },
      },
      gridSpans: {
        default: [],
        parseHTML: (element) => {
          const spansAttr = element.getAttribute('data-grid-spans');
          if (!spansAttr) return [];
          try {
            return JSON.parse(spansAttr);
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => {
          if (!attributes.gridSpans || !Array.isArray(attributes.gridSpans)) {
            return {};
          }
          return {
            'data-grid-spans': JSON.stringify(attributes.gridSpans),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'gallery',
        getAttrs: (element) => {
          if (typeof element === 'string') {
            return false;
          }
          const imagesAttr = element.getAttribute('data-images');
          if (!imagesAttr) return false;
          try {
            const images = JSON.parse(imagesAttr);
            if (!Array.isArray(images) || images.length === 0) {
              return false;
            }
            let gridSpans: GridSpan[] = [];
            const spansAttr = element.getAttribute('data-grid-spans');
            if (spansAttr) {
              try {
                gridSpans = JSON.parse(spansAttr);
              } catch {
                gridSpans = [];
              }
            }
            return {
              images,
              displayMode:
                (element.getAttribute(
                  'data-display-mode',
                ) as GalleryDisplayMode) || 'grid',
              columns: parseInt(
                element.getAttribute('data-columns') || '3',
                10,
              ),
              gridSpans,
            };
          } catch {
            return false;
          }
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['gallery', mergeAttributes(HTMLAttributes)];
  },

  addCommands() {
    return {
      setGallery:
        (options: {
          images: string[];
          displayMode?: GalleryDisplayMode;
          columns?: number;
          gridSpans?: GridSpan[];
        }) =>
        ({ commands }) => {
          if (!options.images || !Array.isArray(options.images)) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              images: options.images,
              displayMode: options.displayMode || 'grid',
              columns: options.columns || 3,
              gridSpans: options.gridSpans || [],
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryNodeView);
  },
});

/**
 * Create gallery extension for SSR
 * Since we use React Server Components, we don't need renderHTML for galleries
 * They're extracted and rendered directly as React components in TiptapSSR
 */
export function createGalleryExtensionForSSR() {
  return Gallery.extend({
    addNodeView() {
      return null;
    },
    // No renderHTML needed - galleries are handled by React Server Components
  });
}
