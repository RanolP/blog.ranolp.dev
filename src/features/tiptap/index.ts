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
export {
  defaultExtensions,
  ssrExtensions,
  defaultEditorOptions,
} from './config';

// Extensions
export { PostDocument } from './extensions/document';
export { HeadingWithoutMarkdown } from './extensions/heading';
export { TiptapLink } from './extensions/link';
export { TiptapPlaceholder } from './extensions/placeholder';
export {
  TiptapMention,
  createMentionExtensionForSSR,
  MentionList,
  type MentionItem,
} from './extensions/mention';
export {
  TwitterEmbed,
  createTwitterEmbedExtensionForSSR,
  TweetClient,
} from './extensions/twitter-embed';
export {
  Gallery,
  createGalleryExtensionForSSR,
  GalleryClient,
  type GalleryDisplayMode,
} from './extensions/gallery';
export {
  SlashCommand,
  SlashCommandMenu,
  type SlashCommandItem,
} from './extensions/slash-command';

// Re-export commonly used types
export type { JSONContent } from '@tiptap/core';
export type { Editor } from '@tiptap/core';
export type { Extensions } from '@tiptap/react';
