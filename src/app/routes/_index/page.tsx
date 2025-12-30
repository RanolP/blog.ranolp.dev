import { nanoid } from 'nanoid';
import { listPosts, getPostById } from '~/services/posts/repository.server';
import { extractTitleFromContent, type Post } from '~/services/posts/types';

export async function loader(): Promise<Post[]> {
  try {
    // Get all post IDs
    const postIds = await listPosts();

    // Fetch all posts and filter for published ones
    const posts = await Promise.all(postIds.map((id) => getPostById(id)));

    // Filter out null values and unpublished posts, then sort by published date (newest first)
    return posts
      .filter(
        (post): post is Post => post !== null && post.status === 'published',
      )
      .sort((a, b) => {
        const aDate = a.metadata.publishedAt
          ? new Date(a.metadata.publishedAt).getTime()
          : 0;
        const bDate = b.metadata.publishedAt
          ? new Date(b.metadata.publishedAt).getTime()
          : 0;
        return bDate - aDate;
      });
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
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
            <h2>
              <a href={`/posts/${post.slug}`}>{title || 'Untitled'}</a>
            </h2>
          </article>
        );
      })}
    </div>
  );
}
