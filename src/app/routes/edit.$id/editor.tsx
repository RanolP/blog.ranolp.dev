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
    editor?.commands.setContent(initialContent, false);
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
