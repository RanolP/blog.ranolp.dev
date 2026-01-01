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
import type { MentionItem } from './types';

interface MentionListProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
  editor: any;
}

export const MentionList = forwardRef<
  {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
  },
  MentionListProps
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
            240,
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

  return (
    <div
      ref={refs.setFloating}
      className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-[280px]"
      style={floatingStyles}
    >
      <Command
        label="Mention Menu"
        shouldFilter={false}
        loop={false}
        value={items[selectedIndex]?.id}
      >
        <Command.List ref={listRef} className="max-h-60 overflow-y-auto p-1">
          <Command.Empty className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            No results found.
          </Command.Empty>
          {items.map((item, index) => (
            <Command.Item
              key={item.id}
              value={item.id}
              data-selected-index={index}
              onSelect={() => selectItem(index)}
              className={`px-3 py-2 text-sm rounded cursor-pointer transition-colors flex items-center gap-3 ${
                index === selectedIndex
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.displayName || item.username || ''}
                  className="w-8 h-8 rounded-full shrink-0"
                  onError={(e) => {
                    // Fallback to a placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                  {item.displayName?.[0]?.toUpperCase() ||
                    item.username?.[0]?.toUpperCase() ||
                    '@'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium truncate">
                    {item.displayName || item.username || item.label}
                  </span>
                  {item.verified && (
                    <svg
                      className="w-4 h-4 text-blue-500 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                {item.username && item.displayName && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{item.username}
                  </div>
                )}
              </div>
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
});

MentionList.displayName = 'MentionList';
