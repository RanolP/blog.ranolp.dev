import { debounce } from 'es-toolkit/function';
import type { MentionItem } from './types';

/**
 * Twitter search function
 */
async function searchTwitterUsers(username: string): Promise<MentionItem[]> {
  console.log('Calling API for username:', username);
  const response = await fetch(
    `/api/mentions/twitter?q=${encodeURIComponent(username)}`,
  );
  console.log('API response status:', response.status);
  if (response.ok) {
    const data = await response.json();
    console.log('API response data:', data);
    return (data.users || []).map(
      (user: {
        id: string;
        label: string;
        username?: string;
        displayName?: string;
        avatar?: string;
        verified?: boolean;
      }) => ({
        id: user.id,
        label: user.label,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        verified: user.verified || false,
      }),
    );
  }
  console.error('API request failed:', response.status, response.statusText);
  return [];
}

/**
 * GitHub search function
 */
async function searchGitHubUsers(username: string): Promise<MentionItem[]> {
  console.log('Calling GitHub API for username:', username);
  const response = await fetch(
    `/api/mentions/github?q=${encodeURIComponent(username)}`,
  );
  console.log('GitHub API response status:', response.status);
  if (response.ok) {
    const data = await response.json();
    console.log('GitHub API response data:', data);
    return (data.users || []).map(
      (user: {
        id: string;
        label: string;
        username?: string;
        displayName?: string;
        avatar?: string;
        verified?: boolean;
      }) => ({
        id: user.id,
        label: user.label,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        verified: user.verified || false,
      }),
    );
  }
  console.error(
    'GitHub API request failed:',
    response.status,
    response.statusText,
  );
  return [];
}

/**
 * Debounced Twitter search wrapper
 * Uses es-toolkit's debounce to delay API calls until user stops typing
 * Wraps the debounced function to return a promise
 */
const pendingTwitterPromises = new Map<
  string,
  Array<{
    resolve: (value: MentionItem[]) => void;
    reject: (error: unknown) => void;
  }>
>();

const debouncedTwitterSearchFn = debounce(async (username: string) => {
  const promises = pendingTwitterPromises.get(username);
  if (!promises || promises.length === 0) {
    return;
  }

  try {
    const result = await searchTwitterUsers(username);
    promises.forEach(({ resolve }) => resolve(result));
  } catch (error) {
    promises.forEach(({ reject }) => reject(error));
  } finally {
    pendingTwitterPromises.delete(username);
  }
}, 300);

export const debouncedTwitterSearch = (
  username: string,
): Promise<MentionItem[]> => {
  return new Promise((resolve, reject) => {
    const promises = pendingTwitterPromises.get(username) || [];
    promises.push({ resolve, reject });
    pendingTwitterPromises.set(username, promises);
    debouncedTwitterSearchFn(username);
  });
};

/**
 * Debounced GitHub search wrapper
 * Uses setTimeout-based debounce to delay API calls until user stops typing
 * Wraps the debounced function to return a promise
 */
const pendingGitHubPromises = new Map<
  string,
  Array<{
    resolve: (value: MentionItem[]) => void;
    reject: (error: unknown) => void;
  }>
>();

const githubDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const debouncedGitHubSearch = (
  username: string,
): Promise<MentionItem[]> => {
  console.log('[GitHub Search] debouncedGitHubSearch called for:', username);

  // Clear existing timer for this username
  const existingTimer = githubDebounceTimers.get(username);
  if (existingTimer) {
    clearTimeout(existingTimer);
    githubDebounceTimers.delete(username);
  }

  return new Promise((resolve, reject) => {
    // Add this promise to the pending list
    const promises = pendingGitHubPromises.get(username) || [];
    promises.push({ resolve, reject });
    pendingGitHubPromises.set(username, promises);

    // Set up debounced execution
    const timer = setTimeout(async () => {
      console.log(
        '[GitHub Debounce] Executing debounced search for:',
        username,
      );
      const currentPromises = pendingGitHubPromises.get(username);
      if (!currentPromises || currentPromises.length === 0) {
        console.log('[GitHub Debounce] No pending promises found');
        githubDebounceTimers.delete(username);
        return;
      }

      try {
        console.log('[GitHub Debounce] Calling searchGitHubUsers');
        const result = await searchGitHubUsers(username);
        console.log('[GitHub Debounce] Search result:', result);
        currentPromises.forEach(({ resolve }) => resolve(result));
      } catch (error) {
        console.error('[GitHub Debounce] Error:', error);
        currentPromises.forEach(({ reject }) => reject(error));
      } finally {
        pendingGitHubPromises.delete(username);
        githubDebounceTimers.delete(username);
      }
    }, 300);

    githubDebounceTimers.set(username, timer);
  });
};
