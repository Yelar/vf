import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={cn(
          "border-t-purple-500 border-r-purple-500/30 border-b-purple-500/10 border-l-purple-500/50",
          "rounded-full animate-spin",
          sizeClasses[size],
          className
        )}
      />
      <div
        className={cn(
          "absolute border-t-transparent border-r-transparent border-b-transparent border-l-white/10",
          "rounded-full animate-pulse",
          sizeClasses[size]
        )}
      />
    </div>
  );
} 