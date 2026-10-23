import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type RouteId = 
  | 'dashboard' 
  | 'market' 
  | 'watchlist'
  | 'portfolio' 
  | 'charts'
  | 'ai-insights'
  | 'options'
  | 'futures'
  | 'alerts'
  | 'api'
  | 'settings'
  | 'wealth'
  | 'more'
  | 'orders' 
  | 'transactions' 
  | 'help'
  | 'trade'
  | 'analytics'
  | 'research'
  | 'tools'
  | 'news'
  | 'login'
  | 'signup'
  | 'key-index'
  | 'heatmap'
  | 'contributors'
  | 'ai-wealth-manager'
  | 'about'
  | 'how-it-works'
  | 'features'
  | 'pricing'
  | 'faq'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'ai-trading'
  | 'ai-trading-tools'
  | 'trading-risk-management'
  | 'how-ai-trading-works';

export interface RouteState {
  id: RouteId;
  params?: Record<string, any>;
}

export type TopLevelTab = 'dashboard' | 'market' | 'portfolio' | 'wealth' | 'more' | 'public';

interface NavigationContextType {
  history: RouteState[];
  currentRoute: RouteState;
  activeTab: TopLevelTab;
  navigate: (id: RouteId, params?: Record<string, any>) => void;
  goBack: () => void;
  resetTo: (id: RouteId, params?: Record<string, any>) => void;
  isMenuOpen: boolean;
  setMenuOpen: (isOpen: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const PUBLIC_ROUTES = [
  'about', 'how-it-works', 'features', 'pricing', 'faq', 'contact', 
  'privacy', 'terms', 'ai-trading', 'ai-trading-tools', 
  'trading-risk-management', 'how-ai-trading-works'
];

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<RouteState[]>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      if (path === 'login' || path === 'signup') {
        return [{ id: path as RouteId }];
      }
      if (path && (PUBLIC_ROUTES.includes(path) || ['dashboard', 'market', 'watchlist', 'portfolio', 'charts', 'ai-insights', 'options', 'futures', 'alerts', 'api', 'settings', 'wealth', 'heatmap', 'orders', 'transactions', 'help', 'analytics'].includes(path))) {
        return [{ id: path as RouteId }];
      }
    }
    return [{ id: 'dashboard' }];
  });
  const [isMenuOpen, setMenuOpen] = useState(false);

  const currentRoute = history[history.length - 1];

  const deriveActiveTab = (hist: RouteState[]): TopLevelTab => {
    for (let i = hist.length - 1; i >= 0; i--) {
       const id = hist[i].id;
       if (id === 'dashboard' || id === 'market' || id === 'portfolio' || id === 'wealth' || id === 'more') {
         return id as TopLevelTab;
       }
       if (id === 'ai-wealth-manager') {
         return 'wealth';
       }
       if (PUBLIC_ROUTES.includes(id)) {
         return 'public';
       }
       if (id === 'login' || id === 'signup') {
         return 'public';
       }
       if (['orders', 'watchlist', 'alerts', 'transactions', 'settings', 'help', 'analytics', 'research', 'tools', 'news', 'heatmap', 'key-index'].includes(id)) {
         return 'more';
       }
    }
    return 'dashboard';
  };
  
  const activeTab = deriveActiveTab(history);

  const navigate = useCallback((id: RouteId, params?: Record<string, any>) => {
    setHistory(prev => [...prev, { id, params }]);
    setMenuOpen(false);
    if (typeof window !== 'undefined') {
      const targetUrl = id === 'dashboard' ? '/' : `/${id}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState(null, '', targetUrl);
      }
    }
  }, []);

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length > 1) {
        const next = prev.slice(0, -1);
        if (typeof window !== 'undefined') {
          const lastId = next[next.length - 1].id;
          const targetUrl = lastId === 'dashboard' ? '/' : `/${lastId}`;
          window.history.pushState(null, '', targetUrl);
        }
        return next;
      }
      return prev;
    });
  }, []);

  const resetTo = useCallback((id: RouteId, params?: Record<string, any>) => {
    setHistory([{ id, params }]);
    setMenuOpen(false);
    if (typeof window !== 'undefined') {
      const targetUrl = id === 'dashboard' ? '/' : `/${id}`;
      if (window.location.pathname !== targetUrl) window.history.replaceState(null, '', targetUrl);
    }
  }, []);

  return (
    <NavigationContext.Provider value={{
      history, currentRoute, activeTab, navigate, goBack, resetTo, isMenuOpen, setMenuOpen
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
};
