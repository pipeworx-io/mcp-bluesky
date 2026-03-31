/**
 * Bluesky MCP — wraps the AT Protocol API
 *
 * 8 tools for reading Bluesky data.
 * Most tools use the public API (no auth). search_posts requires BYO auth
 * via bsky_handle + bsky_app_password query params on the gateway URL.
 */

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

const API = 'https://public.api.bsky.app/xrpc';
const AUTH_API = 'https://bsky.social/xrpc';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_profile',
    description: '[Public] Get a Bluesky user profile by handle (e.g., "alice.bsky.social")',
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'Bluesky handle (e.g., alice.bsky.social)' },
      },
      required: ['handle'],
    },
  },
  {
    name: 'get_posts',
    description: "[Public] Get recent posts from a Bluesky user's feed",
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'Bluesky handle' },
        limit: { type: 'number', description: 'Number of posts (1-100, default 20)' },
      },
      required: ['handle'],
    },
  },
  {
    name: 'search_posts',
    description:
      '[Auth required] Search Bluesky posts by keyword. ' +
      'Requires bsky_handle and bsky_app_password in the gateway URL query params.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Number of results (1-100, default 25)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_feed',
    description: '[Public] Get posts from a Bluesky feed (default: discover/whats-hot)',
    inputSchema: {
      type: 'object',
      properties: {
        feed_uri: {
          type: 'string',
          description: 'AT URI of the feed generator (default: whats-hot)',
        },
        limit: { type: 'number', description: 'Number of posts (1-100, default 20)' },
      },
    },
  },
  {
    name: 'get_followers',
    description: "[Public] Get a user's followers",
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'Bluesky handle' },
        limit: { type: 'number', description: 'Number of followers (1-100, default 50)' },
      },
      required: ['handle'],
    },
  },
  {
    name: 'get_follows',
    description: '[Public] Get accounts that a user follows',
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'Bluesky handle' },
        limit: { type: 'number', description: 'Number of follows (1-100, default 50)' },
      },
      required: ['handle'],
    },
  },
  {
    name: 'get_thread',
    description: '[Public] Get a post thread by AT URI',
    inputSchema: {
      type: 'object',
      properties: {
        post_uri: { type: 'string', description: 'AT URI of the post (at://did/app.bsky.feed.post/rkey)' },
      },
      required: ['post_uri'],
    },
  },
  {
    name: 'resolve_handle',
    description: '[Public] Resolve a Bluesky handle to a DID',
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'Bluesky handle to resolve' },
      },
      required: ['handle'],
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

async function bskyGet(method: string, params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${API}/${method}?${qs}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bluesky API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function createSession(
  handle: string,
  appPassword: string,
): Promise<{ accessJwt: string; did: string }> {
  const res = await fetch(`${AUTH_API}/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password: appPassword }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bluesky auth failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<{ accessJwt: string; did: string }>;
}

async function bskyAuthGet(
  method: string,
  params: Record<string, string>,
  accessJwt: string,
): Promise<unknown> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${AUTH_API}/${method}?${qs}`, {
    headers: { Authorization: `Bearer ${accessJwt}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bluesky API error ${res.status}: ${text}`);
  }
  return res.json();
}

interface BskyContext {
  bsky?: { handle: string; appPassword: string };
}

interface BskyProfile {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  avatar?: string;
}

function formatProfile(p: BskyProfile) {
  return {
    did: p.did,
    handle: p.handle,
    displayName: p.displayName ?? '',
    description: p.description ?? '',
    followers: p.followersCount ?? 0,
    following: p.followsCount ?? 0,
    posts: p.postsCount ?? 0,
  };
}

interface BskyPostView {
  uri: string;
  cid: string;
  author: { handle: string; displayName?: string };
  record: { text?: string; createdAt?: string };
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
}

function formatPost(p: BskyPostView) {
  return {
    uri: p.uri,
    author: p.author.displayName || p.author.handle,
    handle: p.author.handle,
    text: p.record?.text ?? '',
    createdAt: p.record?.createdAt ?? '',
    likes: p.likeCount ?? 0,
    reposts: p.repostCount ?? 0,
    replies: p.replyCount ?? 0,
  };
}

// ── Tool implementation ──────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  // Extract and strip gateway-injected _context
  const context = (args._context ?? {}) as BskyContext;
  delete args._context;

  switch (name) {
    case 'get_profile': {
      const data = (await bskyGet('app.bsky.actor.getProfile', {
        actor: args.handle as string,
      })) as BskyProfile;
      return formatProfile(data);
    }

    case 'get_posts': {
      const data = (await bskyGet('app.bsky.feed.getAuthorFeed', {
        actor: args.handle as string,
        limit: String((args.limit as number) ?? 20),
      })) as { feed: { post: BskyPostView }[] };
      return { posts: data.feed.map((item) => formatPost(item.post)) };
    }

    case 'search_posts': {
      const params = {
        q: args.query as string,
        limit: String((args.limit as number) ?? 25),
      };

      if (context.bsky) {
        const session = await createSession(context.bsky.handle, context.bsky.appPassword);
        const data = (await bskyAuthGet(
          'app.bsky.feed.searchPosts',
          params,
          session.accessJwt,
        )) as { posts: BskyPostView[] };
        return { posts: data.posts.map(formatPost) };
      }

      // No auth — return a helpful error instead of letting the API return 403 HTML
      return {
        error: 'authentication_required',
        message:
          'Bluesky now requires authentication for post search. ' +
          'Add your credentials to the MCP config URL: ' +
          '?bsky_handle=you.bsky.social&bsky_app_password=xxxx-xxxx-xxxx-xxxx ' +
          '(generate an app password at https://bsky.app/settings/app-passwords)',
      };
    }

    case 'get_feed': {
      const feedUri =
        (args.feed_uri as string) ??
        'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';
      const data = (await bskyGet('app.bsky.feed.getFeed', {
        feed: feedUri,
        limit: String((args.limit as number) ?? 20),
      })) as { feed: { post: BskyPostView }[] };
      return { posts: data.feed.map((item) => formatPost(item.post)) };
    }

    case 'get_followers': {
      const data = (await bskyGet('app.bsky.graph.getFollowers', {
        actor: args.handle as string,
        limit: String((args.limit as number) ?? 50),
      })) as { followers: BskyProfile[] };
      return { followers: data.followers.map(formatProfile) };
    }

    case 'get_follows': {
      const data = (await bskyGet('app.bsky.graph.getFollows', {
        actor: args.handle as string,
        limit: String((args.limit as number) ?? 50),
      })) as { follows: BskyProfile[] };
      return { follows: data.follows.map(formatProfile) };
    }

    case 'get_thread': {
      const data = (await bskyGet('app.bsky.feed.getPostThread', {
        uri: args.post_uri as string,
      })) as { thread: { post: BskyPostView; replies?: { post: BskyPostView }[] } };
      return {
        post: formatPost(data.thread.post),
        replies: (data.thread.replies ?? []).map((r) => formatPost(r.post)),
      };
    }

    case 'resolve_handle': {
      const data = (await bskyGet('com.atproto.identity.resolveHandle', {
        handle: args.handle as string,
      })) as { did: string };
      return { handle: args.handle, did: data.did };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool } satisfies McpToolExport;
