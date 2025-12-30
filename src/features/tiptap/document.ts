import Document from '@tiptap/extension-document';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Custom document extension that enforces a specific content structure:
 * - First child must be an h1 heading (level 1)
 * - Followed by zero or more block-level nodes
 *
 * This ensures all posts start with an h1 heading as the title,
 * followed by the post content (paragraphs, lists, etc.)
 *
 * Reference: https://tiptap.dev/docs/examples/advanced/forced-content-structure
 */
export const PostDocument = Document.extend({
  content: 'heading block*',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('enforceH1Structure'),
        appendTransaction: (transactions, oldState, newState) => {
          // Only process if the document actually changed
          if (!transactions.some((tr) => tr.docChanged)) {
            return null;
          }

          const { tr } = newState;
          const firstChild = newState.doc.firstChild;

          // If document is empty, insert an empty h1
          if (!firstChild) {
            const heading = newState.schema.nodes.heading.create(
              { level: 1 },
              [],
            );
            tr.insert(1, heading);
            return tr;
          }

          // Ensure first child is a heading with level 1
          if (firstChild.type.name === 'heading') {
            const currentLevel = firstChild.attrs.level;
            if (currentLevel !== 1) {
              // Position 1 is right after the document node, where the first child starts
              tr.setNodeMarkup(1, undefined, {
                ...firstChild.attrs,
                level: 1,
              });
              return tr;
            }
          } else {
            // If first child is not a heading, replace it with h1
            // This shouldn't happen due to schema, but handle it just in case
            const heading = newState.schema.nodes.heading.create(
              { level: 1 },
              firstChild.content,
            );
            tr.replaceWith(1, 1 + firstChild.nodeSize, heading);
            return tr;
          }

          return null;
        },
      }),
    ];
  },
});
