import React from "react";

interface BlurRevealProps {
  children: React.ReactNode;
  duration?: number; // en secondes
  delay?: number; // en secondes
  blur?: string; // ex: '10px'
  yOffset?: number; // ex: 20
}

export const BlurReveal: React.FC<BlurRevealProps> = ({
  children,
  duration = 1,
  delay = 0.1,
  blur = "10px",
  yOffset = 20,
}) => {
  return (
    <span
      style={{
        display: "inline-block",
        opacity: 0,
        filter: `blur(${blur})`,
        transform: `translateY(${yOffset}px)`,
        animation: `blurReveal ${duration}s cubic-bezier(.4,0,.2,1) forwards`,
        animationDelay: `${delay}s`,
      }}
      className="blur-reveal"
    >
      {children}
      <style jsx>{`
        @keyframes blurReveal {
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }
      `}</style>
    </span>
  );
}; 