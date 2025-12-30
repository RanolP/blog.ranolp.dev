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

          // Ensure first child is a heading with level 1
          if (firstChild && firstChild.type.name === 'heading') {
            const currentLevel = firstChild.attrs.level;
            if (currentLevel !== 1) {
              // Transform the first heading to h1
              const pos = 1; // Position after the document node
              tr.setNodeMarkup(pos, undefined, {
                ...firstChild.attrs,
                level: 1,
              });
              return tr;
            }
          } else if (firstChild && firstChild.type.name !== 'heading') {
            // If first child is not a heading, we need to insert one
            // This shouldn't happen due to schema, but handle it just in case
            const heading = newState.schema.nodes.heading.create(
              { level: 1 },
              [],
            );
            tr.insert(1, heading);
            return tr;
          }

          return null;
        },
      }),
    ];
  },
});
