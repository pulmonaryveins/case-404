import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, registerGsap, ScrollTrigger } from "../../lib/gsap";
import { useExperienceStore } from "../../store/useExperienceStore";

interface Props {
  children: ReactNode;
}

/**
 * The single owner of the Lenis smooth-scroll instance for the whole app.
 * Never instantiate Lenis anywhere else — there must be exactly one
 * instance, synchronized with GSAP's ticker so ScrollTrigger stays
 * correct once cinematic scroll choreography is built.
 */
export function LenisProvider({ children }: Props) {
  useEffect(() => {
    registerGsap();
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      smoothWheel: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    // ScrollTrigger reads Lenis's smoothed scroll, not raw wheel input.
    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // The page stays put while the terminal screen is zoomed: wheel scrolls
    // the terminal, not the story.
    const unsubscribe = useExperienceStore.subscribe((s, prev) => {
      if (s.screenFocused === prev.screenFocused) return;
      if (s.screenFocused) lenis.stop();
      else lenis.start();
    });

    return () => {
      unsubscribe();
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
