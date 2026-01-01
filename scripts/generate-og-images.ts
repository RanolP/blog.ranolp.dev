import fs from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getPublishedPosts } from '../src/services/posts/repository.server.ts';
import { extractTitleFromContent } from '../src/services/posts/types.ts';

const WIDTH = 1200;
const HEIGHT = 630;

async function loadFont(): Promise<ArrayBuffer> {
  // Use Pretendard font from CDN
  const fontUrl =
    'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf';
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(`Failed to load font: ${response.status}`);
  }
  return response.arrayBuffer();
}

interface OgImageOptions {
  title: string;
  isIndex?: boolean;
}

function createOgImageElement({
  title,
  isIndex = false,
}: OgImageOptions): React.ReactElement {
  const fontSize = isIndex
    ? 72
    : Math.min(64, Math.max(36, Math.floor(1800 / title.length)));

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background:
          'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '60px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              width: '100%',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize,
                    fontWeight: 700,
                    color: '#ffffff',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    maxWidth: '100%',
                    wordBreak: 'break-word',
                  },
                  children: title,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              width: '100%',
              marginTop: '40px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 32,
                    fontWeight: 500,
                    color: '#a0aec0',
                  },
                  children: 'blog.ranolp.dev',
                },
              },
            ],
          },
        },
      ],
    },
  } as React.ReactElement;
}

async function generateOgImage(
  options: OgImageOptions,
  fontData: ArrayBuffer,
): Promise<Buffer> {
  const svg = await satori(createOgImageElement(options), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      {
        name: 'Inter',
        data: fontData,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: fontData,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: WIDTH,
    },
  });

  return resvg.render().asPng();
}

async function main() {
  console.log('Loading font...');
  const fontData = await loadFont();

  const outputDir = path.join(process.cwd(), 'public', 'og');
  await fs.mkdir(outputDir, { recursive: true });

  // Generate index OG image
  console.log('Generating index OG image...');
  const indexImage = await generateOgImage(
    { title: 'Blog - RanolP', isIndex: true },
    fontData,
  );
  await fs.writeFile(path.join(outputDir, 'index.png'), indexImage);
  console.log('  -> public/og/index.png');

  // Create post subdirectory
  const postOutputDir = path.join(outputDir, 'post');
  await fs.mkdir(postOutputDir, { recursive: true });

  // Generate OG images for all posts
  console.log('Generating post OG images...');
  const posts = await getPublishedPosts();

  for (const post of posts) {
    const title = extractTitleFromContent(post.content) || 'Untitled';
    const image = await generateOgImage({ title }, fontData);
    const filename = `${post.slug}.png`;
    await fs.writeFile(path.join(postOutputDir, filename), image);
    console.log(`  -> public/og/post/${filename}`);
  }

  console.log(`\nGenerated ${posts.length + 1} OG images`);
}

main().catch(console.error);
