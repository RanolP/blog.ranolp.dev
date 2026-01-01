import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import { Suggestion } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import { SlashCommandMenu } from './menu';
import type { SlashCommandItem } from './types';

// Re-export types
export type { SlashCommandItem } from './types';
export { SlashCommandMenu } from './menu';

/**
 * Get slash command items based on query
 */
const getSlashCommandItems = async ({
  query,
  editor,
}: {
  query: string;
  editor: any;
}): Promise<SlashCommandItem[]> => {
  const lowerQuery = query.toLowerCase();

  const allCommands: SlashCommandItem[] = [
    // Media
    {
      id: 'gallery',
      title: 'Gallery',
      description: 'Insert an image gallery',
      icon: '🖼️',
      group: 'media',
      command: (editor) => {
        editor.commands.setGallery({
          images: [],
          displayMode: 'grid',
          columns: 3,
        });
      },
    },
    {
      id: 'twitter',
      title: 'Twitter Embed',
      description: 'Embed a Twitter tweet',
      icon: '🐦',
      group: 'media',
      command: (editor) => {
        const url = prompt('Enter Twitter/X URL:');
        if (url) {
          editor.commands.setTwitterEmbed({ url });
        }
      },
    },
    // Content
    {
      id: 'heading1',
      title: 'Heading 1',
      description: 'Big section heading',
      icon: 'H1',
      group: 'content',
      command: (editor) => {
        editor.commands.toggleHeading({ level: 1 });
      },
    },
    {
      id: 'heading2',
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: 'H2',
      group: 'content',
      command: (editor) => {
        editor.commands.toggleHeading({ level: 2 });
      },
    },
    {
      id: 'heading3',
      title: 'Heading 3',
      description: 'Small section heading',
      icon: 'H3',
      group: 'content',
      command: (editor) => {
        editor.commands.toggleHeading({ level: 3 });
      },
    },
    {
      id: 'bullet-list',
      title: 'Bullet List',
      description: 'Create a bulleted list',
      icon: '•',
      group: 'content',
      command: (editor) => {
        editor.commands.toggleBulletList();
      },
    },
    {
      id: 'ordered-list',
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: '1.',
      group: 'content',
      command: (editor) => {
        editor.commands.toggleOrderedList();
      },
    },
    {
      id: 'blockquote',
      title: 'Quote',
      description: 'Create a quote block',
      icon: '❝',
      group: 'content',
      command: (editor) => {
        editor.commands.toggleBlockquote();
      },
    },
    {
      id: 'code-block',
      title: 'Code Block',
      description: 'Create a code block',
      icon: '</>',
      group: 'content',
      command: (editor) => {
        editor.commands.toggleCodeBlock();
      },
    },
    {
      id: 'horizontal-rule',
      title: 'Divider',
      description: 'Insert a horizontal divider',
      icon: '─',
      group: 'content',
      command: (editor) => {
        editor.commands.setHorizontalRule();
      },
    },
  ];

  // Filter commands based on query
  if (!query) {
    return allCommands;
  }

  return allCommands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.description?.toLowerCase().includes(lowerQuery) ||
      cmd.id.toLowerCase().includes(lowerQuery),
  );
};

/**
 * Slash Command Extension for TipTap
 * Allows users to type "/" to open a command menu
 */
export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        pluginKey: new PluginKey('slashCommand'),
        allowSpaces: false,
        startOfLine: false,
        items: getSlashCommandItems,
        render: () => {
          let component: ReactRenderer | null = null;

          return {
            onStart: (props: {
              items: SlashCommandItem[];
              command: (item: SlashCommandItem) => void;
              editor: any;
              range: { from: number; to: number };
              clientRect?: (() => DOMRect | null) | null;
            }) => {
              component = new ReactRenderer(SlashCommandMenu, {
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
              items: SlashCommandItem[];
              command: (item: SlashCommandItem) => void;
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
        command: ({ editor, range, props }: any) => {
          const item = props as SlashCommandItem;
          item.command(editor);
          editor.chain().focus().deleteRange(range).run();
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
