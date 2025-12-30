'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useFetcher } from 'react-router';
import { defaultEditorOptions } from '~/features/tiptap/config';
import type { JSONContent } from '~/features/tiptap';
import { useSaveState } from './edit-wrapper';

interface EditorClientProps {
  initialContent: JSONContent;
  postId: string;
}

export function EditorClient({ initialContent, postId }: EditorClientProps) {
  const [formContent, setFormContent] = useState<JSONContent>(initialContent);
  const fetcher = useFetcher();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setIsSaving, setLastSavedAt } = useSaveState();

  const editor = useEditor({
    ...defaultEditorOptions,
    content: initialContent,
    editable: true,
  });

  useEffect(() => {
    setFormContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (!editor) return;

    // Save current cursor position before updating content
    const { from, to } = editor.state.selection;

    // Only update content if it's actually different to avoid unnecessary resets
    const currentContent = editor.getJSON();
    const contentChanged =
      JSON.stringify(currentContent) !== JSON.stringify(initialContent);

    if (contentChanged) {
      // Set content without emitting update events
      editor.commands.setContent(initialContent, false);

      // Restore cursor position after content is set
      // Use setTimeout with 0 to ensure it runs after the content update
      setTimeout(() => {
        try {
          // Try to restore the exact position
          const docSize = editor.state.doc.content.size;
          const safeFrom = Math.min(from, docSize);
          const safeTo = Math.min(to, docSize);

          // Only restore if the position is still valid
          if (
            safeFrom >= 0 &&
            safeTo >= 0 &&
            safeFrom <= docSize &&
            safeTo <= docSize
          ) {
            editor.commands.setTextSelection({
              from: safeFrom,
              to: safeTo,
            });
          } else {
            // If position is invalid, just focus at the end
            editor.commands.focus('end');
          }
        } catch (error) {
          // If position restoration fails, just focus the editor at the end
          editor.commands.focus('end');
        }
      }, 0);
    }
  }, [editor, initialContent]);

  // Auto-save functionality
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const newContent = editor.getJSON();
      setFormContent(newContent);

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce auto-save (save after 1 second of inactivity)
      saveTimeoutRef.current = setTimeout(() => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append('content', JSON.stringify(newContent));

        fetcher.submit(formData, {
          method: 'post',
          action: `/edit/${postId}`,
        });
      }, 1000);
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, postId, fetcher]);

  // Update saving state based on fetcher
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setIsSaving(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setIsSaving(false);
      setLastSavedAt(new Date());
    }
  }, [fetcher.state, fetcher.data, setIsSaving, setLastSavedAt]);

  return (
    <EditorContent
      editor={editor}
      className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none dark:prose-invert focus:outline-none min-h-[300px]"
    />
  );
}
