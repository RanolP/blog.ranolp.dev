import { useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '@iconify/react';
import { BackButton } from '~/components/BackButton';
import { getPostBySlug } from '~/services/posts/repository.server';
import {
  extractTitleFromContent,
  formatTimestampAsDate,
  type Post,
} from '~/services/posts/types';
import { TiptapSSR, TweetIndexProvider, type TweetIndex } from '~/features/tiptap';
import { fetchTweetsFromContent } from '~/services/tweets/fetcher.server';
import type { JSONContent } from '@tiptap/core';
import type { Route } from './+types/page';

interface LoaderData {
  post: Post;
  tweets: TweetIndex;
}

function extractH1AndRest(content: JSONContent): {
  h1: JSONContent | null;
  rest: JSONContent;
} {
  if (!content.content || content.content.length === 0) {
    return { h1: null, rest: content };
  }

  const firstChild = content.content[0];
  if (firstChild.type === 'heading' && firstChild.attrs?.level === 1) {
    const rest: JSONContent = {
      ...content,
      content: content.content.slice(1),
    };
    return { h1: firstChild, rest };
  }

  return { h1: null, rest: content };
}

export async function loader({ params }: Route.LoaderArgs): Promise<LoaderData> {
  const { slug } = params;
  const post = await getPostBySlug(slug);

  if (!post) {
    throw new Response('Post not found', { status: 404 });
  }

  // In production, only show published posts (publishedAt is not null)
  if (!import.meta.env.DEV && post.metadata.publishedAt === null) {
    throw new Response('Post not found', { status: 404 });
  }

  // Pre-fetch all tweets from the content
  const tweets = await fetchTweetsFromContent(post.content);

  return { post, tweets };
}

export function meta({ data }: Route.MetaArgs) {
  const title = extractTitleFromContent(data.post.content) || 'Untitled';
  const pageTitle = `${title} - RanolP`;
  const ogImageUrl = `https://blog.ranolp.dev/og/post/${data.post.slug}.png`;

  return [
    { title: pageTitle },
    { property: 'og:title', content: title },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: `https://blog.ranolp.dev/post/${data.post.slug}` },
    { property: 'og:image', content: ogImageUrl },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:site_name', content: 'Blog - RanolP' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:image', content: ogImageUrl },
  ];
}

export default function PostPage({ loaderData }: Route.ComponentProps) {
  const { post, tweets } = loaderData;
  const { h1, rest } = extractH1AndRest(post.content);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/post/${post.slug}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <TweetIndexProvider tweets={tweets}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          {post.metadata.publishedAt === null && (
            <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              Draft
            </span>
          )}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Copy post link"
          >
            <Icon
              icon={copied ? 'lucide:check' : 'lucide:link'}
              className="w-4 h-4"
            />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          {import.meta.env.DEV && (
            <Link
              to={`/edit/${post.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icon icon="lucide:edit" className="w-4 h-4" />
              Edit
            </Link>
          )}
        </div>

        <article>
          {h1 && (
            <>
              <TiptapSSR
                content={{ type: 'doc', content: [h1] }}
                className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none dark:prose-invert tiptap-content"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-6">
                {post.metadata.publishedAt ? (
                  <>
                    {formatTimestampAsDate(post.metadata.publishedAt)}
                    {formatTimestampAsDate(post.metadata.publishedAt) !==
                      formatTimestampAsDate(post.metadata.lastModifiedAt) && (
                      <>
                        {' ⋅ '}
                        <span className="font-medium">last edit</span>{' '}
                        {formatTimestampAsDate(post.metadata.lastModifiedAt)}
                      </>
                    )}
                  </>
                ) : (
                  formatTimestampAsDate(post.metadata.lastModifiedAt)
                )}
              </div>
            </>
          )}
          {rest.content && rest.content.length > 0 && (
            <TiptapSSR
              content={rest}
              className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none dark:prose-invert tiptap-content"
            />
          )}
        </article>
      </div>
    </TweetIndexProvider>
  );
}
