import { useLayoutEffect, type RefObject } from "react";
import Lenis from "lenis";
import { gsap, registerGsap, ScrollTrigger } from "../lib/gsap";

/**
 * The website's motion: Lenis smooth scrolling, synced to GSAP's ticker so
 * ScrollTrigger reads the smoothed scroll, and the scroll reveals. The site
 * is its own page (index.html), so this Lenis never meets the 3D version's
 * LenisProvider.
 *
 * Reveals are opt-in markup, so the page reads fine without them (reduced
 * motion, no JS):
 * - `data-reveal`: the element rises in when it scrolls into view.
 * - `data-stagger`: its children rise in, one after another.
 * - `data-head`: a section heading; its title slides up out of a mask, its
 *   rule draws across, its readouts flicker on.
 */
export function useSiteMotion(root: RefObject<HTMLElement | null>) {
  // A layout effect: the content is hidden for its reveal before the first
  // paint, so it never shows and then jumps away.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    registerGsap();
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Dialogs scroll natively; anchors (#evidence) glide.
      const lenis = new Lenis({ lerp: 0.1, anchors: true, prevent: (n) => !!n.closest("dialog") });
      lenis.on("scroll", ScrollTrigger.update);
      const onTick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(onTick);
      gsap.ticker.lagSmoothing(0);

      // The page stays put under a full-screen record: its own scrolling is
      // native, and the page behind does not drift.
      const watch = new MutationObserver(() => {
        if (document.querySelector("dialog[open]")) lenis.stop();
        else lenis.start();
      });
      watch.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

      // Reveal positions are measured once; fonts, images and the loader change
      // the page's height afterwards, so measure again when they settle.
      let timer = 0;
      const remeasure = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
      };
      const size = new ResizeObserver(remeasure);
      size.observe(document.body);
      void document.fonts?.ready.then(remeasure);
      window.addEventListener("load", remeasure);

      const inView = { start: "top 85%", once: true };

      el.querySelectorAll<HTMLElement>("[data-head]").forEach((head) => {
        gsap
          .timeline({ scrollTrigger: { trigger: head, ...inView } })
          .from(head.querySelector("[data-rule]"), { scaleX: 0, duration: 1.2, ease: "expo.out" })
          .from(
            head.querySelector("h2 > span"),
            { yPercent: 110, duration: 1, ease: "expo.out" },
            0,
          )
          .from(
            head.querySelectorAll("[data-meta] > span"),
            { autoAlpha: 0, x: 12, stagger: 0.12, duration: 0.5 },
            0.3,
          );
      });

      el.querySelectorAll<HTMLElement>("[data-reveal]").forEach((item) => {
        gsap.from(item, {
          y: 48,
          autoAlpha: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: item, ...inView },
        });
      });

      el.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) => {
        gsap.from(group.children, {
          y: 48,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.07,
          ease: "power3.out",
          // Opacity and transform only: they run on the compositor, where a
          // clip-path over a grid of images repaints every frame.
          force3D: true,
          scrollTrigger: { trigger: group, ...inView },
        });
      });

      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("load", remeasure);
        size.disconnect();
        watch.disconnect();
        gsap.ticker.remove(onTick);
        lenis.destroy();
      };
    });
    return () => mm.revert();
  }, [root]);
}
