import * as React from "react";
import { cn } from "@/lib/utils";

interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ className, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          "group relative flex items-center justify-center overflow-hidden rounded-lg bg-slate-900 px-4 py-2 transition-transform hover:scale-105 active:scale-95",
          "before:absolute before:inset-0 before:z-0 before:bg-[radial-gradient(circle_at_center,_var(--interactive-btn-gradient)_0%,_transparent_45%)] before:opacity-0 before:transition-opacity hover:before:opacity-100",
          "after:absolute after:inset-0 after:z-10 after:bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)] after:opacity-0 after:mix-blend-overlay after:transition-opacity hover:after:opacity-100",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        <style jsx>{`
          :root {
            --interactive-btn-gradient: rgba(59, 130, 246, 0.5);
          }
          .dark {
            --interactive-btn-gradient: rgba(59, 130, 246, 0.3);
          }
        `}</style>
        <span className="relative z-20 font-medium text-white">
          {children}
        </span>
      </button>
    );
  }
);

InteractiveButton.displayName = "InteractiveButton"; 