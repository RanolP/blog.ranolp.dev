import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const linkPastePluginKey = new PluginKey('linkPasteHandler');

/**
 * Extension to handle URL paste events and show suggestion
 * This extension intercepts paste events and checks if the pasted content is a URL
 */
export const LinkPasteHandler = Extension.create({
  name: 'linkPasteHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: linkPastePluginKey,
        props: {
          handlePaste(view, event) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) {
              return false;
            }

            // Get pasted text
            const text = clipboardData.getData('text/plain');
            if (!text || text.trim().length === 0) {
              return false;
            }

            // Check if the pasted text is a URL
            let url: string | null = null;
            try {
              // Try to parse as URL
              const urlObj = new URL(text.trim());
              // Only handle http/https URLs
              if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
                url = urlObj.href;
              }
            } catch {
              // Not a valid URL, check if it looks like a URL
              const urlPattern =
                /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
              if (urlPattern.test(text.trim())) {
                // Try to add protocol if missing
                const textWithProtocol = text.trim().startsWith('http')
                  ? text.trim()
                  : `https://${text.trim()}`;
                try {
                  const urlObj = new URL(textWithProtocol);
                  url = urlObj.href;
                } catch {
                  // Invalid URL
                }
              }
            }

            if (!url) {
              return false;
            }

            // Check if this is a Twitter/X URL - if so, let the Twitter paste rule handle it
            // Ignore all x.com URLs and Twitter status URLs
            const twitterUrlPattern = /^https:\/\/(twitter\.com|x\.com)/i;
            if (twitterUrlPattern.test(url)) {
              return false; // Let Twitter paste rule handle it
            }

            // Dispatch custom event to show the suggestion
            // Floating-ui will handle positioning automatically
            const customEvent = new CustomEvent('linkPaste', {
              detail: {
                url,
              },
            });
            view.dom.dispatchEvent(customEvent);

            // Prevent default paste behavior for URLs
            // We'll handle the insertion manually after user confirms
            event.preventDefault();
            return true;
          },
        },
      }),
    ];
  },
});
