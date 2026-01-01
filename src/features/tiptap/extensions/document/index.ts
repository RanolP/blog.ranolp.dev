import Document from '@tiptap/extension-document';

/**
 * Custom document extension that enforces a specific content structure:
 * - First child must be a heading
 * - Followed by zero or more block-level nodes
 *
 * The schema enforces the structure. No plugins are used to avoid interfering
 * with the editing experience.
 *
 * Reference: https://tiptap.dev/docs/examples/advanced/forced-content-structure
 */
export const PostDocument = Document.extend({
  content: 'heading block*',
});
