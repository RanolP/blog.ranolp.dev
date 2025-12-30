import { searchTwitterUsers } from '~/services/twitter/search.server';

/**
 * API route for Twitter account search completion
 * GET /api/mentions/twitter?q=username
 */
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return Response.json({ users: [] });
  }

  const users = await searchTwitterUsers(query);

  return Response.json({ users });
}
