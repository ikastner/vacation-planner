import { cn } from "@/lib/utils";

export function PrimaryButton({ className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded font-semibold text-white",
        "bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 transition-colors",
        className
      )}
      {...props}
    />
  );
} 