import { useEffect } from "react";
import { LenisProvider } from "./providers/LenisProvider";
import { Experience } from "../experience/Experience";
import { StoryController } from "../story/StoryController";
import { registerGsap } from "../lib/gsap";

export function App() {
  useEffect(() => {
    registerGsap();
  }, []);

  return (
    <LenisProvider>
      <StoryController />
      <Experience />
    </LenisProvider>
  );
}
