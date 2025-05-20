"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
  restDelta: number;
}

const defaultSpringConfig: SpringConfig = {
  damping: 25,
  stiffness: 300,
  mass: 0.2,
  restDelta: 0.001,
};

interface SmoothCursorProps {
  className?: string;
  springConfig?: SpringConfig;
}

export function SmoothCursor({ className, springConfig = defaultSpringConfig }: SmoothCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({
    mouseX: 0,
    mouseY: 0,
    destinationX: 0,
    destinationY: 0,
    distanceX: 0,
    distanceY: 0,
    key: -1,
  });

  useEffect(() => {
    const mouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      
      positionRef.current.mouseX = clientX;
      positionRef.current.mouseY = clientY;
    };

    const followMouse = () => {
      positionRef.current.key = requestAnimationFrame(followMouse);
      
      const {
        mouseX,
        mouseY,
        destinationX,
        destinationY,
        distanceX,
        distanceY,
      } = positionRef.current;

      if (!destinationX || !destinationY) {
        positionRef.current.destinationX = mouseX;
        positionRef.current.destinationY = mouseY;
      } else {
        positionRef.current.distanceX = (mouseX - destinationX) * 0.15;
        positionRef.current.distanceY = (mouseY - destinationY) * 0.15;
        
        if (Math.abs(positionRef.current.distanceX) + Math.abs(positionRef.current.distanceY) < springConfig.restDelta) {
          positionRef.current.destinationX = mouseX;
          positionRef.current.destinationY = mouseY;
        } else {
          positionRef.current.destinationX += distanceX;
          positionRef.current.destinationY += distanceY;
        }
      }

      if (cursorRef.current) {
        // Calculer l'angle de rotation en fonction du mouvement
        const angle = Math.atan2(
          mouseY - destinationY,
          mouseX - destinationX
        ) * (180 / Math.PI);

        cursorRef.current.style.transform = `translate3d(${destinationX - 12}px, ${destinationY - 12}px, 0) rotate(${angle + 90}deg)`;
      }
    };

    const handleMouseDown = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform += ' scale(0.9)';
      }
    };

    const handleMouseUp = () => {
      if (cursorRef.current) {
        const currentTransform = cursorRef.current.style.transform;
        cursorRef.current.style.transform = currentTransform.replace(' scale(0.9)', '');
      }
    };

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    followMouse();

    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(positionRef.current.key);
    };
  }, [springConfig]);

  return (
    <div
      ref={cursorRef}
      className={cn(
        "fixed top-0 left-0 w-6 h-6 pointer-events-none z-[9999] transition-transform duration-50",
        className
      )}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3L20 20H4L12 3Z"
          fill="black"
        />
      </svg>
    </div>
  );
} 