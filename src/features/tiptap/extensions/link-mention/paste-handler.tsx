'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from '@floating-ui/react';
import { posToDOMRect } from '@tiptap/react';

interface LinkPasteSuggestionProps {
  editor: Editor;
  url: string;
  onInsert: (
    url: string,
    metadata: {
      title?: string;
      favicon?: string;
      hostname?: string;
    },
  ) => void;
  onCancel: () => void;
}

export function LinkPasteSuggestion({
  editor,
  url,
  onInsert,
  onCancel,
}: LinkPasteSuggestionProps) {
  const [metadata, setMetadata] = useState<{
    title?: string;
    favicon?: string;
    hostname?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
      offset(8),
      flip({
        fallbackPlacements: [
          'bottom-start',
          'top-start',
          'bottom-end',
          'top-end',
        ],
      }),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    // Fetch metadata for the URL
    const fetchMetadata = async () => {
      try {
        const response = await fetch(
          `/api/link-metadata?url=${encodeURIComponent(url)}`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }
        const data = await response.json();
        setMetadata({
          title: data.title,
          favicon: data.favicon,
          hostname: data.hostname,
        });
        setError(false);
      } catch (err) {
        console.error('Error fetching link metadata:', err);
        setError(true);
        // Use fallback metadata
        try {
          const urlObj = new URL(url);
          setMetadata({
            title: urlObj.hostname,
            hostname: urlObj.hostname,
            favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`,
          });
        } catch {
          setMetadata({
            title: url,
            hostname: url,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [url]);

  useEffect(() => {
    // Handle click outside to cancel
    const handleClickOutside = (e: MouseEvent) => {
      if (
        refs.floating.current &&
        !refs.floating.current.contains(e.target as Node)
      ) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel, refs.floating]);

  const handleInsert = useCallback(() => {
    if (metadata) {
      onInsert(url, metadata);
    }
  }, [metadata, url, onInsert]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Auto-focus the Mention button when component mounts
  const mentionButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!loading && mentionButtonRef.current) {
      mentionButtonRef.current.focus();
    }
  }, [loading]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && !loading && metadata) {
        // Enter key triggers the focused button
        if (document.activeElement === mentionButtonRef.current) {
          e.preventDefault();
          handleInsert();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, metadata, handleCancel, handleInsert]);

  if (loading) {
    return (
      <div
        ref={refs.setFloating}
        className="link-paste-suggestion"
        style={floatingStyles}
      >
        <div className="link-paste-suggestion-content">
          <div className="link-paste-suggestion-loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={refs.setFloating}
      className="link-paste-suggestion"
      style={floatingStyles}
    >
      <div className="link-paste-suggestion-content">
        <div className="link-paste-suggestion-header">
          <span className="link-paste-suggestion-title">
            Would you mention the page?
          </span>
        </div>
        {metadata && (
          <div className="link-paste-suggestion-preview">
            {metadata.favicon && (
              <img
                src={metadata.favicon}
                alt=""
                className="link-paste-suggestion-favicon"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="link-paste-suggestion-preview-title">
              {metadata.title || metadata.hostname || url}
            </span>
          </div>
        )}
        <div className="link-paste-suggestion-actions">
          <button
            ref={mentionButtonRef}
            type="button"
            className="link-paste-suggestion-button link-paste-suggestion-button-primary"
            onClick={handleInsert}
          >
            Mention
          </button>
          <button
            type="button"
            className="link-paste-suggestion-button link-paste-suggestion-button-secondary"
            onClick={handleCancel}
          >
            Just paste
          </button>
        </div>
      </div>
    </div>
  );
}
