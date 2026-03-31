# mcp-bluesky

Bluesky MCP — wraps the AT Protocol API

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|
| `get_profile` | [Public] Get a Bluesky user profile by handle (e.g., "alice.bsky.social") |
| `get_posts` | [Public] Get recent posts from a Bluesky user's feed |
| `get_feed` | [Public] Get posts from a Bluesky feed (default: discover/whats-hot) |
| `get_followers` | [Public] Get a user's followers |
| `get_follows` | [Public] Get accounts that a user follows |
| `get_thread` | [Public] Get a post thread by AT URI |
| `resolve_handle` | [Public] Resolve a Bluesky handle to a DID |

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

Or use the CLI:

```bash
npx pipeworx use bluesky
```

## License

MIT
