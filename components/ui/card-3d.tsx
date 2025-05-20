import { cn } from "@/lib/utils";
import React, { createContext, useContext, useRef, useState } from "react";

const MouseEnterContext = createContext<{
  isMouseEntered: boolean;
  setMouseEntered: (value: boolean) => void;
}>({
  isMouseEntered: false,
  setMouseEntered: () => {},
});

export const CardContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    containerClassName?: string;
  }
>(({ className, containerClassName, children, ...props }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setMouseEntered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  };

  const handleMouseEnter = () => {
    setMouseEntered(true);
    if (!containerRef.current) return;
    containerRef.current.style.transition = "transform 0.1s";
  };

  const handleMouseLeave = () => {
    setMouseEntered(false);
    if (!containerRef.current) return;
    containerRef.current.style.transition = "transform 0.5s";
    containerRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
  };

  return (
    <MouseEnterContext.Provider value={{ isMouseEntered, setMouseEntered }}>
      <div
        className={cn(
          "flex items-center justify-center perspective-1000",
          containerClassName
        )}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={containerRef}
          className={cn(
            "relative w-full transition-transform duration-200 transform-style-3d",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
});
CardContainer.displayName = "CardContainer";

export const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("transform-style-3d", className)}
      {...props}
    >
      {children}
    </div>
  );
});
CardBody.displayName = "CardBody";

export const CardItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    translateX?: number;
    translateY?: number;
    translateZ?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
  }
>(({
  className,
  children,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...props
}, ref) => {
  const { isMouseEntered } = useContext(MouseEnterContext);
  
  const transform = isMouseEntered
    ? `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
    : "translate3d(0, 0, 0) rotate(0)";

  return (
    <div
      ref={ref}
      className={cn("transition-transform duration-200", className)}
      style={{ transform }}
      {...props}
    >
      {children}
    </div>
  );
});
CardItem.displayName = "CardItem"; 