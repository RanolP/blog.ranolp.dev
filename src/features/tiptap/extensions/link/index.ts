import Link from '@tiptap/extension-link';

/**
 * Link extension configured with custom class for styling
 */
export const TiptapLink = Link.configure({
  HTMLAttributes: {
    class: 'tiptap-link',
  },
  openOnClick: false,
});
