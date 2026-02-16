import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

// --- Helpers ---

const BRAND = {
  bg: "#0a0a0f",
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

const TypewriterText: React.FC<{
  text: string;
  fontSize: number;
  color?: string;
  startFrame?: number;
  speed?: number;
}> = ({ text, fontSize, color = BRAND.white, startFrame = 0, speed = 2 }) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.min(text.length, Math.floor(elapsed / speed));
  const showCursor = elapsed % 10 < 6;

  return (
    <div style={{ fontSize, fontWeight: 700, color, textAlign: "center" }}>
      {text.slice(0, chars)}
      {chars < text.length && (
        <span style={{ opacity: showCursor ? 1 : 0 }}>|</span>
      )}
    </div>
  );
};

const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}> = ({ children, delay = 0, duration = 15 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + duration], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>
  );
};

const Placeholder: React.FC<{
  label: string;
  icon?: string;
  height?: number;
}> = ({ label, icon = "🎬", height = 500 }) => {
  return (
    <div
      style={{
        width: 900,
        height,
        background: BRAND.glass,
        border: `2px dashed ${BRAND.glassBorder}`,
        borderRadius: 24,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 48 }}>{icon}</div>
      <div
        style={{
          fontSize: 24,
          color: BRAND.dim,
          textAlign: "center",
          padding: "0 40px",
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>
    </div>
  );
};

const TextOverlay: React.FC<{
  text: string;
  delay?: number;
}> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${BRAND.glassBorder}`,
          borderRadius: 16,
          padding: "16px 32px",
          fontSize: 28,
          color: BRAND.white,
          fontWeight: 600,
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const SectionLabel: React.FC<{ label: string; time: string }> = ({
  label,
  time,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 40,
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: BRAND.purple,
          borderRadius: 8,
          padding: "6px 14px",
          fontSize: 18,
          color: BRAND.white,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 16, color: BRAND.dim }}>{time}</div>
    </div>
  );
};

const AudioCue: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 40,
        right: 40,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <div style={{ fontSize: 18, color: BRAND.purple, flexShrink: 0 }}>
        🎙
      </div>
      <div
        style={{
          fontSize: 18,
          color: BRAND.mid,
          fontStyle: "italic",
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// --- Sections ---

const HookSection: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <SectionLabel label="HOOK" time="0:00 – 0:03" />
      <TypewriterText
        text="Your AI agent has no taste."
        fontSize={56}
        speed={3}
      />
      <AudioCue text={'"Your AI agent can generate 500 images in an hour. It has no idea which ones are good."'} />
    </AbsoluteFill>
  );
};

const ProblemSection: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <SectionLabel label="PROBLEM" time="0:03 – 0:20" />

      <FadeIn delay={0}>
        <Placeholder
          label="SCREEN RECORDING: Terminal showing AI image generation pipeline outputting dozens of images"
          icon="💻"
          height={400}
        />
      </FadeIn>

      <FadeIn delay={30}>
        <div style={{ marginTop: 30 }}>
          <Placeholder
            label="CUT TO: Folder with 200+ AI-generated logos, all slightly different"
            icon="📁"
            height={300}
          />
        </div>
      </FadeIn>

      <TextOverlay
        text="Generation is solved. Evaluation is not."
        delay={120}
      />

      <AudioCue text={'"This is the dirty secret of AI content generation. The generation part is solved. What\'s NOT solved is the evaluation part."'} />
    </AbsoluteFill>
  );
};

const InsightSection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const step1 = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const step2 = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const step3 = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulseScale =
    1 + 0.08 * Math.sin((frame / fps) * Math.PI * 2 * 1.5);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        gap: 0,
      }}
    >
      <SectionLabel label="INSIGHT" time="0:20 – 0:35" />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: -100,
        }}
      >
        <div
          style={{
            opacity: step1,
            fontSize: 36,
            color: BRAND.white,
            fontWeight: 600,
          }}
        >
          AI generates
        </div>
        <div style={{ opacity: step1, fontSize: 36, color: BRAND.dim }}>→</div>
        <div
          style={{
            opacity: step2,
            fontSize: 40,
            color: BRAND.red,
            fontWeight: 800,
            transform: `scale(${step2 > 0.5 ? pulseScale : 1})`,
          }}
        >
          ???
        </div>
        <div style={{ opacity: step2, fontSize: 36, color: BRAND.dim }}>→</div>
        <div
          style={{
            opacity: step3,
            fontSize: 36,
            color: BRAND.white,
            fontWeight: 600,
          }}
        >
          Ships to customer
        </div>
      </div>

      <FadeIn delay={90} duration={20}>
        <div
          style={{
            marginTop: 80,
            fontSize: 28,
            color: BRAND.green,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          The missing piece: Human-in-the-Loop
        </div>
      </FadeIn>

      <TextOverlay
        text="Quality via Quantity — not quantity instead of quality"
        delay={130}
      />

      <AudioCue text={'"There\'s a missing piece in every AI content pipeline. The human-in-the-loop step. Not as a bottleneck — as a quality gate."'} />
    </AbsoluteFill>
  );
};

const DemoSection: React.FC = () => {
  const frame = useCurrentFrame();

  const steps = [
    {
      label: 'Claude Desktop + MCP: "Create a new Wabb called \'Brand Logos\' and add these 8 image URLs"',
      icon: "🤖",
      delay: 0,
    },
    {
      label: "Wabbit web app: 8 images appear in a collection",
      icon: "🎯",
      delay: 60,
    },
    {
      label: "User swipes through ranking each image (gesture UI)",
      icon: "👆",
      delay: 120,
    },
    {
      label: 'Claude: "What\'s the current leaderboard for Brand Logos?"',
      icon: "📊",
      delay: 180,
    },
    {
      label: "Claude returns ranked results with RAVG scores",
      icon: "🏆",
      delay: 240,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.bg,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 60,
        paddingTop: 120,
      }}
    >
      <SectionLabel label="DEMO" time="0:35 – 1:05" />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 40,
        }}
      >
        {steps.map((step, i) => {
          const opacity = interpolate(
            frame,
            [step.delay, step.delay + 20],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const isActive =
            frame >= step.delay &&
            (i === steps.length - 1 || frame < steps[i + 1].delay);

          return (
            <div
              key={i}
              style={{
                opacity,
                display: "flex",
                gap: 20,
                alignItems: "center",
                background: isActive
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${isActive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 20,
                padding: "24px 28px",
                transition: "all 0.3s",
              }}
            >
              <div style={{ fontSize: 36, flexShrink: 0 }}>{step.icon}</div>
              <div style={{ fontSize: 24, color: BRAND.white, lineHeight: 1.4 }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          top: 120,
          right: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <Placeholder
          label="SCREEN RECORDING: Full demo sequence — Claude → Wabbit → Gesture ranking → Results"
          icon="📹"
          height={280}
        />
      </div>

      <AudioCue text={'"So we built an MCP server for this. Watch — I tell Claude to create a collection and add my AI-generated images..."'} />
    </AbsoluteFill>
  );
};

const FlywheelSection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { label: "Agent generates", color: BRAND.blue },
    { label: "Wabbit ranks", color: BRAND.purple },
    { label: "Scores feed back", color: BRAND.green },
    { label: "Agent improves", color: "#f59e0b" },
    { label: "Better content", color: BRAND.red },
  ];

  const cycleFrames = fps * 3;
  const activeIndex = Math.floor((frame % cycleFrames) / (cycleFrames / steps.length));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <SectionLabel label="FLYWHEEL" time="1:05 – 1:20" />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
          marginTop: -60,
        }}
      >
        {steps.map((step, i) => {
          const isActive = i === activeIndex;
          const opacity = interpolate(
            frame,
            [i * 15, i * 15 + 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <React.Fragment key={i}>
              <div
                style={{
                  opacity,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: isActive
                    ? `${step.color}22`
                    : BRAND.glass,
                  border: `2px solid ${isActive ? step.color : BRAND.glassBorder}`,
                  borderRadius: 16,
                  padding: "20px 40px",
                  minWidth: 400,
                  justifyContent: "center",
                  transform: `scale(${isActive ? 1.05 : 1})`,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: step.color,
                    boxShadow: isActive
                      ? `0 0 12px ${step.color}`
                      : "none",
                  }}
                />
                <div
                  style={{
                    fontSize: 30,
                    color: BRAND.white,
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {step.label}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    opacity,
                    fontSize: 24,
                    color: BRAND.dim,
                  }}
                >
                  ↓
                </div>
              )}
            </React.Fragment>
          );
        })}

        <div style={{ fontSize: 24, color: BRAND.dim, marginTop: 8 }}>
          ↻ repeat
        </div>
      </div>

      <AudioCue text={'"Here\'s the kicker. Those ranking scores feed BACK into your agent\'s context. So the next generation is better."'} />
    </AbsoluteFill>
  );
};

const CTASection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleSpring = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <SectionLabel label="CTA" time="1:20 – 1:30" />

      <FadeIn delay={0}>
        <div
          style={{
            background: BRAND.glass,
            border: `1px solid ${BRAND.glassBorder}`,
            borderRadius: 16,
            padding: "24px 48px",
            fontFamily: "monospace",
            fontSize: 28,
            color: BRAND.green,
            marginBottom: 60,
          }}
        >
          npx -y @wabbit/mcp-server
        </div>
      </FadeIn>

      <FadeIn delay={20}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: BRAND.white,
            transform: `scale(${scaleSpring})`,
          }}
        >
          wabbit
        </div>
      </FadeIn>

      <FadeIn delay={50}>
        <div
          style={{
            marginTop: 60,
            background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.blue})`,
            borderRadius: 20,
            padding: "24px 48px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 32,
              color: BRAND.white,
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            0 out of 17,683 MCP servers
          </div>
          <div
            style={{
              fontSize: 32,
              color: BRAND.white,
              fontWeight: 700,
            }}
          >
            do ranking. Until now.
          </div>
        </div>
      </FadeIn>

      <AudioCue text={'"One command to install. Link in bio. Zero dedicated ranking servers exist in the MCP ecosystem right now — out of 17,000. We\'re the first."'} />
    </AbsoluteFill>
  );
};

// --- Main Composition ---

export const AIAgentsNoTaste: React.FC = () => {
  const fps = 30;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg }}>
      {/* HOOK: 0–3 sec (frames 0–90) */}
      <Sequence from={0} durationInFrames={fps * 3}>
        <HookSection />
      </Sequence>

      {/* PROBLEM: 3–20 sec (frames 90–600) */}
      <Sequence from={fps * 3} durationInFrames={fps * 17}>
        <ProblemSection />
      </Sequence>

      {/* INSIGHT: 20–35 sec (frames 600–1050) */}
      <Sequence from={fps * 20} durationInFrames={fps * 15}>
        <InsightSection />
      </Sequence>

      {/* DEMO: 35–65 sec (frames 1050–1950) */}
      <Sequence from={fps * 35} durationInFrames={fps * 30}>
        <DemoSection />
      </Sequence>

      {/* FLYWHEEL: 65–80 sec (frames 1950–2400) */}
      <Sequence from={fps * 65} durationInFrames={fps * 15}>
        <FlywheelSection />
      </Sequence>

      {/* CTA: 80–90 sec (frames 2400–2700) */}
      <Sequence from={fps * 80} durationInFrames={fps * 10}>
        <CTASection />
      </Sequence>
    </AbsoluteFill>
  );
};
