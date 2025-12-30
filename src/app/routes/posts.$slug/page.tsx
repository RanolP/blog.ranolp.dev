'use server';

import { Link } from 'react-router';
import { getPostBySlug } from '~/services/posts/repository.server';
import { extractTitleFromContent, type Post } from '~/services/posts/types';
import { TiptapSSR } from '~/features/tiptap';
import type { Route } from './+types/page';

export async function loader({ params }: Route.LoaderArgs): Promise<Post> {
  const { slug } = params;
  const post = await getPostBySlug(slug);

  if (!post) {
    throw new Response('Post not found', { status: 404 });
  }

  // In production, only show published posts (publishedAt is not null)
  if (!import.meta.env.DEV && post.metadata.publishedAt === null) {
    throw new Response('Post not found', { status: 404 });
  }

  return post;
}

export function meta({ data }: Route.MetaArgs) {
  const title = extractTitleFromContent(data.content);
  return [{ title: title ? `${title} - RanolP` : 'Post - RanolP' }];
}

export default function PostPage({ loaderData: post }: Route.ComponentProps) {
  const title = extractTitleFromContent(post.content);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          ← Back
        </Link>
        {post.metadata.publishedAt === null && (
          <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
            Draft
          </span>
        )}
        {import.meta.env.DEV && (
          <Link
            to={`/edit/${post.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit
          </Link>
        )}
      </div>

      <article>
        <TiptapSSR
          content={post.content}
          className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none dark:prose-invert tiptap-content"
        />
      </article>

      {post.metadata.publishedAt && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Published: {new Date(post.metadata.publishedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

