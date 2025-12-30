'use server';

import { Octokit } from 'octokit';

/**
 * Cached Octokit instance
 */
let octokit: Octokit | null = null;

/**
 * Get or initialize Octokit instance
 * @returns Octokit instance
 */
function getOctokit(): Octokit {
  if (!octokit) {
    // GitHub API allows unauthenticated requests with rate limits
    // If you have a token, you can use it: new Octokit({ auth: process.env.GITHUB_TOKEN })
    octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }
  return octokit;
}

/**
 * Search for GitHub user by exact username using octokit
 * @param query - The exact username to search for
 * @returns Array with the matching GitHub user (empty if not found)
 */
export async function searchGitHubUsers(query: string) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const username = query.trim();

    // Remove @ if present
    const cleanUsername = username.replace(/^@/, '');

    // Get Octokit instance
    const octokitInstance = getOctokit();

    // Fetch user details by exact username
    const { data: userDetails } =
      await octokitInstance.rest.users.getByUsername({
        username: cleanUsername,
      });

    // Check if user details were found
    if (!userDetails) {
      return [];
    }

    // Transform to mention format
    return [
      {
        id: `gh:${userDetails.login}`,
        label: `@gh:${userDetails.login}`,
        username: userDetails.login,
        displayName: userDetails.name || userDetails.login,
        verified: false, // GitHub doesn't have verified status like Twitter
        avatar: userDetails.avatar_url || undefined,
      },
    ];
  } catch (error) {
    // User not found or other error
    // Octokit throws RequestError with status property for HTTP errors
    if (
      error instanceof Error &&
      'status' in error &&
      (error as { status: number }).status === 404
    ) {
      // User not found - return empty array
      return [];
    }
    console.error('Error fetching GitHub user:', error);
    return [];
  }
}
