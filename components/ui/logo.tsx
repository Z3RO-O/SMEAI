import { Brain } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  };

  const iconSizes = {
    sm: "size-4",
    md: "size-6",
    lg: "size-7",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center`}
      >
        <Brain className={`${iconSizes[size]} text-white`} />
      </div>
      {showText && (
        <div>
          <h1
            className={`${textSizes[size]} font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`}
          >
            SMEAI
          </h1>
          {size !== "sm" && (
            <p className="text-xs text-muted-foreground">
              Subject Matter Expert AI
            </p>
          )}
        </div>
      )}
    </div>
  );
}

