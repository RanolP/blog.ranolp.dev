import Heading from '@tiptap/extension-heading';
import { textblockTypeInputRule } from '@tiptap/core';

/**
 * Custom heading extension that disables only the "#" markdown shortcut (h1)
 * while keeping "##", "###", etc. (h2-h6) markdown shortcuts working
 */
export const HeadingWithoutMarkdown = Heading.extend({
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
