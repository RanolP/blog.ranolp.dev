'use server';

import { getPostById, writePost } from '~/services/posts/repository.server';
import { extractTitleFromContent, type Post } from '~/services/posts/types';
import { SaveStateProvider } from './edit-wrapper';
import { EditorClient } from './editor';
import { EditHeader } from './header';
import type { Route } from './+types/page';

export async function loader({ params }: Route.LoaderArgs): Promise<Post> {
  const { id } = params;
  if (id.endsWith('.map.json')) {
    throw new Response('Not found', { status: 404 });
  }
  let post = await getPostById(id);

  if (!post) {
    // Create new post with h1 heading as first element
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    post = {
      id,
      content: {
        type: 'doc',
        content: [{ type: 'heading', attrs: { level: 1 }, content: [] }],
      },
      slug: id,
      metadata: {
        publishedAt: null,
        lastModifiedAt: now,
      },
    };
    // Save the empty post
    await writePost(post);
  }

  return post;
}

export async function action({ params, request }: Route.ActionArgs) {
  const { id } = params;
  const formData = await request.formData();

  const existingPost = await getPostById(id);
  if (!existingPost) {
    throw new Response('Post not found', { status: 404 });
  }

  const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
  let updatedPost: Post = { ...existingPost };

  // Handle publish action
  if (formData.get('publish') === 'true') {
    updatedPost = {
      ...existingPost,
      metadata: {
        ...existingPost.metadata,
        publishedAt: now,
        lastModifiedAt: now,
      },
    };
  } else if (formData.get('unpublish') === 'true') {
    // Handle unpublish action
    updatedPost = {
      ...existingPost,
      metadata: {
        ...existingPost.metadata,
        publishedAt: null,
        lastModifiedAt: now,
      },
    };
  } else {
    // Handle content save
    const contentJson = formData.get('content') as string;

    let content: Post['content'];
    try {
      if (!contentJson) throw new Error('Content is required');
      content = JSON.parse(contentJson);
    } catch (error) {
      content = {
        type: 'doc',
        content: [{ type: 'heading', attrs: { level: 1 }, content: [] }],
      };
    }

    updatedPost = {
      ...existingPost,
      content,
      metadata: {
        ...existingPost.metadata,
        lastModifiedAt: now,
      },
    };
  }

  await writePost(updatedPost);
  return { success: true };
}

export function meta({ data }: Route.MetaArgs) {
  const title = extractTitleFromContent(data.content);
  return [{ title: title ? `Edit ${title} - RanolP` : 'Edit Post - RanolP' }];
}

export default async function EditPost({
  loaderData: post,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <SaveStateProvider>
        <EditHeader
          isDraft={post.metadata.publishedAt === null}
          postId={post.id}
        />
        <div className="space-y-6">
          <EditorClient initialContent={post.content} postId={post.id} />
        </div>
      </SaveStateProvider>
    </div>
  );
}
