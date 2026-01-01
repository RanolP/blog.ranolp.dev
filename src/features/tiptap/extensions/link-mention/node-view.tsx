import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from '@floating-ui/react';
import type { LinkMentionAttributes } from './index';

export function LinkMentionNodeView({
  node,
  updateAttributes,
}: NodeViewProps) {
  const attrs = node.attrs as LinkMentionAttributes;
  const { url, title, customTitle, favicon, hostname } = attrs;

  const defaultTitle = title || hostname || url;
  const displayTitle = customTitle || defaultTitle;
  const [faviconError, setFaviconError] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const { refs, floatingStyles } = useFloating({
    elements: {
      reference: linkRef.current,
    },
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip({
        fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
      }),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
    open: showPopup,
  });

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.stopPropagation();

      // If modifier key is pressed, allow normal link behavior
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }

      // Otherwise, prevent navigation and show popup
      e.preventDefault();
      setInputValue(customTitle || '');
      setShowPopup(true);
    },
    [customTitle],
  );

  const handleSave = useCallback(() => {
    const trimmedValue = inputValue.trim();
    updateAttributes({
      customTitle: trimmedValue || null,
    });
    setShowPopup(false);
  }, [inputValue, updateAttributes]);

  const handleCancel = useCallback(() => {
    setShowPopup(false);
    setInputValue('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel],
  );

  // Focus input when popup opens
  useEffect(() => {
    if (showPopup && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showPopup]);

  // Close popup on click outside
  useEffect(() => {
    if (!showPopup) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        refs.floating.current &&
        !refs.floating.current.contains(e.target as Node) &&
        linkRef.current &&
        !linkRef.current.contains(e.target as Node)
      ) {
        handleCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup, refs.floating, handleCancel]);

  return (
    <NodeViewWrapper
      as="span"
      className="link-mention"
      data-url={url}
      data-title={title}
      data-custom-title={customTitle}
      data-favicon={favicon}
      data-hostname={hostname}
    >
      <a
        ref={linkRef}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="link-mention-link"
        onClick={handleClick}
      >
        <span className="link-mention-content">
          {favicon && !faviconError ? (
            <img
              className="link-mention-favicon"
              src={favicon}
              alt=""
              onError={() => {
                setFaviconError(true);
              }}
            />
          ) : (
            <span className="link-mention-favicon link-mention-favicon-placeholder">
              {hostname?.[0]?.toUpperCase() || '🌐'}
            </span>
          )}
          <span className="link-mention-title">{displayTitle}</span>
        </span>
      </a>
      {showPopup && (
        <div
          ref={refs.setFloating}
          className="link-mention-popup"
          style={floatingStyles}
        >
          <div className="link-mention-popup-content">
            <input
              ref={inputRef}
              type="text"
              className="link-mention-popup-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={defaultTitle}
            />
            <div className="link-mention-popup-actions">
              <button
                type="button"
                className="link-mention-popup-button link-mention-popup-button-primary"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                type="button"
                className="link-mention-popup-button link-mention-popup-button-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
