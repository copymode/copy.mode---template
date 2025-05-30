import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type Position = {
  top: number;
  left: number;
};

interface CustomTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  children,
  content,
  side = 'top',
  align = 'center',
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isSidebar, setIsSidebar] = useState(false);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Detectar se é sidebar baseado na posição
    const isSidebarElement = rect.left < 100;
    setIsSidebar(isSidebarElement);
    
    // Posicionamento inicial baseado no lado escolhido
    let top = 0;
    let left = 0;
    
    // Espaçamento em pixels entre o elemento e o tooltip
    // Reduzindo o espaçamento para ficar mais próximo do elemento
    const spacing = side === 'right' ? 2 : 8; 
    
    // Posicionamento baseado no lado escolhido
    switch (side) {
      case 'top':
        top = rect.top - spacing;
        left = rect.left + rect.width / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        // Verificar se é o sidebar recolhido
        if (isSidebarElement) {
          left = rect.right + 1; // Exatamente 1px de espaçamento para o sidebar
        } else {
          left = rect.right + spacing;
        }
        break;
      case 'bottom':
        top = rect.bottom + spacing;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - spacing;
        break;
    }
    
    // Ajustar alinhamento
    if (side === 'left' || side === 'right') {
      if (align === 'start') top = rect.top;
      else if (align === 'end') top = rect.bottom;
    } else {
      if (align === 'start') left = rect.left;
      else if (align === 'end') left = rect.right;
    }
    
    // Garantir que o tooltip não seja cortado pelas bordas da tela
    // Valores aproximados para largura e altura do tooltip
    const tooltipWidth = 200;
    const tooltipHeight = 50;
    
    // Ajustar posição para evitar corte nas bordas
    if (left - tooltipWidth / 2 < 10) {
      left = 10 + tooltipWidth / 2;
    } else if (left + tooltipWidth / 2 > viewportWidth - 10) {
      left = viewportWidth - 10 - tooltipWidth / 2;
    }
    
    if (top < 10) {
      top = 10;
    } else if (side === 'top' && top - tooltipHeight < 10) {
      // Mudar para o lado oposto se não houver espaço suficiente
      top = rect.bottom + spacing;
    } else if (side === 'bottom' && top + tooltipHeight > viewportHeight - 10) {
      // Mudar para o lado oposto se não houver espaço suficiente
      top = rect.top - spacing;
    }
    
    setPosition({ top, left });
  };

  const handleMouseEnter = () => {
    calculatePosition();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Recalcular posição quando a janela é redimensionada
  useEffect(() => {
    if (isVisible) {
      const handleResize = () => calculatePosition();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isVisible]);

  // Estilos para cada lado
  const tooltipStyles: React.CSSProperties = {
    position: 'fixed',
    zIndex: 99999,
    transform: (() => {
      switch (side) {
        case 'top': return 'translateX(-50%) translateY(-100%)';
        case 'right': return 'translateY(-50%)'; // Sem deslocamento horizontal para lado direito
        case 'bottom': return 'translateX(-50%)';
        case 'left': return 'translateX(-100%) translateY(-50%)';
      }
    })(),
    backgroundColor: 'var(--popover)',
    color: 'var(--popover-foreground)',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    boxShadow: 'var(--tooltip-shadow)',
    border: '1px solid var(--border)',
    fontSize: '0.875rem',
    lineHeight: '1.4',
    maxWidth: '20rem',
    pointerEvents: 'none',
    whiteSpace: 'pre-line',
    ...position
  };

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && createPortal(
        <div 
          role="tooltip" 
          style={tooltipStyles}
          className={cn(
            'custom-tooltip rounded-md', 
            isSidebar && 'sidebar-tooltip',
            className
          )}
          data-sidebar={isSidebar ? 'true' : 'false'}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}; 