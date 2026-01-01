import type { Config } from '@react-router/dev/config';
import { getPublishedPosts } from './src/services/posts/repository.server';

export default {
  appDirectory: 'src/app',
  ssr: true,
  async prerender() {
    const posts = await getPublishedPosts();
    const postPaths = posts.map((post) => `/post/${post.slug}`);
    return ['/', ...postPaths];
  },
} satisfies Config;
