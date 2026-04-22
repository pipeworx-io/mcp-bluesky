# mcp-bluesky

Bluesky MCP — wraps the AT Protocol API

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 250+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_profile` | Look up a Bluesky user\'s profile by handle (e.g., "alice.bsky.social"). Returns display name, bio, follower/following counts, avatar, and verification status. |
| `get_posts` | Fetch recent posts from a Bluesky user\'s timeline. Returns post text, timestamps, likes, reposts, reply counts, and threaded replies. |
| `get_feed` | Get posts from a Bluesky feed (e.g., "discover", "what\'s-hot"). Returns recent posts with authors, timestamps, and engagement counts. |
| `get_followers` | Get a user\'s followers on Bluesky by handle. Returns follower profiles including handles, display names, bios, and follower counts. |
| `get_follows` | Get accounts a Bluesky user follows by handle. Returns followed profiles with handles, display names, bios, and descriptions. |
| `get_thread` | Fetch a post thread by URI. Returns the parent post and all replies in conversation order with timestamps, authors, and engagement data. |
| `resolve_handle` | Convert a Bluesky handle to its DID (decentralized identifier). Returns the DID for programmatic account lookups. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "bluesky": {
      "url": "https://gateway.pipeworx.io/bluesky/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 250+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Bluesky data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
