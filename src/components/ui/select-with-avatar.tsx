import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/context/ThemeContext"

// SelectItemWithAvatar - Item com avatar para listas de seleção
export const SelectItemWithAvatar = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    avatarSrc?: string | null;
    name: string;
  }
>(({ className, children, avatarSrc, name, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-9 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    
    <Avatar className="h-6 w-6 mr-2 flex-shrink-0">
      {avatarSrc ? (
        <AvatarImage src={avatarSrc} alt={name} />
      ) : (
        <AvatarFallback>{name[0].toUpperCase()}</AvatarFallback>
      )}
    </Avatar>

    <SelectPrimitive.ItemText className="truncate">{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))

// SelectTriggerWithAvatar - Trigger de seleção com avatar
export const SelectTriggerWithAvatar = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    avatarSrc?: string | null;
    selectedName?: string | null;
    placeholder?: string;
  }
>(({ className, children, avatarSrc, selectedName, placeholder, ...props }, ref) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);
  
  // Definir cores baseadas no tema (igual aos inputs)
  const inputBgColor = theme === 'light'
    ? isFocused ? '#ffffff' : 'hsl(220, 20%, 91%)'
    : isFocused ? 'hsl(217, 33%, 25%)' : 'hsl(222, 47%, 16%)';
  
  // Definir sombra baseada no tema (igual aos inputs)
  const boxShadow = theme === 'light'
    ? isFocused ? '0 2px 8px rgba(0, 0, 0, 0.18)' : '0 1px 3px rgba(0, 0, 0, 0.15)'
    : isFocused ? '0 2px 8px rgba(0, 0, 0, 0.45)' : '0 1px 3px rgba(0, 0, 0, 0.4)';
  
  // Definir cor do texto baseado no tema e se há um item selecionado
  const textColor = selectedName
    ? theme === 'light' ? '#333333' : '#ffffff'  // Cor quando há seleção (manter como estava)
    : theme === 'light' ? '#7c7c7c' : '#a1a1a1'; // Cor mais clara para placeholder (reduzida 2 tons)
  
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "select-trigger flex h-10 w-full items-center justify-between p-3 rounded-lg focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      style={{
        fontSize: '16px',
        backgroundColor: inputBgColor,
        border: 'none',
        boxShadow: boxShadow,
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
        color: textColor,
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...props}
    >
      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
        {selectedName && (
          <Avatar className="h-6 w-6 flex-shrink-0">
            {avatarSrc ? (
              <AvatarImage src={avatarSrc} alt={selectedName} />
            ) : (
              <AvatarFallback>{selectedName[0].toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
        )}
        <div className="truncate">{children}</div>
      </div>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-1" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}) 