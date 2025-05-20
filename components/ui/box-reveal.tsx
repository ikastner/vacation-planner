"use client";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BoxRevealProps {
  children: React.ReactNode;
  color?: string;
  duration?: number; // en secondes
  delay?: number; // en secondes
  className?: string;
}

export function BoxReveal({
  children,
  color = "#5046e6",
  duration = 0.5,
  delay = 0.25,
  className = ""
}: BoxRevealProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (boxRef.current) {
        boxRef.current.style.transform = "translateX(100%)";
        boxRef.current.style.transition = `transform ${duration}s cubic-bezier(0.4,0,0.2,1)`;
      }
      if (contentRef.current) {
        contentRef.current.style.opacity = "1";
        contentRef.current.style.transition = `opacity 0.2s ${duration + delay}s`;
      }
      setTimeout(() => setRevealed(true), duration * 1000);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [duration, delay]);

  return (
    <div className={cn("relative inline-block overflow-hidden", className)}>
      <div
        ref={boxRef}
        style={{
          background: color,
          position: "absolute",
          inset: 0,
          zIndex: 2,
          transform: "translateX(0)",
          transition: `transform ${duration}s cubic-bezier(0.4,0,0.2,1)`
        }}
      />
      <div
        ref={contentRef}
        style={{
          opacity: 0,
          position: "relative",
          zIndex: 3,
          transition: `opacity 0.2s ${duration + delay}s`
        }}
      >
        <div className={"transition-colors duration-300 text-black"}>
          {children}
        </div>
      </div>
    </div>
  );
} 