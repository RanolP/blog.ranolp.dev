'use client';

import { Command } from 'cmdk';
import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
} from '@floating-ui/react';
import { posToDOMRect } from '@tiptap/react';
import type { SlashCommandItem } from './types';

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  editor: any;
}

export const SlashCommandMenu = forwardRef<
  {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
  },
  SlashCommandMenuProps
>(({ items, command, editor }, ref) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Create virtual reference element using posToDOMRect
  const virtualElement = {
    getBoundingClientRect: () => {
      if (!editor?.view) {
        return new DOMRect();
      }
      return posToDOMRect(
        editor.view,
        editor.state.selection.from,
        editor.state.selection.to,
      );
    },
  };

  const { refs, floatingStyles } = useFloating({
    elements: {
      reference: virtualElement as any,
    },
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip({
        fallbackPlacements: ['bottom-start', 'top-start'],
      }),
      shift(),
      size({
        apply({
          availableHeight,
          elements,
        }: {
          availableHeight: number;
          elements: { floating: HTMLElement };
        }) {
          elements.floating.style.maxHeight = `${Math.min(
            availableHeight,
            320,
          )}px`;
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && items.length > 0) {
      const selectedElement = listRef.current.querySelector(
        `[data-selected-index="${selectedIndex}"]`,
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex, items.length]);

  if (items.length === 0) {
    return null;
  }

  // Group items by group
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, SlashCommandItem[]>);

  const groupLabels: Record<string, string> = {
    content: 'Content',
    formatting: 'Formatting',
    media: 'Media',
  };

  return (
    <div
      ref={refs.setFloating}
      className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-[280px]"
      style={floatingStyles}
    >
      <Command
        label="Slash Command Menu"
        shouldFilter={false}
        loop={false}
        value={items[selectedIndex]?.id}
      >
        <Command.List ref={listRef} className="max-h-80 overflow-y-auto p-1">
          <Command.Empty className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            No results found.
          </Command.Empty>
          {Object.entries(groupedItems).map(([group, groupItems]) => (
            <div key={group}>
              <Command.Group
                heading={groupLabels[group] || group}
                className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {groupItems.map((item, index) => {
                  const globalIndex = items.indexOf(item);
                  return (
                    <Command.Item
                      key={item.id}
                      value={item.id}
                      data-selected-index={globalIndex}
                      onSelect={() => selectItem(globalIndex)}
                      className={`px-3 py-2 text-sm rounded cursor-pointer transition-colors flex items-center gap-3 ${
                        globalIndex === selectedIndex
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {item.icon ? (
                        <span className="text-lg shrink-0">{item.icon}</span>
                      ) : (
                        <div className="w-5 h-5 rounded bg-gray-300 dark:bg-gray-600 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            </div>
          ))}
        </Command.List>
      </Command>
    </div>
  );
});

SlashCommandMenu.displayName = 'SlashCommandMenu';
