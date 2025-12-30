import { nanoid } from 'nanoid';
import { getPostsForListing } from '~/services/posts/repository.server';
import { extractTitleFromContent, type Post } from '~/services/posts/types';

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
      content: 'A collection of thoughts, tutorials, and insights from RanolP',
    },
  ];
}

export default function Home({ loaderData: posts }: { loaderData: Post[] }) {
  const newPostId = nanoid(10);

  return (
    <div className="space-y-8">
      {import.meta.env.DEV && (
        <div>
          <a href={`/edit/${newPostId}`}>Create New Post</a>
        </div>
      )}
      {posts.map((post) => {
        const title = extractTitleFromContent(post.content);
        return (
          <article key={post.id}>
            <h2 className="flex items-center gap-2">
              <a href={`/posts/${post.slug}`}>{title || 'Untitled'}</a>
              {post.metadata.publishedAt === null && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  Draft
                </span>
              )}
            </h2>
          </article>
        );
      })}
    </div>
  );
}
