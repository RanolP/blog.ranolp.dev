import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useFetcher } from 'react-router';
import { defaultEditorOptions } from '~/features/tiptap/config';
import type { JSONContent } from '~/features/tiptap';
import { useSaveState } from './edit-wrapper';
import { LinkPasteSuggestion } from '~/features/tiptap/extensions/link-mention/paste-handler';

interface EditorClientProps {
  initialContent: JSONContent;
  postId: string;
}

export function EditorClient({ initialContent, postId }: EditorClientProps) {
  const [formContent, setFormContent] = useState<JSONContent>(initialContent);
  const fetcher = useFetcher();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setIsSaving, setLastSavedAt } = useSaveState();
  const [linkPasteState, setLinkPasteState] = useState<{
    url: string;
  } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    ...defaultEditorOptions,
    content: initialContent,
  });

  useEffect(() => {
    setFormContent(initialContent);
  }, [initialContent]);

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
  }, [editor, postId, fetcher, setIsSaving]);

  // Update saving state based on fetcher
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setIsSaving(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setIsSaving(false);
      setLastSavedAt(new Date());
    }
  }, [fetcher.state, fetcher.data, setIsSaving, setLastSavedAt]);

  // Handle link paste events
  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;
    const handleLinkPaste = (event: Event) => {
      const customEvent = event as CustomEvent<{
        url: string;
      }>;
      if (customEvent.detail) {
        setLinkPasteState({
          url: customEvent.detail.url,
        });
      }
    };

    editorElement.addEventListener('linkPaste', handleLinkPaste);

    return () => {
      editorElement.removeEventListener('linkPaste', handleLinkPaste);
    };
  }, [editor]);

  const handleLinkInsert = (
    url: string,
    metadata: { title?: string; favicon?: string; hostname?: string },
  ) => {
    if (!editor) return;

    editor.commands.setLinkMention({
      url,
      title: metadata.title,
      favicon: metadata.favicon,
      hostname: metadata.hostname,
    });

    setLinkPasteState(null);
  };

  const handleLinkCancel = () => {
    if (!editor) return;

    // Insert the URL as a regular link instead
    const url = linkPasteState?.url;
    if (url) {
      editor.commands.setLink({ href: url });
    }

    setLinkPasteState(null);
  };

  return (
    <div ref={editorRef} className="relative">
      <EditorContent
        editor={editor}
        onError={(e) => console.error(e)}
        className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none dark:prose-invert tiptap-content focus:outline-none min-h-[300px]"
      />
      {linkPasteState && editor && (
        <LinkPasteSuggestion
          editor={editor}
          url={linkPasteState.url}
          onInsert={handleLinkInsert}
          onCancel={handleLinkCancel}
        />
      )}
    </div>
  );
}
