import type { JSONContent } from '@tiptap/core';
import { TweetClient } from './extensions/twitter-embed';
import { YouTubeClient } from './extensions/youtube-embed';
import { GalleryClient } from './extensions/gallery';
import { MentionSSR } from './extensions/mention/ssr';
import { LinkMentionSSR } from './extensions/link-mention/ssr';
import type { MentionItem } from './extensions/mention/types';
import type { LinkMentionAttributes } from './extensions/link-mention';

export interface TiptapSSRProps {
  content: string | JSONContent;
  className?: string;
}

interface Mark {
  type: string;
  attrs?: Record<string, unknown>;
}

/**
 * Render marks (bold, italic, link, etc.) around content
 */
function renderWithMarks(
  content: React.ReactNode,
  marks: Mark[] | undefined,
  key: string,
): React.ReactNode {
  if (!marks || marks.length === 0) {
    return content;
  }

  return marks.reduce((acc: React.ReactNode, mark, index) => {
    const markKey = `${key}-mark-${index}`;
    switch (mark.type) {
      case 'bold':
        return <strong key={markKey}>{acc}</strong>;
      case 'italic':
        return <em key={markKey}>{acc}</em>;
      case 'strike':
        return <s key={markKey}>{acc}</s>;
      case 'code':
        return <code key={markKey}>{acc}</code>;
      case 'underline':
        return <u key={markKey}>{acc}</u>;
      case 'link':
        return (
          <a
            key={markKey}
            href={mark.attrs?.href as string}
            target={mark.attrs?.target as string}
            rel={mark.attrs?.rel as string}
          >
            {acc}
          </a>
        );
      case 'highlight':
        return <mark key={markKey}>{acc}</mark>;
      case 'subscript':
        return <sub key={markKey}>{acc}</sub>;
      case 'superscript':
        return <sup key={markKey}>{acc}</sup>;
      default:
        return acc;
    }
  }, content);
}

/**
 * Render inline content (text nodes, mentions, etc.)
 */
function renderInlineContent(
  nodes: JSONContent[] | undefined,
  keyPrefix: string,
): React.ReactNode {
  if (!nodes) return null;

  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;

    switch (node.type) {
      case 'text':
        return renderWithMarks(node.text || '', node.marks, key);

      case 'mention':
        return <MentionSSR key={key} attrs={node.attrs as MentionItem} />;

      case 'linkMention':
        return (
          <LinkMentionSSR
            key={key}
            attrs={node.attrs as LinkMentionAttributes}
          />
        );

      case 'hardBreak':
        return <br key={key} />;

      default:
        // For unknown inline types, try to render their content
        if (node.content) {
          return (
            <span key={key}>{renderInlineContent(node.content, key)}</span>
          );
        }
        return null;
    }
  });
}

/**
 * Render a single block node to React
 */
function renderNode(node: JSONContent, key: string): React.ReactNode {
  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{renderInlineContent(node.content, key)}</p>;

    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag key={key}>
          {renderInlineContent(node.content, key)}
        </HeadingTag>
      );
    }

    case 'bulletList':
      return (
        <ul key={key}>
          {node.content?.map((item, i) => renderNode(item, `${key}-${i}`))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={key} start={node.attrs?.start as number}>
          {node.content?.map((item, i) => renderNode(item, `${key}-${i}`))}
        </ol>
      );

    case 'listItem':
      return (
        <li key={key}>
          {node.content?.map((item, i) => renderNode(item, `${key}-${i}`))}
        </li>
      );

    case 'blockquote':
      return (
        <blockquote key={key}>
          {node.content?.map((item, i) => renderNode(item, `${key}-${i}`))}
        </blockquote>
      );

    case 'codeBlock': {
      const language = node.attrs?.language as string | undefined;
      return (
        <pre key={key}>
          <code className={language ? `language-${language}` : undefined}>
            {node.content?.map((n) => n.text).join('') || ''}
          </code>
        </pre>
      );
    }

    case 'horizontalRule':
      return <hr key={key} />;

    case 'twitter': {
      const url = node.attrs?.url as string;
      if (url) {
        const tweetId = /\/status\/(\d+)/.exec(url)?.[1];
        if (tweetId) {
          return (
            <div key={key} className="twitter-embed">
              <TweetClient tweetId={tweetId} />
            </div>
          );
        }
      }
      return null;
    }

    case 'youtube': {
      const url = node.attrs?.url as string;
      if (url) {
        return (
          <div key={key} className="youtube-embed">
            <YouTubeClient url={url} />
          </div>
        );
      }
      return null;
    }

    case 'gallery': {
      const images = (node.attrs?.images as string[]) || [];
      const displayMode = (node.attrs?.displayMode as string) || 'grid';
      const columns = (node.attrs?.columns as number) || 3;
      const gridSpans =
        (node.attrs?.gridSpans as { col: number; row: number }[]) || [];
      if (images.length > 0) {
        return (
          <GalleryClient
            key={key}
            images={images}
            displayMode={displayMode as 'grid' | 'carousel'}
            columns={columns}
            gridSpans={gridSpans}
          />
        );
      }
      return null;
    }

    case 'image': {
      const src = node.attrs?.src as string;
      const alt = node.attrs?.alt as string;
      const title = node.attrs?.title as string;
      return <img key={key} src={src} alt={alt || ''} title={title} />;
    }

    case 'table':
      return (
        <table key={key}>
          <tbody>
            {node.content?.map((row, i) => renderNode(row, `${key}-${i}`))}
          </tbody>
        </table>
      );

    case 'tableRow':
      return (
        <tr key={key}>
          {node.content?.map((cell, i) => renderNode(cell, `${key}-${i}`))}
        </tr>
      );

    case 'tableCell':
      return (
        <td
          key={key}
          colSpan={node.attrs?.colspan as number}
          rowSpan={node.attrs?.rowspan as number}
        >
          {node.content?.map((item, i) => renderNode(item, `${key}-${i}`))}
        </td>
      );

    case 'tableHeader':
      return (
        <th
          key={key}
          colSpan={node.attrs?.colspan as number}
          rowSpan={node.attrs?.rowspan as number}
        >
          {node.content?.map((item, i) => renderNode(item, `${key}-${i}`))}
        </th>
      );

    default:
      // For unknown block types with content, render children
      if (node.content) {
        return (
          <div key={key}>
            {node.content.map((item, i) => renderNode(item, `${key}-${i}`))}
          </div>
        );
      }
      return null;
  }
}

/**
 * Server-side TiptapSSR component
 * Uses React components for rendering instead of dangerouslySetInnerHTML
 */
export function TiptapSSR({ content, className }: TiptapSSRProps) {
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

  return (
    <div className={className}>
      {content.content.map((node, index) => renderNode(node, `node-${index}`))}
    </div>
  );
}
