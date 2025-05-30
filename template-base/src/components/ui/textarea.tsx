import * as React from "react"
import { useTheme } from "@/context/ThemeContext"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = React.useState(false);
    
    // Definir cores baseadas no tema
    const inputBgColor = theme === 'light'
      ? isFocused ? '#ffffff' : 'hsl(220, 20%, 91%)' // Cor dos botões selecionados no modo claro, branco quando focado
      : isFocused ? 'hsl(217, 33%, 25%)' : 'hsl(222, 47%, 16%)'; // No modo escuro: sem foco mais escuro, com foco mais claro
    
    // Definir sombra baseada no tema
    const boxShadow = theme === 'light'
      ? isFocused ? '0 2px 8px rgba(0, 0, 0, 0.18)' : '0 1px 3px rgba(0, 0, 0, 0.15)'
      : isFocused ? '0 2px 8px rgba(0, 0, 0, 0.45)' : '0 1px 3px rgba(0, 0, 0, 0.4)';
    
    return (
      <textarea
        className={cn(
          "min-h-[60px] max-h-[200px] resize-none p-3 w-full text-lg focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg",
          theme === 'light' ? 'placeholder:opacity-45' : 'placeholder:opacity-35',
          className
        )}
        style={{
          fontSize: '16px',
          backgroundColor: inputBgColor,
          border: 'none',
          boxShadow: boxShadow,
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease'
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
