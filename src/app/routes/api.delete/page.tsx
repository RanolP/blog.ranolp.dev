'use server';

import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { Route } from './+types/page';

const PUBLIC_IMAGES_DIR = join(process.cwd(), 'public', 'images');

export async function action({ request }: Route.ActionArgs) {
  try {
    const formData = await request.formData();
    const imageUrl = formData.get('url') as string;

    if (!imageUrl) {
      return Response.json({ error: 'No image URL provided' }, { status: 400 });
    }

    // Extract hash from URL (e.g., /images/abc123.avif -> abc123)
    const urlMatch = imageUrl.match(/\/images\/([^.]+)\./);
    if (!urlMatch) {
      return Response.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    const hash = urlMatch[1];

    // Try to delete both AVIF and WebP versions
    const avifPath = join(PUBLIC_IMAGES_DIR, `${hash}.avif`);
    const webpPath = join(PUBLIC_IMAGES_DIR, `${hash}.webp`);

    const deletePromises = [];

    try {
      await unlink(avifPath);
    } catch (error) {
      // File might not exist, ignore
    }

    try {
      await unlink(webpPath);
    } catch (error) {
      // File might not exist, ignore
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return Response.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
