import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import { textblockTypeInputRule } from '@tiptap/core';
import type { Extensions } from '@tiptap/react';
import { PostDocument } from './document';

/**
 * Custom heading extension that disables only the "#" markdown shortcut (h1)
 * while keeping "##", "###", etc. (h2-h6) markdown shortcuts working
 */
const HeadingWithoutMarkdown = Heading.extend({
  addInputRules() {
    // Only create input rules for levels 2-6 (exclude level 1)
    // This prevents "# " from creating h1, but allows "## ", "### ", etc.
    const levelsWithoutH1 = this.options.levels.filter((level) => level !== 1);

    return levelsWithoutH1.map((level) => {
      return textblockTypeInputRule({
        // Match exactly the number of hashes for this level
        // Level 2 matches "## ", level 3 matches "### ", etc.
        // This ensures "# " doesn't match anything
        find: new RegExp(`^(#{${level}})\\s$`),
        type: this.type,
        getAttributes: {
          level,
        },
      });
    });
  },
});

/**
 * Default Tiptap extensions configuration
 * Can be extended with additional extensions as needed
 *
 * Enforces content structure: heading (h1) as first child, followed by block content
 * Reference: https://tiptap.dev/docs/examples/advanced/forced-content-structure
 */
export const defaultExtensions: Extensions = [
  PostDocument,
  StarterKit.configure({
    // Disable the default document extension since we're using PostDocument
    document: false,
    // Disable the default heading extension since we're using HeadingWithoutMarkdown
    heading: false,
  }),
  HeadingWithoutMarkdown,
  Placeholder.configure({
    placeholder: ({ node }) => {
      // Only show placeholder on h1 headings (level 1)
      if (node.type.name === 'heading' && node.attrs?.level === 1) {
        return 'Enter a title...';
      }
      // Return empty string for all other nodes to hide placeholder
      return '';
    },
    emptyEditorClass: 'is-editor-empty',
    showOnlyWhenEditable: true,
    showOnlyCurrent: false,
  }),
];

/**
 * Default editor configuration options
 */
export const defaultEditorOptions = {
  extensions: defaultExtensions,
  immediatelyRender: false, // Required for SSR compatibility
  enableContentCheck: true, // Enable schema enforcement
} as const;
