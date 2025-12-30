'use server';

import { Form, useNavigation, redirect, Link } from 'react-router';
import { getPostById, writePost } from '~/services/posts/repository.server';
import { extractTitleFromContent, type Post } from '~/services/posts/types';
import type { JSONContent } from '~/features/tiptap';
import { EditorClient } from './editor';
import type { Route } from './+types/page';

export async function loader({ params }: Route.LoaderArgs): Promise<Post> {
  const { id } = params;
  if (id.endsWith('.map.json')) {
    throw new Response('Not found', { status: 404 });
  }
  let post = await getPostById(id);

  if (!post) {
    // Create new post with h1 heading as first element
    const now = new Date().toISOString();
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

  const existingPost = await getPostById(id);
  if (!existingPost) {
    throw new Response('Post not found', { status: 404 });
  }

  const now = new Date().toISOString();
  const updatedPost: Post = {
    ...existingPost,
    content,
    metadata: {
      ...existingPost.metadata,
      lastModifiedAt: now,
    },
  };

  await writePost(updatedPost);
  return redirect(`/edit/${id}`);
}

export function meta({ data }: Route.MetaArgs) {
  const title = extractTitleFromContent(data.content);
  return [{ title: title ? `Edit ${title} - RanolP` : 'Edit Post - RanolP' }];
}

export default async function EditPost({
  loaderData: post,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Edit Post</h1>
      </div>

      <Form method="post" className="space-y-6">
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-4 min-h-[400px]">
          <EditorClient initialContent={post.content} postId={post.id} />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </Form>
    </div>
  );
}
