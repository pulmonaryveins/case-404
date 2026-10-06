import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "../../lib/gsap";

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
    const lenis = new Lenis();

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
