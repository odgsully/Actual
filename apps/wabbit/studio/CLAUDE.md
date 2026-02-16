# Wabbit Studio — CLAUDE.md

## What This Is

Remotion-based video production workspace for Wabbit marketing content. Produces short-form vertical videos (TikTok/Reels/Shorts) from script files in `../marketing/shortform-scripts/`.

## Tech Stack

- **Framework:** Remotion 4.0.x (React-based programmatic video)
- **Bundler:** Remotion's webpack (NOT Vite — separate from wabbit/web)
- **Port:** 3007 (Studio dev server)
- **Format:** 1080x1920 (9:16 vertical), 30fps

## Key Commands

```bash
npm run dev        # Start Remotion Studio on localhost:3007
npm run render     # Export .mp4 (requires ffmpeg)
npm run build      # Create webpack bundle
npm run typecheck  # TypeScript check
npm run upgrade    # Update all Remotion packages to latest
```

## Project Structure

```
studio/
├── src/
│   ├── index.ts                    # Entry point (registerRoot)
│   ├── Root.tsx                    # Composition registry — add new videos here
│   └── compositions/              # One file per video
│       ├── ShortformScript.tsx     # Starter template
│       └── AIAgentsNoTaste.tsx     # Script 02 draft
├── public/                         # Static assets (images, audio, video clips)
├── remotion.config.ts              # Studio config (port 3007)
├── package.json
└── tsconfig.json
```

## How to Add a New Video

1. Create a new component in `src/compositions/YourVideo.tsx`
2. Register it in `src/Root.tsx`:
   ```tsx
   <Composition
     id="YourVideo"
     component={YourVideo}
     durationInFrames={30 * 90}  // 90 seconds at 30fps
     fps={30}
     width={1080}
     height={1920}
   />
   ```
3. It appears in Remotion Studio immediately

## How to Add Real Assets (Replace Placeholders)

Assets go in `public/`. Reference them with `staticFile()`:

```tsx
import { Img, Video, Audio, staticFile } from "remotion";

// Images (screenshots, logos)
<Img src={staticFile("claude-demo.png")} />

// Video clips (screen recordings)
<Video src={staticFile("wabbit-demo.webm")} />

// Audio (voiceover, music)
<Audio src={staticFile("voiceover-02.mp3")} />
```

## Remotion API Quick Reference

### Timing & Sequencing
```tsx
import { Sequence, useCurrentFrame, useVideoConfig } from "remotion";

// Sequence = timed section (like a track in a video editor)
<Sequence from={fps * 3} durationInFrames={fps * 17}>
  <MySection />
</Sequence>

// Inside a Sequence, useCurrentFrame() resets to 0
const frame = useCurrentFrame();
const { fps } = useVideoConfig();
```

### Animation
```tsx
import { interpolate, spring } from "remotion";

// Linear interpolation
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

// Spring animation
const scale = spring({ frame, fps, config: { damping: 12 } });
```

### Layout
```tsx
import { AbsoluteFill } from "remotion";

// Full-frame container (position: absolute, inset: 0)
<AbsoluteFill style={{ backgroundColor: "#0a0a0f" }}>
  {/* content */}
</AbsoluteFill>
```

## Wabbit Brand Constants

```tsx
const BRAND = {
  bg: "#0a0a0f",           // Dark background
  white: "#ffffff",
  dim: "rgba(255,255,255,0.4)",
  mid: "rgba(255,255,255,0.6)",
  glass: "rgba(255,255,255,0.08)",
  glassBorder: "rgba(255,255,255,0.15)",
  red: "#ef4444",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
};
```

Always use dark backgrounds with white/transparent text. Match the glassmorphism design system from `wabbit/web`.

## Script Source Files

Scripts live in `../marketing/shortform-scripts/`. Each markdown has:
- Timestamped sections (HOOK, PROBLEM, SOLUTION, CTA, etc.)
- ON SCREEN directions (what to show)
- AUDIO lines (voiceover script)
- TEXT OVERLAY (on-screen text)
- Production notes

Map timestamps to Remotion `Sequence` components: `from={fps * seconds}`.

## Rendering

```bash
# Render a specific composition
npx remotion render src/index.ts AIAgentsNoTaste out/02-ai-agents-no-taste.mp4

# Render a still frame (for thumbnails)
npx remotion still src/index.ts AIAgentsNoTaste out/thumbnail.png --frame=0
```

Output goes to `out/` (gitignored).

## Dependencies

- React 18 (pinned to match monorepo — do NOT upgrade to React 19)
- All `remotion` and `@remotion/*` packages must be the same exact version
- Run `npm run upgrade` to update Remotion (updates all packages together)

## Isolation

This workspace is fully independent from `wabbit/web` and `wabbit/landing`. Different build system (webpack vs Vite vs Astro), different dev server, no shared imports. Adding dependencies here does not affect other apps.
