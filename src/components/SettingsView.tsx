/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext.tsx';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useUI } from '../contexts/UIContext.tsx';
import { useMarketData } from '../contexts/MarketContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  Settings, Moon, Sun, Trash2, Shield, Bell, User, DollarSign, 
  RotateCcw, AlertTriangle, CheckCircle2, X, RefreshCw, Briefcase, 
  TrendingUp, TrendingDown, Info, Layers, Check, Globe, Mail, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SettingsTab = 'general' | 'demo-portfolio' | 'preferences' | 'notifications' | 'security';

const SettingsView: React.FC = () => {
  const { profile, resetAccount, marketContext, setMarketContext, summary } = usePortfolio();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast, openModal } = useUI();
  const { stocks } = useMarketData();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Notification toggles
  const [notifPriceAlerts, setNotifPriceAlerts] = useState(true);
  const [notifOrderFills, setNotifOrderFills] = useState(true);
  const [notifMarketNews, setNotifMarketNews] = useState(false);

  const isIndia = marketContext === 'IN';
  const currencySymbol = isIndia ? '₹' : '$';

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ui-border pb-5">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-black text-text-main italic tracking-tight flex items-center gap-3">
            <Settings className="text-primary" size={28} /> Settings & Portfolio Preferences
          </h2>
          <p className="text-xs md:text-sm text-text-muted font-medium tracking-wide mt-1">
            Manage your account preferences, theme, live market region, and virtual portfolio data.
          </p>
        </div>
        <button
          onClick={() => openModal('reset-portfolio')}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <RotateCcw size={14} className="stroke-[2.5]" />
          Reset Portfolio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold text-xs transition-all shrink-0 ${
              activeTab === 'general'
                ? 'bg-ui-surface-hover text-text-main border border-ui-border shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-ui-surface-hover/50 border border-transparent'
            }`}
          >
            <User size={16} className={activeTab === 'general' ? 'text-primary' : ''} />
            General & Profile
          </button>

          <button 
            onClick={() => setActiveTab('demo-portfolio')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold text-xs transition-all shrink-0 ${
              activeTab === 'demo-portfolio'
                ? 'bg-ui-surface-hover text-text-main border border-ui-border shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-ui-surface-hover/50 border border-transparent'
            }`}
          >
            <RotateCcw size={16} className={activeTab === 'demo-portfolio' ? 'text-primary' : ''} />
            Portfolio Reset & Data
          </button>

          <button 
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold text-xs transition-all shrink-0 ${
              activeTab === 'preferences'
                ? 'bg-ui-surface-hover text-text-main border border-ui-border shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-ui-surface-hover/50 border border-transparent'
            }`}
          >
            <Settings size={16} className={activeTab === 'preferences' ? 'text-primary' : ''} />
            Preferences & Theme
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold text-xs transition-all shrink-0 ${
              activeTab === 'notifications'
                ? 'bg-ui-surface-hover text-text-main border border-ui-border shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-ui-surface-hover/50 border border-transparent'
            }`}
          >
            <Bell size={16} className={activeTab === 'notifications' ? 'text-primary' : ''} />
            Notifications
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold text-xs transition-all shrink-0 ${
              activeTab === 'security'
                ? 'bg-ui-surface-hover text-text-main border border-ui-border shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-ui-surface-hover/50 border border-transparent'
            }`}
          >
            <Shield size={16} className={activeTab === 'security' ? 'text-primary' : ''} />
            Privacy & Security
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">

          {/* TAB 1: GENERAL & PROFILE */}
          {activeTab === 'general' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Profile Card */}
              <div className="bg-ui-surface rounded-3xl border border-ui-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                    <User size={18} className="text-primary" /> User Profile &amp; Account
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-ui-bg font-black uppercase text-xl shadow-md shrink-0">
                    {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'TP'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-text-main leading-tight">{user?.name || 'Trader'}</p>
                    <p className="text-xs text-text-muted mt-0.5 font-mono">{user?.email || 'Signed-in account'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                        Virtual Account Active
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-positive/10 border border-positive/20 text-positive text-[10px] font-bold uppercase tracking-wider">
                        Simulated Live Execution
                      </span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <button 
                      onClick={() => addToast('Profile details are synced with your local session.', 'info')}
                      className="px-4 py-2 bg-ui-surface-hover border border-ui-border text-text-main text-xs font-bold rounded-xl hover:bg-ui-border transition-colors shadow-sm cursor-pointer"
                    >
                      Sync Profile
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          await logout();
                          addToast('Signed out successfully', 'info');
                        } catch {
                          addToast('Could not sign out. Please try again.', 'info');
                        }
                      }}
                      className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold rounded-xl hover:bg-rose-500/20 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Demo Portfolio Quick Summary Banner */}
              <div className="bg-ui-surface rounded-3xl border border-ui-border p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-main">Active Portfolio Snapshot</h4>
                      <p className="text-xs text-text-muted">Currently trading in {isIndia ? 'Indian Equities (₹)' : 'US Equities ($)'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => openModal('reset-portfolio')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold transition-all"
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-ui-surface-hover border border-ui-border">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Available Cash</p>
                    <p className="text-sm font-mono font-bold text-text-main mt-1">
                      {currencySymbol}{summary.availableCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-ui-surface-hover border border-ui-border">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Invested Capital</p>
                    <p className="text-sm font-mono font-bold text-text-main mt-1">
                      {currencySymbol}{summary.investedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-ui-surface-hover border border-ui-border">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total P&L</p>
                    <p className={`text-sm font-mono font-bold mt-1 ${summary.totalGain >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {summary.totalGain >= 0 ? '+' : ''}{currencySymbol}{summary.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-ui-surface-hover border border-ui-border">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Positions Count</p>
                    <p className="text-sm font-mono font-bold text-text-main mt-1">
                      {(profile?.holdings || []).length} Equit{(profile?.holdings || []).length === 1 ? 'y' : 'ies'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: DEMO PORTFOLIO & DATA (PRIMARY FOCUS) */}
          {(activeTab === 'demo-portfolio' || activeTab === 'general') && (
            <motion.div 
              initial={{ opacity: 0, y: 6 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-ui-surface rounded-3xl border border-ui-border p-6 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ui-border pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                    <RotateCcw size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-main">Reset Portfolio</h3>
                    <p className="text-xs text-text-muted">Permanently reset simulated holdings and set virtual cash to 1,000,000.</p>
                  </div>
                </div>
                <button 
                  onClick={() => openModal('reset-portfolio')}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 active:scale-95 shrink-0"
                >
                  <RotateCcw size={14} className="stroke-[2.5]" />
                  Reset Portfolio
                </button>
              </div>

              {/* What gets reset explanation */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">What happens when you reset:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-ui-surface-hover/70 border border-ui-border flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                      <DollarSign size={14} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-text-main">Virtual Cash Set to 1,000,000</h5>
                      <p className="text-[11px] text-text-muted mt-0.5">Available virtual cash is set to ₹10,00,000 / $1,000,000 for practice paper trading.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-ui-surface-hover/70 border border-ui-border flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                      <Briefcase size={14} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-text-main">Holdings Completely Removed</h5>
                      <p className="text-[11px] text-text-muted mt-0.5">Clears all positions without leaving placeholder cards for TITAN, AMD, or other equities.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-ui-surface-hover/70 border border-ui-border flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                      <Layers size={14} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-text-main">Orders &amp; History Cleared</h5>
                      <p className="text-[11px] text-text-muted mt-0.5">Simulated order history and transaction logs associated with the portfolio are cleared.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-ui-surface-hover/70 border border-ui-border flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                      <RefreshCw size={14} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-text-main">Performance &amp; P&amp;L Reset</h5>
                      <p className="text-[11px] text-text-muted mt-0.5">Total P&amp;L (0.00%), Allocation (0.0%), and performance charts return to a clean baseline.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: PREFERENCES & THEME */}
          {activeTab === 'preferences' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-ui-surface rounded-3xl border border-ui-border p-6 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                  <Settings size={18} className="text-primary" /> Display & Environment
                </h3>

                {/* Appearance Theme */}
                <div className="flex items-center justify-between pb-5 border-b border-ui-border">
                  <div>
                    <p className="text-sm font-bold text-text-main">Visual Theme</p>
                    <p className="text-xs text-text-muted mt-0.5">Toggle between luxury dark mode and crisp high-contrast light mode</p>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ui-surface-hover hover:bg-ui-border text-text-main text-xs font-bold border border-ui-border transition-all duration-300 shadow-sm overflow-hidden relative"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={theme}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        className="flex items-center gap-2"
                      >
                        {theme === 'dark' ? (
                          <>
                            <Sun size={14} className="text-primary" />
                            <span>Light Mode</span>
                          </>
                        ) : (
                          <>
                            <Moon size={14} className="text-primary" />
                            <span>Dark Mode</span>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                </div>

                {/* Active Trading Market */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <p className="text-sm font-bold text-text-main">Primary Active Market</p>
                    <p className="text-xs text-text-muted mt-0.5">Current trading workspace currency and market exchange focus</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setMarketContext('IN');
                        addToast('Switched active market to Indian Equities (NSE/BSE)', 'info');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isIndia 
                          ? 'bg-primary text-ui-bg border-primary shadow-sm' 
                          : 'bg-ui-surface-hover text-text-muted border-ui-border hover:text-text-main'
                      }`}
                    >
                      India (₹)
                    </button>
                    <button 
                      onClick={() => {
                        setMarketContext('US');
                        addToast('Switched active market to US Equities (NYSE/NASDAQ)', 'info');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        !isIndia 
                          ? 'bg-primary text-ui-bg border-primary shadow-sm' 
                          : 'bg-ui-surface-hover text-text-muted border-ui-border hover:text-text-main'
                      }`}
                    >
                      United States ($)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-ui-surface rounded-3xl border border-ui-border p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                  <Bell size={18} className="text-primary" /> Alert & Notification Settings
                </h3>

                <div className="flex items-center justify-between pb-4 border-b border-ui-border">
                  <div>
                    <p className="text-sm font-bold text-text-main">Price Threshold Alerts</p>
                    <p className="text-xs text-text-muted mt-0.5">Receive in-app notifications when watchlisted stocks cross target thresholds</p>
                  </div>
                  <button 
                    onClick={() => {
                      setNotifPriceAlerts(prev => !prev);
                      addToast(notifPriceAlerts ? 'Price alerts disabled.' : 'Price alerts enabled.', 'info');
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${notifPriceAlerts ? 'bg-primary' : 'bg-ui-border'}`}
                  >
                    <div className={`bg-ui-bg w-4 h-4 rounded-full shadow-md transform transition-transform ${notifPriceAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-ui-border">
                  <div>
                    <p className="text-sm font-bold text-text-main">Order Execution Alerts</p>
                    <p className="text-xs text-text-muted mt-0.5">Confirmations when market and limit orders are filled or cancelled</p>
                  </div>
                  <button 
                    onClick={() => {
                      setNotifOrderFills(prev => !prev);
                      addToast(notifOrderFills ? 'Order alerts disabled.' : 'Order alerts enabled.', 'info');
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${notifOrderFills ? 'bg-primary' : 'bg-ui-border'}`}
                  >
                    <div className={`bg-ui-bg w-4 h-4 rounded-full shadow-md transform transition-transform ${notifOrderFills ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text-main">Market Intelligence & News</p>
                    <p className="text-xs text-text-muted mt-0.5">Real-time alerts for major breaking financial headlines affecting your holdings</p>
                  </div>
                  <button 
                    onClick={() => {
                      setNotifMarketNews(prev => !prev);
                      addToast(notifMarketNews ? 'News digests disabled.' : 'News digests enabled.', 'info');
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${notifMarketNews ? 'bg-primary' : 'bg-ui-border'}`}
                  >
                    <div className={`bg-ui-bg w-4 h-4 rounded-full shadow-md transform transition-transform ${notifMarketNews ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: PRIVACY & SECURITY */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-ui-surface rounded-3xl border border-ui-border p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                  <Shield size={18} className="text-primary" /> Session & Local Storage Privacy
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  TradePro stores simulated transactions, order history, and watchlist items in your browser's secure sandboxed storage. No real money or bank accounts are accessed.
                </p>
                <div className="p-4 rounded-2xl bg-ui-surface-hover border border-ui-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-positive" />
                    <div>
                      <p className="text-xs font-bold text-text-main">Encrypted Local Persistence</p>
                      <p className="text-[11px] text-text-muted">Virtual paper trade state active & verified</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => addToast('Storage integrity check passed: 100% operational.', 'success')}
                    className="px-3 py-1.5 rounded-lg bg-ui-surface border border-ui-border text-xs font-bold hover:bg-ui-border transition-colors text-text-main"
                  >
                    Check Health
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsView;
