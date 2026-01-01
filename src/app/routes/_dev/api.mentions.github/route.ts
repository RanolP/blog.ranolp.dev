import { searchGitHubUsers } from '~/services/github/search.server';

/**
 * API route for GitHub account search completion
 * GET /api/mentions/github?q=username
 */
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return Response.json({ users: [] });
  }

  const users = await searchGitHubUsers(query);

  return Response.json({ users });
}
