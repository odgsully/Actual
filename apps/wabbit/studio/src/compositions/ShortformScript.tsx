import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export const ShortformScript: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = Math.floor(frame / fps);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0f",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: 64,
          fontWeight: 700,
          textAlign: "center",
          padding: 80,
        }}
      >
        Wabbit Studio
      </div>
      <div
        style={{
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: 32,
          marginTop: 20,
        }}
      >
        {seconds}s
      </div>
    </AbsoluteFill>
  );
};
