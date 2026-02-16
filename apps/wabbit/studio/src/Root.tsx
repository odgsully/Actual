import { Composition } from "remotion";
import { ShortformScript } from "./compositions/ShortformScript";
import { AIAgentsNoTaste } from "./compositions/AIAgentsNoTaste";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AIAgentsNoTaste"
        component={AIAgentsNoTaste}
        durationInFrames={30 * 90}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ShortformScript"
        component={ShortformScript}
        durationInFrames={30 * 90}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
