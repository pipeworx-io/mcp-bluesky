# @pipeworx/mcp-bluesky

MCP server for Bluesky social network -- search posts, get profiles, and browse feeds. Wraps the [AT Protocol API](https://docs.bsky.app/).

## Tools

| Tool | Description |
|------|-------------|
| `get_profile` | Get a user profile by handle |
| `get_posts` | Get recent posts from a user's feed |
| `search_posts` | Search posts by keyword (requires auth) |
| `get_feed` | Get posts from a feed (default: whats-hot) |
| `get_followers` | Get a user's followers |
| `get_follows` | Get accounts a user follows |
| `get_thread` | Get a post thread by AT URI |
| `resolve_handle` | Resolve a handle to a DID |

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "bluesky": {
      "url": "https://gateway.pipeworx.io/bluesky/mcp"
    }
  }
}
```

Or run via CLI:

```bash
npx pipeworx use bluesky
```

## License

MIT
