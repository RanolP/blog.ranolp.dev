'use server';

import { Rettiwt } from 'rettiwt-api';

/**
 * Cached Rettiwt instance
 */
let rettiwt: Rettiwt | null = null;

/**
 * Get or initialize Rettiwt instance
 * @returns Rettiwt instance
 */
function getRettiwt(): Rettiwt {
  if (!rettiwt) {
    // Guest authentication is sufficient for fetching user details
    rettiwt = new Rettiwt();
  }
  return rettiwt;
}

/**
 * Search for Twitter user by exact username using rettiwt-api
 * @param query - The exact username to search for
 * @returns Array with the matching Twitter user (empty if not found)
 */
export async function searchTwitterUsers(query: string) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const username = query.trim();

    // Remove @ if present
    const cleanUsername = username.replace(/^@/, '');

    // Get Rettiwt instance
    const rettiwtInstance = getRettiwt();

    // Fetch user details by exact username
    const userDetails = await rettiwtInstance.user.details(cleanUsername);

    // Check if user details were found
    if (!userDetails) {
      return [];
    }

    // Transform to mention format
    return [
      {
        id: `tw:${userDetails.userName}`,
        label: `@tw:${userDetails.userName}`,
        username: userDetails.userName,
        displayName: userDetails.fullName || userDetails.userName,
        verified: userDetails.isVerified || false,
        avatar: userDetails.profileImage || undefined,
      },
    ];
  } catch (error) {
    // User not found or other error
    console.error('Error fetching Twitter user:', error);
    return [];
  }
}
