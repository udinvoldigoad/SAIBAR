import type { CSSProperties, MouseEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function useLandingReveal() {
  const reducedMotion = useReducedMotion();
  return (delay = 0) => ({
    initial: reducedMotion ? false as const : { opacity: 0, y: 10 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "0px 0px -40px 0px" },
    transition: { duration: reducedMotion ? 0 : 0.38, delay: reducedMotion ? 0 : Math.min(delay, 0.12), ease: "easeOut" as const },
  });
}

export function LandingHeading({ text, accent, style }: { text: string; accent?: string; style?: CSSProperties }) {
  const reducedMotion = useReducedMotion();
  const accentStart = accent ? text.indexOf(accent) : -1;
  return (
    <motion.h2 className="landing-word-heading" aria-label={text} style={style}
      initial={reducedMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.5, margin: "0px 0px -40px 0px" }}>
      <span aria-hidden="true">
        {Array.from(text.matchAll(/\S+/g), (match, index) => (
          <span key={match.index}>
            {index > 0 && " "}
            <motion.span className="landing-heading-word"
              style={accentStart >= 0 && match.index >= accentStart && match.index < accentStart + (accent?.length ?? 0) ? { color: "var(--ocean-dark)" } : undefined}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: reducedMotion ? 0 : 0.32, delay: reducedMotion ? 0 : Math.min(index * 0.045, 0.24), ease: "easeOut" }}>
              {match[0]}
            </motion.span>
          </span>
        ))}
      </span>
    </motion.h2>
  );
}

export function scrollToLandingGuide(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const guide = document.getElementById("panduan");
  if (!guide) return;
  event.preventDefault();
  guide.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}
