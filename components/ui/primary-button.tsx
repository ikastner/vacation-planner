import { cn } from "@/lib/utils";

export function PrimaryButton({ className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded font-semibold text-primary-foreground",
        "bg-primary hover:bg-primary/90 transition-colors",
        className
      )}
      {...props}
    />
  );
} 