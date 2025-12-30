'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { defaultEditorOptions } from '~/features/tiptap/config';
import type { JSONContent } from '~/features/tiptap';

interface EditorClientProps {
  initialContent: JSONContent;
  postId: string;
}

export function EditorClient({ initialContent, postId }: EditorClientProps) {
  const [formContent, setFormContent] = useState<JSONContent>(initialContent);

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

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setFormContent(editor.getJSON());
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor]);

  return (
    <>
      <EditorContent
        editor={editor}
        className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none dark:prose-invert focus:outline-none min-h-[300px]"
      />
      <input type="hidden" name="content" value={JSON.stringify(formContent)} />
    </>
  );
}
