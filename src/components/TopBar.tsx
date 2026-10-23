/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Moon, Sun, Settings, LogOut, User, Menu, PlusCircle, RotateCcw, Check, CheckCheck, Trash2, X, AlertCircle, ArrowLeft, Mic, Mail, KeyRound, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUI } from '../contexts/UIContext.tsx';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { usePortfolio } from '../contexts/PortfolioContext.tsx';
import { useNavigation } from '../contexts/NavigationContext.tsx';
import { useVoiceAssistant } from '../contexts/VoiceAssistantContext.tsx';
import { useUserTier } from '../contexts/UserTierContext.tsx';
import { formatCurrency } from '../utils/formatters.ts';
import { Crown } from 'lucide-react';
import HeaderSearch from './HeaderSearch.tsx';

interface TopBarProps {
  onSearchFocus: () => void;
  onNavigate?: (tab: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSearchFocus, onNavigate }) => {
  const { user, logout } = useAuth();
  const { addToast, toggleMobileMenu, openModal } = useUI();
  const { theme, toggleTheme } = useTheme();
  const { isMax, toggleTier } = useUserTier();
  const { currentRoute, goBack, history, activeTab, navigate, setMenuOpen, isMenuOpen } = useNavigation();
  const { openVoice, isOpen: isVoiceOpen, voiceState } = useVoiceAssistant();
  const {
    profile,
    marketContext,
    setMarketContext,
    addFunds,
    resetAccount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
  } = usePortfolio();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = (market: 'IN' | 'US') => {
    setMarketContext(market);
    setSwitcherOpen(false);
    addToast(`Switched to ${market === 'IN' ? 'Indian' : 'US'} Markets`, 'success');
  };

  const handleAddVirtualCash = () => {
    const isIN = marketContext === 'IN';
    const amount = isIN ? 100000 : 10000;
    const cur = isIN ? '₹' : '$';
    addFunds(amount, cur);
    addToast(`Added ${cur}${amount.toLocaleString()} virtual cash to your practice account!`, 'success');
  };

  const handleResetVirtualAccount = () => {
    setSwitcherOpen(false);
    openModal('reset-portfolio');
  };

  const currentCurrency = marketContext === 'IN' ? '₹' : '$';
  const currentBalance = profile?.balances?.[currentCurrency] || 0;
  
  const notifications = profile?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getPageTitle = (routeId: string) => {
    const titles: Record<string, string> = {
      orders: 'Orders',
      watchlist: 'Watchlist',
      alerts: 'Alerts',
      transactions: 'Transactions',
      settings: 'Settings',
      help: 'Help & Support',
      trade: 'Trade',
      'stock-details': 'Details',
      analytics: 'Analytics',
      research: 'Research',
      tools: 'Tools',
      news: 'News',
      portfolio: 'Portfolio',
      wealth: 'Wealth',
    };
    return titles[routeId] || 'Details';
  };

  const getBackLabel = () => {
    if (history.length <= 1) return 'Back';
    const prevRoute = history[history.length - 2];
    const topLevelTitles: Record<string, string> = {
      dashboard: 'Home',
      market: 'Discover',
      portfolio: 'Portfolio',
      wealth: 'Wealth',
    };
    return topLevelTitles[prevRoute.id] || getPageTitle(prevRoute.id);
  };

  // Determine if it's a primary page (Home, Discover, Portfolio, Wealth)
  const isPrimary = ['dashboard', 'market', 'portfolio', 'wealth'].includes(currentRoute.id);

  const rightActions = (
    <>
      {/* Right section - Actions & Profile */}
      <div className="flex items-center gap-3 md:gap-4 lg:gap-6 shrink-0 ml-2 md:ml-4">
        
        {/* Virtual Account / Market Region Switcher */}
        <div className="relative" ref={switcherRef}>
          <div 
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="flex items-center gap-2 sm:gap-3 lg:gap-4 px-3 sm:px-4 lg:px-4 py-1.5 sm:py-2 bg-ui-surface border border-ui-border rounded-xl shadow-xs cursor-pointer hover:border-ui-border/90 transition-all select-none"
            title="Switch Market Region (US / India)"
          >
            <div className="text-[16px] sm:text-[18px] leading-none">{marketContext === 'IN' ? '🇮🇳' : '🇺🇸'}</div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] font-bold text-positive flex items-center gap-1.5 uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-none mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-positive shadow-[0_0_5px_var(--color-positive)] animate-pulse"></span>
                <span className="hidden sm:inline">{marketContext === 'IN' ? 'INDIA MARKET' : 'U.S. MARKET'}</span>
                <span className="sm:hidden">{marketContext === 'IN' ? 'IN' : 'US'}</span>
              </span>
              <span className="text-[12px] sm:text-[14px] lg:text-[15px] font-mono font-bold text-text-main tracking-tight leading-none flex items-center gap-1.5 sm:gap-2">
                {formatCurrency(currentBalance, marketContext)}
                <span className="text-[8px] text-text-muted">▼</span>
              </span>
            </div>
          </div>
          <AnimatePresence>
            {switcherOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 top-full mt-3 w-72 sm:w-80 bg-ui-surface border border-ui-border rounded-2xl shadow-2xl overflow-hidden py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-ui-border flex items-center justify-between">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Market Region</p>
                  <span className="text-[10px] bg-positive/10 text-positive px-2 py-0.5 rounded-full font-bold">Live Data</span>
                </div>
                
                <button 
                  onClick={() => handleSwitch('US')}
                  className={`w-full text-left px-4 py-3 hover:bg-ui-surface-hover transition-colors flex items-center justify-between ${marketContext === 'US' ? 'bg-ui-surface-hover' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇺🇸</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-main">🇺🇸 U.S. Market</span>
                      <span className="text-[11px] text-text-muted">NYSE, NASDAQ • USD ($)</span>
                      <span className="text-xs font-mono font-bold text-text-main mt-0.5">
                        ${(profile?.balances?.['$'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} cash
                      </span>
                    </div>
                  </div>
                  {marketContext === 'US' && <span className="text-primary text-base font-bold">✓</span>}
                </button>

                <button 
                  onClick={() => handleSwitch('IN')}
                  className={`w-full text-left px-4 py-3 hover:bg-ui-surface-hover transition-colors flex items-center justify-between ${marketContext === 'IN' ? 'bg-ui-surface-hover' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇮🇳</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-main">🇮🇳 India Market</span>
                      <span className="text-[11px] text-text-muted">NSE, BSE • INR (₹)</span>
                      <span className="text-xs font-mono font-bold text-text-main mt-0.5">
                        ₹{(profile?.balances?.['₹'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} cash
                      </span>
                    </div>
                  </div>
                  {marketContext === 'IN' && <span className="text-primary text-base font-bold">✓</span>}
                </button>

                <div className="h-px bg-ui-border my-2" />

                <div className="px-3 py-1 space-y-1">
                  <button 
                    onClick={handleAddVirtualCash}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <PlusCircle size={14} />
                    <span>Add {marketContext === 'IN' ? '₹1,00,000' : '$10,000'} Virtual Funds</span>
                  </button>

                  <button 
                    onClick={handleResetVirtualAccount}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <RotateCcw size={14} />
                    <span>Reset Paper Portfolio</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TradePro Max Status / Upgrade Button */}
        {isMax ? (
          <div 
            onClick={toggleTier}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FCF8EE] border border-[#DFC27D]/60 text-[#B88E1E] text-xs font-bold shadow-xs cursor-pointer hover:bg-[#F8F2DE] transition-all select-none"
            title="Max Tier Active • Click to preview Free Mode"
          >
            <Crown size={14} className="text-[#D4AF37]" strokeWidth={2.4} />
            <span className="font-sans font-bold">Max Active</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#0F172A] font-mono">LIVE</span>
          </div>
        ) : (
          <button
            onClick={() => openModal('upgrade')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5BE4A] to-[#D4AF37] text-[#0A1124] text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            title="Upgrade to TradePro Max ($0.99/mo | ₹49/mo)"
          >
            <Crown size={14} strokeWidth={2.4} />
            <span>Upgrade to Max</span>
            <span className="text-[10px] opacity-80 font-mono hidden md:inline">($0.99/mo)</span>
          </button>
        )}

        {/* Theme Toggle Switch (Desktop & Tablet Pill) */}
        <div 
          onClick={toggleTheme}
          className="hidden sm:flex items-center rounded-full p-1 cursor-pointer shadow-xs relative w-16 h-8 select-none overflow-hidden group"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          role="button"
          aria-label="Toggle theme"
        >
          {/* Cross-fading container background layer */}
          <motion.div 
            className="absolute inset-0 pointer-events-none rounded-full border"
            initial={false}
            animate={{
              backgroundColor: theme === 'dark' ? '#0B1325' : '#EFECE3',
              borderColor: theme === 'dark' ? 'rgba(212, 175, 55, 0.28)' : 'rgba(212, 167, 44, 0.25)',
              boxShadow: theme === 'dark' 
                ? 'inset 0 1px 3px rgba(0, 0, 0, 0.4), 0 0 12px rgba(212, 175, 55, 0.08)' 
                : 'inset 0 1px 3px rgba(0, 0, 0, 0.06), 0 0 10px rgba(212, 167, 44, 0.1)'
            }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          />

          <div className="w-full flex justify-between px-1.5 z-10 text-text-muted pointer-events-none">
            <Sun 
              size={13} 
              strokeWidth={theme === 'light' ? 2.2 : 1.5} 
              className={`transition-all duration-400 ease-in-out ${theme === 'light' ? 'text-primary scale-110 opacity-100' : 'opacity-25 scale-90'}`} 
            />
            <Moon 
              size={13} 
              strokeWidth={theme === 'dark' ? 2.2 : 1.5} 
              className={`transition-all duration-400 ease-in-out ${theme === 'dark' ? 'text-primary scale-110 opacity-100' : 'opacity-25 scale-90'}`} 
            />
          </div>

          {/* Sliding indicator pill with cross-fading icon & background */}
          <motion.div 
            className="absolute top-1 left-1 w-6 h-6 rounded-full border flex items-center justify-center pointer-events-none" 
            animate={{ 
              x: theme === 'dark' ? 32 : 0,
              backgroundColor: theme === 'dark' ? '#14223A' : '#FFFFFF',
              borderColor: theme === 'dark' ? 'rgba(212, 175, 55, 0.45)' : 'rgba(212, 167, 44, 0.35)',
              boxShadow: theme === 'dark'
                ? '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 8px rgba(212, 175, 55, 0.25)'
                : '0 2px 6px rgba(23, 36, 58, 0.12), 0 0 6px rgba(212, 167, 44, 0.15)'
            }}
            transition={{ 
              x: { type: 'spring', stiffness: 450, damping: 28 },
              backgroundColor: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
              borderColor: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.82 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="text-primary flex items-center justify-center"
              >
                {theme === 'dark' ? (
                  <Moon size={13} strokeWidth={2.2} />
                ) : (
                  <Sun size={13} strokeWidth={2.2} />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Mobile Theme Toggle Button with Cross-Fade Background & Icon */}
        <button
          onClick={toggleTheme}
          className="sm:hidden w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden shadow-xs border active:scale-95"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          <motion.div 
            className="absolute inset-0 pointer-events-none rounded-full"
            initial={false}
            animate={{
              backgroundColor: theme === 'dark' ? '#0B1325' : '#FFFFFF',
              borderColor: theme === 'dark' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(229, 224, 214, 0.9)'
            }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.82 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center justify-center text-primary relative z-10"
            >
              {theme === 'dark' ? <Sun size={17} strokeWidth={2.2} /> : <Moon size={17} strokeWidth={2.2} />}
            </motion.div>
          </AnimatePresence>
        </button>
        
        {/* TradePro AI Voice Assistant Global Header Button [🎙 AI] */}
        <button
          onClick={() => openVoice()}
          id="header-tradepro-voice-btn"
          className={`h-10 px-3 sm:px-3.5 rounded-full border flex items-center gap-1.5 transition-all shadow-md active:scale-95 select-none ${
            isVoiceOpen || voiceState === 'LISTENING' || voiceState === 'SPEAKING'
              ? 'bg-[#D4AF37] text-[#0A0F1A] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
              : 'bg-ui-surface text-[#D4AF37] hover:bg-[#D4AF37]/15 border-[#D4AF37]/40 hover:border-[#D4AF37]'
          }`}
          title="Start TradePro AI voice assistant"
          aria-label="Start TradePro AI voice assistant"
        >
          <Mic size={17} strokeWidth={2.2} className={voiceState === 'LISTENING' ? 'animate-pulse text-[#0A0F1A]' : ''} />
          <span className="text-xs font-black tracking-wide hidden sm:inline">AI</span>
          {(voiceState === 'LISTENING' || voiceState === 'SPEAKING') && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping ml-0.5" />
          )}
        </button>

        {/* Notifications Bell & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-10 h-10 rounded-full bg-ui-surface text-text-muted hover:text-primary hover:bg-ui-surface-hover border border-ui-border flex items-center justify-center transition-all relative shadow-md"
            title="Notifications"
          >
            <Bell size={18} strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-mono font-bold flex items-center justify-center shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-ui-surface border border-ui-border rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[500px]"
              >
                {/* Panel Header */}
                <div className="px-4 py-3 border-b border-ui-border flex items-center justify-between bg-ui-bg/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-main">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.2 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsAsRead()}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <CheckCheck size={13} />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="overflow-y-auto divide-y divide-ui-border custom-scrollbar flex-1">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-xs text-text-muted">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif, notifIdx) => (
                      <div
                        key={`${notif.id}-${notifIdx}`}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`p-3.5 hover:bg-ui-surface-hover/80 transition-colors flex items-start gap-3 cursor-pointer group ${
                          !notif.read ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.read ? 'bg-primary' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-text-main truncate">{notif.title}</h4>
                            <span className="text-[10px] text-text-muted shrink-0 font-mono">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{notif.message}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notif.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-rose-500 p-1 rounded transition-opacity"
                          title="Dismiss"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-ui-border cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-ui-bg border border-primary shadow-primary/20 transition-transform hover:scale-105 duration-300 flex items-center justify-center">
              <div className="w-full h-full rounded-full flex items-center justify-center text-text-main font-black uppercase text-xs">
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'TP'}
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-start mr-1">
              <p className="text-[13px] font-bold text-text-main leading-tight group-hover:text-primary transition-colors">{user?.name || 'Trader'}</p>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mt-0.5">Paper Trading</p>
            </div>
          </div>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 top-full mt-3 w-64 bg-ui-surface border border-ui-border rounded-2xl shadow-2xl overflow-hidden py-2 z-50"
              >
                <div className="px-4 py-3 mb-1 border-b border-ui-border">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-text-main truncate">{user?.name || 'Trader'}</p>
                    {user?.emailVerified && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 flex items-center gap-1 shrink-0">
                        <ShieldCheck size={11} /> Email verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted font-mono truncate mt-0.5">{user?.email}</p>
                </div>
                
                <button onClick={() => { setProfileOpen(false); navigate('settings'); }} className="w-full text-left px-4 py-2 text-sm text-text-muted hover:text-text-main hover:bg-ui-surface-hover transition-colors flex items-center gap-3 cursor-pointer">
                  <User size={16} /> Account Profile
                </button>
                <button onClick={() => { setProfileOpen(false); navigate('settings'); }} className="w-full text-left px-4 py-2 text-sm text-text-muted hover:text-text-main hover:bg-ui-surface-hover transition-colors flex items-center gap-3 cursor-pointer">
                  <Settings size={16} /> Workstation Settings
                </button>
                
                <div className="h-px bg-ui-border my-2" />
                
                <button onClick={async () => {
                  setProfileOpen(false);
                  try {
                    await logout();
                    addToast('Signed out successfully', 'info');
                  } catch {
                    addToast('Could not sign out. Please try again.', 'info');
                  }
                }} className="w-full text-left px-4 py-2 text-sm text-negative hover:bg-negative/10 transition-colors flex items-center gap-3 cursor-pointer">
                  <LogOut size={16} /> Reset Profile
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );

  if (!isPrimary) {
    return (
      <header className="h-14 lg:h-[72px] shrink-0 border-b border-ui-border bg-ui-bg flex items-center justify-between px-3 md:px-6 lg:px-8 z-20 sticky top-0 transition-all duration-300">
        <div className="flex flex-1 items-center gap-2 md:gap-4">
          <button 
            onClick={goBack}
            className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors py-1.5 pr-2 md:pr-3 -ml-1 md:-ml-2 rounded-lg"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-wide hidden sm:inline-block">Back</span>
          </button>
          
          <h2 className="text-base md:text-xl font-serif font-black text-text-main italic pr-4 border-l border-ui-border/50 pl-4">
            {getPageTitle(currentRoute.id)}
          </h2>
        </div>

        <div className="flex items-center shrink-0">
          {rightActions}
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 lg:h-[76px] shrink-0 border-b border-ui-border bg-ui-bg flex items-center justify-between px-3 md:px-6 lg:px-8 z-20 sticky top-0 transition-all duration-300 gap-2 md:gap-4">
      {/* Left section - Context & Search */}
      <div className="flex-1 flex items-center gap-3 md:gap-4 lg:gap-8 max-w-4xl">
        {/* Compact Mobile Brand Mark */}
        <button 
          onClick={() => setMenuOpen(!isMenuOpen)} 
          className="md:hidden shrink-0 transition-transform active:scale-95 outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
        >
          <img src="/tradepro-logo.svg" alt="TradePro" className="w-[110px] h-[30px] object-contain object-left dark:hidden block" style={{ opacity: 1, filter: 'none' }} />
          <img src="/tradepro-logo-dark.svg" alt="TradePro" className="w-[110px] h-[30px] object-contain object-left hidden dark:block" style={{ opacity: 1, filter: 'none' }} />
        </button>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-text-main capitalize">
            {getPageTitle(currentRoute.id)}
          </span>
        </div>
        
        {/* Search Bar - 60-70% width on mobile, flexible on desktop */}
        <div className="flex-1">
          <HeaderSearch />
        </div>
      </div>
      
      {rightActions}
    </header>
  );
};

export default TopBar;
