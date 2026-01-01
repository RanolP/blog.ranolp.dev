import type { IconifyIcon } from '@iconify/react';

// Shared icon data for SSR and client to ensure hydration match
// Using inline icon data makes @iconify/react render synchronously

export const twitterIconData: IconifyIcon = {
  body: '<path fill="currentColor" d="M22.46 6c-.77.35-1.6.58-2.46.69c.88-.53 1.56-1.37 1.88-2.38c-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29c0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15c0 1.49.75 2.81 1.91 3.56c-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.2 4.2 0 0 1-1.93.07a4.28 4.28 0 0 0 4 2.98a8.52 8.52 0 0 1-5.33 1.84q-.51 0-1.02-.06C3.44 20.29 5.7 21 8.12 21C16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56c.84-.6 1.56-1.36 2.14-2.23"/>',
  width: 24,
  height: 24,
};

export const githubIconData: IconifyIcon = {
  body: '<path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"/>',
  width: 24,
  height: 24,
};

export const verifiedIconData: IconifyIcon = {
  body: '<path fill="currentColor" fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>',
  width: 20,
  height: 20,
};

// Helper to generate SSR-compatible SVG HTML matching @iconify/react output
export function iconToSSR(
  icon: IconifyIcon,
  className: string,
  width: number,
  height: number,
): any[] {
  return [
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: String(width),
      height: String(height),
      viewBox: `0 0 ${icon.width} ${icon.height}`,
      class: className,
    },
    // Parse the body to extract path elements
    // The body contains the inner SVG content as a string
    ...parseIconBody(icon.body),
  ];
}

// Parse icon body string into Tiptap renderHTML format
function parseIconBody(body: string): any[] {
  const result: any[] = [];
  // Simple regex to extract path elements with their attributes
  const pathRegex = /<path([^>]*)\/>/g;
  let match;

  while ((match = pathRegex.exec(body)) !== null) {
    const attrsString = match[1];
    const attrs: Record<string, string> = {};

    // Extract attributes
    const attrRegex = /(\w+(?:-\w+)?)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrsString)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }

    result.push(['path', attrs]);
  }

  return result;
}
