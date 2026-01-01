
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import type { Route } from './+types/page';

const PUBLIC_IMAGES_DIR = join(process.cwd(), 'public', 'images');

export async function action({ request }: Route.ActionArgs) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || !(file instanceof File)) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return Response.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Generate hash from file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    const originalExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // Ensure images directory exists
    await mkdir(PUBLIC_IMAGES_DIR, { recursive: true });

    // Process image with Sharp
    const metadata = await sharp(buffer).metadata();

    // Generate AVIF
    let avifPath: string | null = null;
    try {
      const avifBuffer = await sharp(buffer).avif({ quality: 85 }).toBuffer();
      avifPath = join(PUBLIC_IMAGES_DIR, `${hash}.avif`);
      await writeFile(avifPath, avifBuffer);
    } catch (error) {
      console.warn('Failed to encode AVIF:', error);
    }

    // Generate WebP as fallback
    let webpPath: string | null = null;
    try {
      const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      webpPath = join(PUBLIC_IMAGES_DIR, `${hash}.webp`);
      await writeFile(webpPath, webpBuffer);
    } catch (error) {
      console.warn('Failed to encode WebP:', error);
    }

    // Return URLs (prefer AVIF, fallback to WebP)
    const imageUrl = avifPath
      ? `/images/${hash}.avif`
      : webpPath
      ? `/images/${hash}.webp`
      : null;

    if (!imageUrl) {
      return Response.json(
        { error: 'Failed to process image' },
        { status: 500 },
      );
    }

    return Response.json({
      url: imageUrl,
      hash,
      width: metadata.width,
      height: metadata.height,
      formats: {
        avif: avifPath ? `/images/${hash}.avif` : null,
        webp: webpPath ? `/images/${hash}.webp` : null,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
