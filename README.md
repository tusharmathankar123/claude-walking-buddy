# Walking Buddy

A cute little orange pixel critter who lives just above your prompt box in Claude Code and keeps you company while you chat.

- **Strolls** back and forth while you're idle, blinking now and then.
- **Hops** with a little "boing" when you send a message.
- **Scurries** with thinking dots while Claude is working on a reply.
- **Waves** with a "blip-blip" when Claude finishes replying.

He runs entirely on your machine: no model calls, so he doesn't use any tokens or count toward your usage limits. He's drawn as an animated SVG in the Claude Code desktop app; the terminal shows a small text version. Sounds play on macOS.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install walking-buddy --marketplace tusharmathankar123/claude-walking-buddy
```

Answer `y` to add the marketplace, then pick a scope (user scope puts him in every session).

Or from a shell:

```bash
claude plugin install walking-buddy --marketplace tusharmathankar123/claude-walking-buddy
```

## Using him

- `/buddy-sound` mutes or unmutes his sounds. Your choice is remembered across sessions.
- Collapse the strip above the prompt with its `[-]` if you want him out of the way.
- To turn him off entirely: `claude plugin disable walking-buddy@local-mods`
