import { Editor } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import { defaultExtensions } from './config';
import type { JSONContent } from '@tiptap/core';

export interface TiptapSSRProps {
  /**
   * Content to render (HTML string or JSON)
   */
  content: string | JSONContent;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Additional extensions to use for rendering
   */
  extensions?: typeof defaultExtensions;
}

/**
 * Server-side rendering component for Tiptap content
 * Renders Tiptap content as HTML without requiring client-side JavaScript
 * Use this component when you need to display Tiptap content in SSR contexts
 */
export function TiptapSSR({
  content,
  className,
  extensions = defaultExtensions,
}: TiptapSSRProps) {
  let html: string;

  if (typeof content === 'string') {
    // If content is already HTML, use it directly
    html = content;
  } else {
    // If content is JSON, convert it to HTML
    html = generateHTML(content, extensions);
  }

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/**
 * Utility function to create an Editor instance for server-side operations
 * This can be used for server-side content processing, validation, etc.
 */
export function createSSREditor(content?: JSONContent | string) {
  return new Editor({
    element: undefined, // Opt-in to SSR mode
    extensions: defaultExtensions,
    content,
    enableContentCheck: true, // Enable schema enforcement
  });
}

/**
 * Utility function to convert Tiptap JSON content to HTML string
 * Useful for server-side rendering or API responses
 */
export function tiptapToHTML(
  content: JSONContent | string,
  extensions = defaultExtensions,
): string {
  if (typeof content === 'string') {
    return content;
  }
  return generateHTML(content, extensions);
}

/**
 * Utility function to parse HTML string to Tiptap JSON content
 * Useful for converting HTML content to Tiptap format
 */
export function htmlToTiptap(html: string): JSONContent {
  const editor = createSSREditor(html);
  const json = editor.getJSON();
  editor.destroy();
  return json;
}
