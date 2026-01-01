import Placeholder from '@tiptap/extension-placeholder';

/**
 * Placeholder extension configured to only show on h1 headings
 */
export const TiptapPlaceholder = Placeholder.configure({
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
});
