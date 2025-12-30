import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import Mention from '@tiptap/extension-mention';
import { textblockTypeInputRule } from '@tiptap/core';
import type { Extensions } from '@tiptap/react';
import type { MentionOptions } from '@tiptap/extension-mention';
import { ReactRenderer, ReactNodeViewRenderer } from '@tiptap/react';
import { debounce } from 'es-toolkit/function';
import { PostDocument } from './document';
import { MentionList, type MentionItem } from './mention-menu';
import { MentionNode } from './mention-node';

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
 * Twitter search function
 */
async function searchTwitterUsers(username: string): Promise<MentionItem[]> {
  console.log('Calling API for username:', username);
  const response = await fetch(
    `/api/mentions/twitter?q=${encodeURIComponent(username)}`,
  );
  console.log('API response status:', response.status);
  if (response.ok) {
    const data = await response.json();
    console.log('API response data:', data);
    return (data.users || []).map(
      (user: {
        id: string;
        label: string;
        username?: string;
        displayName?: string;
        avatar?: string;
        verified?: boolean;
      }) => ({
        id: user.id,
        label: user.label,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        verified: user.verified || false,
      }),
    );
  }
  console.error('API request failed:', response.status, response.statusText);
  return [];
}

/**
 * Debounced Twitter search wrapper
 * Uses es-toolkit's debounce to delay API calls until user stops typing
 * Wraps the debounced function to return a promise
 */
const pendingPromises = new Map<
  string,
  Array<{
    resolve: (value: MentionItem[]) => void;
    reject: (error: unknown) => void;
  }>
>();

const debouncedSearch = debounce(async (username: string) => {
  const promises = pendingPromises.get(username);
  if (!promises || promises.length === 0) {
    return;
  }

  try {
    const result = await searchTwitterUsers(username);
    promises.forEach(({ resolve }) => resolve(result));
  } catch (error) {
    promises.forEach(({ reject }) => reject(error));
  } finally {
    pendingPromises.delete(username);
  }
}, 300);

const debouncedTwitterSearch = (username: string): Promise<MentionItem[]> => {
  return new Promise((resolve, reject) => {
    const promises = pendingPromises.get(username) || [];
    promises.push({ resolve, reject });
    pendingPromises.set(username, promises);
    debouncedSearch(username);
  });
};

/**
 * Custom suggestion items function for mentions
 * Supports Twitter (@tw:username) and GitHub (@gh:username) mentions
 *
 * Workflow:
 * 1. User types "@" - shows hint options: @tw: and @gh:
 * 2. User types "tw" or "gh" - shows the corresponding hint
 * 3. User types "tw:" or "gh:" - menu stays open, user continues typing
 * 4. User types "tw:username" - fetches Twitter users from API endpoint (throttled) and shows suggestions
 * 5. User types "gh:username" - shows GitHub mention (client-side for now)
 */
const getMentionSuggestionItems: MentionOptions['suggestion']['items'] =
  async ({ query }) => {
    const lowerQuery = query.toLowerCase();

    // Parse the query to detect prefix (tw: or gh:) with username
    const twitterMatch = query.match(/^tw:(.+)$/i);
    const githubMatch = query.match(/^gh:(.+)$/i);

    // If user has typed "tw:username", fetch from API endpoint (throttled)
    if (twitterMatch) {
      const username = twitterMatch[1].trim();
      if (username.length > 0) {
        try {
          console.log('Fetching Twitter user:', username);
          // Use debounced search to limit API calls
          const users = await debouncedTwitterSearch(username);
          console.log('Twitter users fetched:', users);
          // Return users with all their data (avatar, displayName, etc.)
          return users as MentionItem[];
        } catch (error) {
          console.error('Error fetching Twitter users:', error);
          // Fallback to showing the typed username as-is
          return [
            {
              id: `tw:${username}`,
              label: `@tw:${username}`,
              username: username,
            },
          ];
        }
      }
      // If just "tw:" without username, return empty to keep menu open
      return [];
    }

    // If user has typed "gh:username", return the GitHub mention
    if (githubMatch) {
      const username = githubMatch[1].trim();
      if (username.length > 0) {
        return [
          {
            id: `gh:${username}`,
            label: `@gh:${username}`,
          },
        ];
      }
      // If just "gh:" without username, return empty to keep menu open
      return [];
    }

    // If query is empty, show hint options (these will insert the prefix and keep typing)
    if (query.length === 0) {
      return [
        {
          id: 'tw:',
          label: '@tw:',
        },
        {
          id: 'gh:',
          label: '@gh:',
        },
      ];
    }

    // If user is typing "tw" or "t", show Twitter hint
    if (lowerQuery === 't' || lowerQuery.startsWith('tw')) {
      return [
        {
          id: 'tw:',
          label: '@tw:',
        },
      ];
    }

    // If user is typing "gh" or "g", show GitHub hint
    if (lowerQuery === 'g' || lowerQuery.startsWith('gh')) {
      return [
        {
          id: 'gh:',
          label: '@gh:',
        },
      ];
    }

    // Default: show both hint options
    return [
      {
        id: 'tw:',
        label: '@tw:',
      },
      {
        id: 'gh:',
        label: '@gh:',
      },
    ];
  };

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
  Mention.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        username: {
          default: null,
        },
        displayName: {
          default: null,
        },
        avatar: {
          default: null,
        },
        verified: {
          default: false,
        },
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer(MentionNode);
    },
  }).configure({
    HTMLAttributes: {
      class: 'mention',
    },
    renderHTML({ node }) {
      const attrs = node.attrs as MentionItem;
      const platform = attrs.id?.startsWith('tw:')
        ? 'twitter'
        : attrs.id?.startsWith('gh:')
        ? 'github'
        : null;

      const displayName =
        attrs.displayName || attrs.username || attrs.label || attrs.id;

      // For SSR, we'll render a simpler HTML structure
      // The React NodeView will handle the full rendering in the editor
      const content: any[] = [
        'span',
        { class: 'mention-content' },
        attrs.avatar
          ? [
              'img',
              {
                class: 'mention-avatar',
                src: attrs.avatar,
                alt: displayName,
              },
            ]
          : [
              'span',
              {
                class: 'mention-avatar mention-avatar-placeholder',
              },
              (
                attrs.displayName?.[0] ||
                attrs.username?.[0] ||
                '@'
              ).toUpperCase(),
            ],
        [
          'span',
          { class: 'mention-text' },
          ['span', { class: 'mention-name' }, displayName],
        ],
      ];

      if (platform) {
        content.push([
          'span',
          {
            class: 'mention-platform',
            'data-icon':
              platform === 'twitter'
                ? 'mdi:twitter'
                : platform === 'github'
                ? 'mdi:github'
                : '',
          },
        ]);
      }

      return [
        'span',
        {
          class: `mention mention-${platform || 'default'}`,
          'data-mention-id': attrs.id,
        },
        content,
      ] as const;
    },
    suggestion: {
      char: '@',
      items: getMentionSuggestionItems,
      allowSpaces: false,
      render: () => {
        let component: ReactRenderer | null = null;

        return {
          onStart: (props: {
            items: MentionItem[];
            command: (item: MentionItem) => void;
            editor: any;
            range: { from: number; to: number };
            clientRect?: (() => DOMRect | null) | null;
          }) => {
            component = new ReactRenderer(MentionList, {
              props: {
                items: props.items,
                command: props.command,
                editor: props.editor,
              },
              editor: props.editor,
            });

            if (!props.clientRect) {
              return;
            }

            const element = component.element as HTMLElement;
            element.style.position = 'absolute';
            document.body.appendChild(element);
          },

          onUpdate: (props: {
            items: MentionItem[];
            command: (item: MentionItem) => void;
            editor: any;
            range: { from: number; to: number };
            clientRect?: (() => DOMRect | null) | null;
          }) => {
            component?.updateProps({
              items: props.items,
              command: props.command,
              editor: props.editor,
            });
          },

          onKeyDown: (props: { event: KeyboardEvent }) => {
            if (props.event.key === 'Escape') {
              component?.destroy();
              return true;
            }

            const ref = component?.ref as
              | { onKeyDown: (props: { event: KeyboardEvent }) => boolean }
              | undefined;
            return ref?.onKeyDown(props) ?? false;
          },

          onExit: () => {
            if (component) {
              const element = component.element as HTMLElement;
              element.remove();
              component.destroy();
              component = null;
            }
          },
        };
      },
      command: ({ editor, range, props }) => {
        console.log('Mention command called with props:', props);
        // If the id is just a prefix (ends with ':'), insert as text
        if (props.id && props.id.endsWith(':')) {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(`@${props.id}`)
            .run();
        } else {
          // Otherwise, insert as mention node with all attributes
          const mentionItem = props as MentionItem;
          // Always include all available attributes
          const mentionAttrs: any = {
            id: mentionItem.id,
            label: mentionItem.label || mentionItem.id,
          };

          // Include optional fields if they exist
          if (mentionItem.username) {
            mentionAttrs.username = mentionItem.username;
          }
          if (mentionItem.displayName) {
            mentionAttrs.displayName = mentionItem.displayName;
          }
          if (mentionItem.avatar) {
            mentionAttrs.avatar = mentionItem.avatar;
          }
          if (mentionItem.verified !== undefined) {
            mentionAttrs.verified = mentionItem.verified;
          }

          console.log('Inserting mention with attrs:', mentionAttrs);

          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'mention',
              attrs: mentionAttrs,
            })
            .run();
        }
      },
    },
    renderLabel({ node }) {
      const attrs = node.attrs as MentionItem;
      // Use displayName or username if available, otherwise fall back to id
      if (attrs.displayName) {
        return `@${attrs.displayName}`;
      }
      if (attrs.username) {
        return `@${attrs.username}`;
      }
      // Remove the 'tw:' or 'gh:' prefix from id for display
      const id = attrs.id.replace(/^(tw|gh):/, '');
      return `@${id}`;
    },
  }),
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
