import { nanoid } from 'nanoid';
import { Icon } from '@iconify/react';
import { Link } from 'react-router';
import { getPostsForListing } from '~/services/posts/repository.server';
import {
  extractTitleFromContent,
  formatTimestampAsDate,
  type Post,
} from '~/services/posts/types';

export async function loader(): Promise<Post[]> {
  return await getPostsForListing();
}

export function meta({}: {
  params: Record<string, string | undefined>;
  data: Post[];
}) {
  return [
    { title: 'Blog - RanolP' },
    {
      name: 'description',
      content:
        'Blog by RanolP - A collection of thoughts, tutorials, and insights',
    },
  ];
}

export default function Home({ loaderData: posts }: { loaderData: Post[] }) {
  const newPostId = nanoid(10);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Blog
        </h1>
        {import.meta.env.DEV && (
          <Link
            to={`/edit/${newPostId}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon icon="lucide:plus" className="w-4 h-4" />
            New Post
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No posts yet.</p>
          {import.meta.env.DEV && (
            <Link
              to={`/edit/${newPostId}`}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create your first post
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => {
            const title = extractTitleFromContent(post.content);
            const dateTimestamp =
              post.metadata.publishedAt ?? post.metadata.lastModifiedAt;
            const dateString = formatTimestampAsDate(dateTimestamp);

            return (
              <article
                key={post.id}
                className="group border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow"
              >
                <Link to={`/post/${post.slug}`} className="block">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {title || 'Untitled'}
                      </h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <time dateTime={dateString}>{dateString}</time>
                        {post.metadata.publishedAt === null && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon
                      icon="lucide:arrow-right"
                      className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0"
                    />
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
