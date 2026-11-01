"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Adds .is-in to [data-reveal] elements as they scroll into view. A failsafe
// reveals everything after 2.5 s, so a slow device never ends up with blank sections.
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const elements = [...document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)")];
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    elements.forEach((element) => observer.observe(element));

    const failsafe = window.setTimeout(() => elements.forEach((element) => element.classList.add("is-in")), 2500);
    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [pathname]);

  return null;
}
