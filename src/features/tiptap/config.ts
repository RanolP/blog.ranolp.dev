import StarterKit from '@tiptap/starter-kit';
import type { Extensions } from '@tiptap/react';

// Import extensions from modular structure
import { PostDocument } from './extensions/document';
import { HeadingWithoutMarkdown } from './extensions/heading';
import { TiptapLink } from './extensions/link';
import { TiptapPlaceholder } from './extensions/placeholder';
import {
  TiptapMention,
  createMentionExtensionForSSR,
} from './extensions/mention';
import {
  TwitterEmbed,
  createTwitterEmbedExtensionForSSR,
} from './extensions/twitter-embed';

/**
 * Default Tiptap extensions configuration for client-side editor
 * Can be extended with additional extensions as needed
 *
 * Enforces content structure: heading (h1) as first child, followed by block content
 * Reference: https://tiptap.dev/docs/examples/advanced/forced-content-structure
 */
export const defaultExtensions: Extensions = [
  PostDocument,
  StarterKit.configure({
    document: false,
    trailingNode: {
      node: 'paragraph',
    },
    heading: false,
    link: false, // Disable default link extension, we'll configure it separately
  }),
  TiptapLink,
  HeadingWithoutMarkdown,
  TiptapMention,
  TiptapPlaceholder,
  TwitterEmbed,
];

/**
 * SSR-specific extensions (without NodeView, so renderHTML is used)
 */
export const ssrExtensions: Extensions = [
  PostDocument,
  StarterKit.configure({
    document: false,
    trailingNode: {
      node: 'paragraph',
    },
    heading: false,
    link: false, // Disable default link extension, we'll configure it separately
  }),
  TiptapLink,
  HeadingWithoutMarkdown,
  createMentionExtensionForSSR(),
  createTwitterEmbedExtensionForSSR(),
  TiptapPlaceholder,
];

/**
 * Default editor configuration options
 */
export const defaultEditorOptions = {
  extensions: defaultExtensions,
  immediatelyRender: false, // Required for SSR compatibility
  enableContentCheck: true, // Enable schema enforcement
} as const;
