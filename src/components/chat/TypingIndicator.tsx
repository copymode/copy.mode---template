import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TypingIndicator({ className }: { className?: string }) {
  const [dots, setDots] = useState(1);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev % 3) + 1);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={cn("flex items-center space-x-2 p-4", className)}>
      <div className="flex space-x-1.5">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className={cn(
              "h-2.5 w-2.5 rounded-full bg-muted-foreground transition-opacity duration-300",
              dots >= i ? "opacity-100" : "opacity-30"
            )}
          />
        ))}
      </div>
    </div>
  );
} 