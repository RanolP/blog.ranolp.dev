import { load } from 'cheerio';

/**
 * API route for fetching website metadata (favicon, title) from a URL
 * GET /api/link-metadata?url=https://example.com
 */
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl || targetUrl.trim().length === 0) {
    return Response.json({ error: 'No URL provided' }, { status: 400 });
  }

  try {
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return Response.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the HTML content
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      // Set a timeout
      signal: AbortSignal.timeout(10000), // 10 seconds
    });

    if (!response.ok) {
      return Response.json(
        { error: 'Failed to fetch URL' },
        { status: response.status },
      );
    }

    const html = await response.text();

    // Parse HTML with cheerio
    const $ = load(html);

    // Extract title - try multiple methods
    let title: string | null = null;

    // Method 1: Get title from <title> tag
    const titleElement = $('title').first();
    if (titleElement.length > 0) {
      title = titleElement.text().trim();
    }

    // Method 2: Try Open Graph title if regular title not found
    if (!title) {
      const ogTitle = $('meta[property="og:title"]').attr('content');
      if (ogTitle) {
        title = ogTitle.trim();
      }
    }

    // Method 3: Try meta title tag
    if (!title) {
      const metaTitle = $('meta[name="title"]').attr('content');
      if (metaTitle) {
        title = metaTitle.trim();
      }
    }

    // Extract favicon - try multiple methods
    let favicon: string | null = null;

    // Method 1: Check for <link rel="icon"> or <link rel="shortcut icon">
    const iconLink = $('link[rel="icon"], link[rel="shortcut icon"]').first();
    if (iconLink.length > 0) {
      const faviconUrl = iconLink.attr('href');
      if (faviconUrl) {
        try {
          favicon = new URL(faviconUrl, parsedUrl.origin).href;
        } catch {
          favicon = faviconUrl;
        }
      }
    }

    // Method 2: Check for apple-touch-icon
    if (!favicon) {
      const appleIcon = $('link[rel="apple-touch-icon"]').first();
      if (appleIcon.length > 0) {
        const appleIconUrl = appleIcon.attr('href');
        if (appleIconUrl) {
          try {
            favicon = new URL(appleIconUrl, parsedUrl.origin).href;
          } catch {
            favicon = appleIconUrl;
          }
        }
      }
    }

    // Method 3: Fallback to default favicon location
    if (!favicon) {
      try {
        favicon = new URL('/favicon.ico', parsedUrl.origin).href;
        // Verify it exists
        const faviconCheck = await fetch(favicon, { method: 'HEAD' });
        if (!faviconCheck.ok) {
          favicon = null;
        }
      } catch {
        favicon = null;
      }
    }

    // Use Google's favicon service as ultimate fallback
    if (!favicon) {
      favicon = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`;
    }

    return Response.json({
      url: targetUrl,
      title: title || parsedUrl.hostname,
      favicon,
      hostname: parsedUrl.hostname,
    });
  } catch (error) {
    console.error('Error fetching link metadata:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return Response.json({ error: 'Request timeout' }, { status: 408 });
    }
    return Response.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 },
    );
  }
}
