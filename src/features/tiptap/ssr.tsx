import { Editor } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import { defaultExtensions, ssrExtensions } from './config';
import type { JSONContent } from '@tiptap/core';
import { TweetClient } from './tweet-client';

export interface TiptapSSRProps {
  content: string | JSONContent;
  className?: string;
  extensions?: typeof defaultExtensions;
}

export function TiptapSSR({
  content,
  className,
  extensions = ssrExtensions,
}: TiptapSSRProps) {
  if (typeof content === 'string') {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  if (!content.content) {
    return <div className={className} />;
  }

  // Render as React Server Component - extract Twitter embeds and render as Tweet components
  const parts: React.ReactNode[] = [];
  let htmlNodes: JSONContent[] = [];

  const flushHtml = () => {
    if (htmlNodes.length > 0) {
      const html = generateHTML(
        { type: 'doc', content: htmlNodes },
        extensions,
      );
      parts.push(
        <div key={parts.length} dangerouslySetInnerHTML={{ __html: html }} />,
      );
      htmlNodes = [];
    }
  };

  // Process nodes and render tweets
  for (const node of content.content) {
    if (node.type === 'twitter') {
      flushHtml();
      const url = node.attrs?.url as string;
      if (url) {
        const tweetId = /\/status\/(\d+)/g.exec(url)?.[1];
        if (tweetId) {
          parts.push(<TweetClient key={parts.length} tweetId={tweetId} />);
        }
      }
    } else {
      htmlNodes.push(node);
    }
  }

  flushHtml();

  return <div className={className}>{parts}</div>;
}

/**
 * Utility function to create an Editor instance for server-side operations
 * This can be used for server-side content processing, validation, etc.
 */
export function createSSREditor(content?: JSONContent | string) {
  return new Editor({
    element: undefined, // Opt-in to SSR mode
    extensions: ssrExtensions, // Use SSR extensions (without NodeView)
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
  extensions = ssrExtensions, // Use SSR extensions by default
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
