// Sistema de branding dinâmico para clientes
// Este arquivo é automaticamente gerado pelo script de setup

interface BrandingConfig {
  clientName: string;
  clientSlug: string;
  domain: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
  };
  logo: {
    light: string;
    dark: string;
    favicon: string;
  };
  texts: {
    appTitle: string;
    appDescription: string;
    welcomeMessage: string;
    footerText: string;
  };
  urls: {
    supportEmail: string;
    websiteUrl: string;
    socialMedia: {
      instagram?: string;
      linkedin?: string;
      youtube?: string;
    };
  };
  features: {
    visualEditor: boolean;
    expertSystem: boolean;
    knowledgeBase: boolean;
    analytics: boolean;
    whiteLabel: boolean;
  };
  customization: {
    showPoweredBy: boolean;
    customCSS?: string;
    customJS?: string;
  };
}

// Configuração padrão (será substituída pelo script de setup)
export const BRANDING: BrandingConfig = {
  clientName: import.meta.env.VITE_CLIENT_NAME || "Copy AI Studio",
  clientSlug: import.meta.env.VITE_CLIENT_SLUG || "default",
  domain: import.meta.env.VITE_DOMAIN || "localhost:3000",
  
  colors: {
    primary: import.meta.env.VITE_PRIMARY_COLOR || "#000000",
    secondary: import.meta.env.VITE_SECONDARY_COLOR || "#ee334e",
    accent: "#f3f4f6",
    background: "#ffffff",
    text: "#1a1a1a"
  },
  
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    headingFont: "Inter, system-ui, sans-serif"
  },
  
  logo: {
    light: "/logo-light.png",
    dark: "/logo-dark.png",
    favicon: "/favicon.ico"
  },
  
  texts: {
    appTitle: import.meta.env.VITE_APP_TITLE || "Copy AI Studio",
    appDescription: import.meta.env.VITE_APP_DESCRIPTION || "Plataforma de geração de copys com IA",
    welcomeMessage: "Bem-vindo ao seu estúdio de copys",
    footerText: `© ${new Date().getFullYear()} ${import.meta.env.VITE_CLIENT_NAME || "Copy AI Studio"}. Todos os direitos reservados.`
  },
  
  urls: {
    supportEmail: `suporte@${import.meta.env.VITE_DOMAIN || "localhost"}`,
    websiteUrl: `https://${import.meta.env.VITE_DOMAIN || "localhost"}`,
    socialMedia: {}
  },
  
  features: {
    visualEditor: true,
    expertSystem: true,
    knowledgeBase: true,
    analytics: false,
    whiteLabel: true
  },
  
  customization: {
    showPoweredBy: false,
    customCSS: "",
    customJS: ""
  }
};

// Hook para usar o branding
export const useBranding = () => {
  return BRANDING;
};

// Função para aplicar cores CSS dinamicamente
export const applyBrandingColors = () => {
  const root = document.documentElement;
  
  root.style.setProperty('--color-primary', BRANDING.colors.primary);
  root.style.setProperty('--color-secondary', BRANDING.colors.secondary);
  root.style.setProperty('--color-accent', BRANDING.colors.accent);
  root.style.setProperty('--color-background', BRANDING.colors.background);
  root.style.setProperty('--color-text', BRANDING.colors.text);
  
  // Aplicar fonte personalizada
  root.style.setProperty('--font-family', BRANDING.typography.fontFamily);
  root.style.setProperty('--font-heading', BRANDING.typography.headingFont);
  
  // Aplicar CSS customizado se existir
  if (BRANDING.customization.customCSS) {
    const style = document.createElement('style');
    style.textContent = BRANDING.customization.customCSS;
    document.head.appendChild(style);
  }
  
  // Aplicar JS customizado se existir
  if (BRANDING.customization.customJS) {
    const script = document.createElement('script');
    script.textContent = BRANDING.customization.customJS;
    document.head.appendChild(script);
  }
};

// Função para atualizar título da página
export const updatePageTitle = (pageTitle?: string) => {
  const title = pageTitle 
    ? `${pageTitle} - ${BRANDING.texts.appTitle}`
    : BRANDING.texts.appTitle;
  
  document.title = title;
  
  // Atualizar meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', BRANDING.texts.appDescription);
  }
};

// Função para verificar se uma feature está habilitada
export const isFeatureEnabled = (feature: keyof BrandingConfig['features']) => {
  return BRANDING.features[feature];
};

// Exportar configurações específicas para fácil acesso
export const CLIENT_NAME = BRANDING.clientName;
export const CLIENT_COLORS = BRANDING.colors;
export const CLIENT_FEATURES = BRANDING.features; 