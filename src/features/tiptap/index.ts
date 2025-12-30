/**
 * Tiptap feature module
 * Provides both SSR and client-side editor functionality
 */

// SSR components and utilities
export {
  TiptapSSR,
  createSSREditor,
  tiptapToHTML,
  htmlToTiptap,
  type TiptapSSRProps,
} from './ssr';

// Configuration
export { defaultExtensions, defaultEditorOptions } from './config';

// Custom extensions
export { PostDocument } from './document';

// Re-export commonly used types
export type { JSONContent } from '@tiptap/core';
export type { Editor } from '@tiptap/core';
export type { Extensions } from '@tiptap/react';
