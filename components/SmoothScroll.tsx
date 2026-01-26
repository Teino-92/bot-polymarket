'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollToPlugin);
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Enable smooth scrolling behavior
    if (typeof window !== 'undefined') {
      // Add CSS smooth scrolling
      document.documentElement.style.scrollBehavior = 'smooth';

      // Optional: Add GSAP-powered easing for anchor links
      const handleAnchorClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest('a[href^="#"]');

        if (anchor) {
          const href = anchor.getAttribute('href');
          if (href && href !== '#') {
            e.preventDefault();
            const targetElement = document.querySelector(href);

            if (targetElement) {
              gsap.to(window, {
                duration: 1,
                scrollTo: {
                  y: targetElement,
                  offsetY: 80, // Offset for fixed headers
                },
                ease: 'power2.inOut',
              });
            }
          }
        }
      };

      document.addEventListener('click', handleAnchorClick);

      return () => {
        document.removeEventListener('click', handleAnchorClick);
        document.documentElement.style.scrollBehavior = '';
      };
    }
  }, []);

  return <div ref={scrollContainerRef}>{children}</div>;
}
