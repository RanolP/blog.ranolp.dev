'use client';

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(url: string): string | null {
  if (!url) return null;

  // Match various YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

interface YouTubeClientProps {
  url: string;
}

export function YouTubeClient({ url }: YouTubeClientProps) {
  const videoId = extractVideoId(url);

  if (!videoId) {
    return (
      <div className="youtube-embed youtube-embed-error">
        <p>Invalid YouTube URL</p>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            View on YouTube
          </a>
        )}
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="youtube-embed">
      <div className="youtube-embed-container">
        <iframe
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="youtube-embed-iframe"
        />
      </div>
    </div>
  );
}
