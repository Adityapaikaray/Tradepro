/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Plus, ChevronDown, List, Grid, MoreVertical, TrendingUp, TrendingDown, Bot, ArrowRight, Play, CheckCircle2, ChevronRight, Activity, Zap, ShieldAlert, PieChart, BarChart3, Newspaper, LineChart, Info, Briefcase, Crown, Sparkles, Layers, Terminal, Star, Clock, Compass, Eye, Lock } from 'lucide-react';
import { Stock } from '../types.ts';
import PremiumPerformanceCard from './PremiumPerformanceCard.tsx';
import { PositionCard } from './PositionCard.tsx';
import { PositionDetailsModal } from './PositionDetailsModal.tsx';
import { ModifyAllocationModal } from './ModifyAllocationModal.tsx';
import { QuickTradePanel } from './QuickTradePanel.tsx';
import { AskTradeProAIChip } from './VoiceAssistant/AskTradeProAIChip.tsx';
import { KeyIndicesBar } from './KeyIndicesBar.tsx';
import { ContextualUpgradeCard } from './ContextualUpgradeCard.tsx';
import AssetDetailPageModal from './AssetDetailPageModal.tsx';
import { usePortfolio } from '../contexts/PortfolioContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useMarketData } from '../contexts/MarketContext.tsx';
import { useUI } from '../contexts/UIContext.tsx';
import { useUserTier } from '../contexts/UserTierContext.tsx';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardViewProps {
  onTrade?: (stock: Stock) => void;
  onNavigate?: (tab: string) => void;
}

const TABS = ['Active Positions', 'Watchlist', 'Orders', 'Performance', 'Allocation', 'History'];
const FILTERS = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];

const DashboardView: React.FC<DashboardViewProps> = ({ onTrade, onNavigate }) => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [activeFilter, setActiveFilter] = useState('1M');
  const [viewMode, setViewMode] = useState<'grid'|'list'>('list');
  const [sortOpen, setSortOpen] = useState(false);
  const [sortMode, setSortMode] = useState('Value (High → Low)');
  const [moversType, setMoversType] = useState<'gainers'|'losers'>('gainers');
  const [detailsSymbol, setDetailsSymbol] = useState<string | null>(null);
  const [modifySymbol, setModifySymbol] = useState<string | null>(null);
  const [assetDetailStock, setAssetDetailStock] = useState<Stock | null>(null);
  
  const [showAllHoldings, setShowAllHoldings] = useState(false);

  const { profile, marketContext, addFunds, modifyHoldingAllocation, summary } = usePortfolio();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isMax } = useUserTier();
  const isIndia = marketContext === 'IN';
  const currencySymbol = isIndia ? '₹' : '$';
  const { stocks } = useMarketData();
  const userName = user?.name?.trim() || 'Trader';
  
  const { stocksMap } = useMemo(() => {
    const map = new Map<string, Stock>();
    stocks.forEach(s => map.set(s.symbol.toUpperCase(), s));
    return { stocksMap: map };
  }, [stocks]);

  const holdingsWithData = useMemo(() => {
    return (profile?.holdings || [])
      .map(holding => {
        const stock = stocksMap.get(holding.symbol.toUpperCase());
        return { holding, stock };
      })
      .filter((h): h is { holding: typeof h.holding; stock: Stock } => !!h.stock && h.stock.currency === currencySymbol)
      .map(h => {
        const currentPrice = h.stock.price;
        const avgCost = h.holding.averagePrice;
        const quantity = h.holding.shares;
        const marketValue = currentPrice * quantity;
        const costValue = avgCost * quantity;
        const unrealizedPL = marketValue - costValue;
        const unrealizedPLPct = avgCost > 0 ? (currentPrice / avgCost - 1) * 100 : 0;
        const todayChange = h.stock.change * quantity;
        const todayChangePct = h.stock.changePercent;
        const allocation = summary.currentValue > 0 ? (marketValue / summary.currentValue) * 100 : 0;
        
        return {
          ...h.holding,
          stock: h.stock,
          currentPrice,
          marketValue,
          unrealizedPL,
          unrealizedPLPct,
          todayChange,
          todayChangePct,
          allocation
        };
      });
  }, [profile?.holdings, stocksMap, currencySymbol, summary.currentValue]);

  const { openModal, addToast, setIsCopilotOpen, openCopilotWithPrompt } = useUI();

  const topMovers = useMemo(() => {
    return stocks
      .filter(s => s.currency === currencySymbol)
      .sort((a, b) => moversType === 'gainers' ? b.changePercent - a.changePercent : a.changePercent - b.changePercent)
      .slice(0, 5);
  }, [stocks, currencySymbol, moversType]);

  const recentOrders = useMemo(() => {
    const orders = profile?.orders || [];
    return orders
      .filter(o => !o.currency || o.currency === currencySymbol)
      .slice(-5)
      .reverse();
  }, [profile?.orders, currencySymbol]);

  const watchlistStocks = useMemo(() => {
    const userSymbols = new Set(profile?.watchlist || []);
    const defaultSymbols = isIndia
      ? ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TITAN']
      : ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'TSLA'];
    return stocks
      .filter(s => s.currency === currencySymbol)
      .filter(s => userSymbols.has(s.symbol) || defaultSymbols.includes(s.symbol))
      .slice(0, 5);
  }, [profile?.watchlist, stocks, currencySymbol, isIndia]);

  const dashboardNews = useMemo(() => {
    return isIndia
      ? [
          { title: 'RBI Keeps Repo Rate Steady at 6.5%, Forecasts Resilient 7.2% FY GDP', source: 'Economic Times', time: '14m ago', sentiment: 'positive' },
          { title: 'Nifty IT Index Extends Rally on Megacap Cloud Modernization Deals', source: 'LiveMint', time: '36m ago', sentiment: 'positive' },
          { title: 'Institutional Derivatives Volume Crosses ₹18,400 Cr in Weekly Contracts', source: 'Business Standard', time: '1h ago', sentiment: 'neutral' },
        ]
      : [
          { title: 'S&P 500 Pushes Forward as Semiconductor Multiple Expansion Accelerates', source: 'Bloomberg', time: '12m ago', sentiment: 'positive' },
          { title: 'Federal Reserve Notes Stable Core Disinflation Across Wholesale Measures', source: 'WSJ', time: '28m ago', sentiment: 'positive' },
          { title: 'Options Gamma Positioning Anchors Market Volatility Index Below 14.8', source: 'Financial Times', time: '54m ago', sentiment: 'neutral' },
        ];
  }, [isIndia]);

  return (
    <div className="pb-16 max-w-[1600px] mx-auto w-full space-y-6">
      
      {/* 1. Hero / Welcome Section */}
      <div 
        className="rounded-[24px] p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-end justify-between gap-6 border border-ui-border shadow-xs"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(ellipse at center bottom, #131A26 0%, #090C12 100%)' 
            : 'linear-gradient(135deg, #FCFAF4 0%, #F5ECD8 50%, #FAF5EA 100%)'
        }}
      >
        {/* Subtle mountain / line silhouette watermark */}
        <div 
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none" 
          style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 100 L20 65 L45 85 L75 30 L95 70 L100 60 L100 100 Z\' fill=\'%23D4AF37\' fill-opacity=\'0.3\' stroke=\'%23D4AF37\' stroke-width=\'1.5\' /%3E%3C/svg%3E")', 
            backgroundSize: 'cover', 
            backgroundPosition: 'bottom' 
          }} 
        />
        
        {/* Very subtle gold bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-sans font-medium text-text-main tracking-tight leading-snug">
            Good morning, <span className="font-serif italic font-bold text-text-main">{userName}</span>
          </h1>
          <p className="text-text-muted text-xs md:text-sm font-medium mt-1.5">
            Here's what's happening with your portfolio today.
          </p>
        </div>
        
        <div className="relative z-10 flex flex-col md:items-end gap-3 md:text-right">
          <div className="hidden sm:block">
            <p className="text-xs md:text-sm font-serif text-text-main font-medium italic">
              "Discipline today, compounds a brighter tomorrow."
            </p>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mt-1">
              — Warren Buffett
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap md:justify-end">
            <AskTradeProAIChip prompt="How is my portfolio doing today?" />
            <div className="bg-ui-surface/90 backdrop-blur-xs border border-ui-border rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs">
              <div className="flex flex-col text-left md:text-right">
                <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">Sun, 13 Sept 2026</span>
                <span className="text-[10px] text-text-main font-medium flex items-center gap-1">
                  Small steps. Bigger tomorrows. <ArrowRight size={10} className="text-primary inline" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Free vs Max Real-Time vs End-of-Day Status Indicator Bar */}
      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs transition-all ${
        isMax 
          ? 'bg-gradient-to-r from-[#FFFDF8] via-[#FCF8EE]/60 to-[#FFFFFF] border-[#DFC27D]/70' 
          : 'bg-ui-surface border-ui-border'
      }`}>
        <div className="flex items-center gap-2.5">
          {isMax ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE STREAM (6ms Latency)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ui-bg text-text-muted border border-ui-border text-[11px] font-bold uppercase tracking-wider">
              <Clock size={12} />
              <span>End-of-Day Feed (16:00 Close)</span>
            </div>
          )}

          <span className="text-text-muted hidden sm:inline">•</span>

          <span className="text-text-main font-mono text-[11px]">
            {isMax ? 'Real-Time Millisecond Tick Feed Active' : 'Consolidated Official Exchange Closing Prices'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isMax ? (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#B88E1E]">
              <Crown size={13} className="text-[#D4AF37]" />
              <span>Max Active</span>
            </div>
          ) : (
            <button
              onClick={() => openModal('upgrade')}
              className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-text-main transition-colors"
            >
              <span>Unlock Live 6ms Stream &amp; Level 2</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Market Indices Bar */}
      <KeyIndicesBar />

      {/* 2. Portfolio Summary 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        
        {/* 1. Total Portfolio Value */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }} 
          className="bg-ui-surface rounded-2xl p-5 border border-ui-border shadow-xs flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Briefcase size={14} className="text-primary" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Portfolio Value</p>
          </div>
          <p className="text-xl xl:text-2xl font-mono font-bold text-text-main leading-none mb-2">
            {currencySymbol}{summary.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-[11px] font-mono font-bold flex items-center gap-1 ${summary.totalGain >= 0 ? 'text-positive' : 'text-negative'}`}>
            {summary.totalGain >= 0 ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
            <span>{summary.totalGain >= 0 ? '+' : ''}{currencySymbol}{Math.abs(summary.totalGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>({summary.returnPct >= 0 ? '+' : ''}{summary.returnPct.toFixed(2)}%)</span>
          </p>
        </motion.div>

        {/* 2. Invested Capital */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.05 }} 
          className="bg-ui-surface rounded-2xl p-5 border border-ui-border shadow-xs flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-ui-surface-hover flex items-center justify-center shrink-0 border border-ui-border">
              <Activity size={14} className="text-primary" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Invested Capital</p>
          </div>
          <p className="text-xl xl:text-2xl font-mono font-bold text-text-main leading-none mb-2">
            {currencySymbol}{summary.investedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] font-sans font-medium text-text-muted truncate">
            Across {holdingsWithData.length} asset{holdingsWithData.length === 1 ? '' : 's'}
          </p>
        </motion.div>

        {/* 3. Total P&L */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.1 }} 
          className="bg-ui-surface rounded-2xl p-5 border border-ui-border shadow-xs flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${summary.totalGain >= 0 ? 'bg-positive/10 border-positive/30 text-positive' : 'bg-negative/10 border-negative/30 text-negative'}`}>
              {summary.totalGain >= 0 ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total P&L</p>
          </div>
          <p className={`text-xl xl:text-2xl font-mono font-bold leading-none mb-2 ${summary.totalGain >= 0 ? 'text-positive' : 'text-negative'}`}>
            {summary.totalGain >= 0 ? '+' : ''}{currencySymbol}{summary.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${summary.totalGain >= 0 ? 'bg-positive/10 text-positive border border-positive/20' : 'bg-negative/10 text-negative border border-negative/20'}`}>
              {summary.returnPct >= 0 ? '+' : ''}{summary.returnPct.toFixed(2)}% return
            </span>
          </div>
        </motion.div>

        {/* 4. Available Cash */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.15 }} 
          className="bg-ui-surface rounded-2xl p-5 border border-ui-border shadow-xs flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-ui-surface-hover flex items-center justify-center shrink-0 border border-ui-border">
                <span className="text-text-muted font-bold text-xs">{currencySymbol}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Available Cash</p>
            </div>
          </div>
          <p className="text-xl xl:text-2xl font-mono font-bold text-text-main leading-none mb-2">
            {currencySymbol}{summary.availableCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] font-sans font-medium text-text-muted truncate">
            Purchasing power available
          </p>
        </motion.div>
      </div>

      {/* 3. Portfolio Performance Graph Card & Bottom Tabs */}
      <PremiumPerformanceCard activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 4. Two-Column Layout Below Chart Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Top Holdings Table / Active Positions (7 cols) + AI Copilot */}
        <div className="xl:col-span-7 space-y-6 flex flex-col">
          
          {/* Top Holdings Card */}
          <div className="bg-ui-surface rounded-2xl p-6 border border-ui-border shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-ui-border mb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-text-main leading-tight">Top Holdings</h3>
                <p className="text-xs text-text-muted mt-0.5 font-medium">Your largest active positions by market value</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openModal('add-position')}
                  className="px-3 py-1.5 rounded-xl bg-primary text-text-dark text-xs font-bold hover:bg-primary-light transition-all flex items-center gap-1 shadow-xs"
                >
                  <Plus size={13} strokeWidth={2.5} /> Add Position
                </button>
                <button 
                  onClick={() => setShowAllHoldings(!showAllHoldings)}
                  className="text-xs font-bold text-primary hover:text-text-main transition-colors flex items-center gap-1 ml-2"
                >
                  {showAllHoldings ? 'Show Less' : 'See All'} <ArrowRight size={12} strokeWidth={2} />
                </button>
              </div>
            </div>

            {holdingsWithData.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-ui-bg text-text-muted flex items-center justify-center">
                  <Briefcase size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-main">No active positions yet</p>
                  <p className="text-xs text-text-muted mt-0.5">Use the Quick Trade panel to buy your first stock or ETF.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-ui-border text-[10px] uppercase font-bold text-text-muted tracking-wider">
                      <th className="pb-2.5 font-bold">Asset</th>
                      <th className="pb-2.5 font-bold text-right">Price</th>
                      <th className="pb-2.5 font-bold text-right">Today's Change</th>
                      <th className="pb-2.5 font-bold text-right">Shares</th>
                      <th className="pb-2.5 font-bold text-right">Market Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ui-border/60">
                    {(showAllHoldings ? holdingsWithData : holdingsWithData.slice(0, 5)).map((holding, index) => {
                      const isPositive = holding.todayChange >= 0;
                      return (
                        <tr 
                          key={`${holding.symbol}-${index}`} 
                          onClick={() => setDetailsSymbol(holding.symbol)}
                          className="group hover:bg-ui-surface-hover/60 transition-colors cursor-pointer"
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-ui-bg border border-ui-border flex items-center justify-center font-bold text-xs text-text-main group-hover:border-primary/50 group-hover:text-primary transition-colors shrink-0">
                                {holding.symbol.slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs md:text-sm text-text-main truncate">{holding.symbol}</div>
                                <div className="text-[10px] text-text-muted truncate max-w-[140px]">{holding.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="font-mono font-bold text-xs md:text-sm text-text-main">
                              {currencySymbol}{holding.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isPositive ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
                            }`}>
                              {isPositive ? '▲ +' : '▼ '}{Math.abs(holding.todayChangePct).toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="font-mono font-bold text-xs text-text-main">
                              {holding.shares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="font-mono font-bold text-xs md:text-sm text-text-main">
                              {currencySymbol}{holding.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI Market Summary Card */}
          <div className={`rounded-2xl p-6 border shadow-xs transition-all relative overflow-hidden ${
            isMax 
              ? 'border-2 border-[#DFC27D]/60 bg-gradient-to-b from-[#FFFDF8] via-[#FCF8EE]/50 to-[#FFFFFF]' 
              : 'bg-ui-surface border-ui-border'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-ui-border mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isMax ? 'bg-[#FCF8EE] border border-[#F3E5AB] text-[#D4AF37]' : 'bg-primary/10 text-primary'
                }`}>
                  <Sparkles size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif italic font-bold text-lg text-text-main">
                      {isMax ? 'Max AI Market Summary' : 'AI Market Summary'}
                    </h3>
                    {isMax && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#B88E1E] border border-[#D4AF37]/40">
                        MAX ENGINE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">Multi-factor quantitative regime detection</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold font-mono">
                94.2% Confidence
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-ui-surface border border-ui-border/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1">Current Macro Regime</span>
                <p className="text-xs sm:text-sm font-bold text-text-main">
                  Regime III: Bullish Consolidation with Low Volatility (VIX 14.2)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-ui-surface border border-ui-border/80">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Institutional Sentiment</span>
                  <span className="text-base font-mono font-bold text-emerald-600 block mt-0.5">+0.68 (Net Bullish)</span>
                  <span className="text-[10px] text-text-muted">Call sweep flow dominant</span>
                </div>
                <div className="p-3 rounded-xl bg-ui-surface border border-ui-border/80">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Composite Risk Score</span>
                  <span className="text-base font-mono font-bold text-text-main block mt-0.5">28 / 100</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Low Systematic Risk</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">Primary Trend Drivers</span>
                <div className="space-y-1.5 text-xs text-text-main">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-primary shrink-0 mt-0.5" />
                    <span>Disinflationary trajectory supporting tech multiple expansion.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-primary shrink-0 mt-0.5" />
                    <span>Institutional call gamma positioning anchoring index volatility.</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-ui-surface border border-ui-border/80 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                  <Sparkles size={11} /> Why This Matters
                </span>
                <p className="text-xs text-text-muted leading-relaxed">
                  Large dark-pool prints above 20-day VWAP indicate smart money is absorbing sell-side liquidity before the upcoming quarterly earnings wave.
                </p>
              </div>

              {!isMax && (
                <div className="p-3 rounded-xl bg-ui-bg border border-ui-border flex items-center justify-between text-xs">
                  <span className="text-text-muted">Want intraday dark pool prints &amp; live AI signals?</span>
                  <button
                    onClick={() => openModal('upgrade')}
                    className="font-bold text-primary hover:text-text-main flex items-center gap-1"
                  >
                    <span>Upgrade to Max</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Max Premium Widget: Real-Time Market Depth / Level 2 & Advanced Signals */}
          <div className={`rounded-2xl p-6 border shadow-xs transition-all ${
            isMax 
              ? 'border-2 border-[#DFC27D]/60 bg-ui-surface' 
              : 'bg-ui-surface border-ui-border opacity-95'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-ui-border mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Layers size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif italic font-bold text-base text-text-main">
                      Real-Time Level 2 Market Depth
                    </h3>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#B88E1E]">
                      MAX
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {isIndia ? 'NIFTY 50 Consolidated Order Book' : 'S&P 500 Consolidated Order Book'}
                  </p>
                </div>
              </div>

              {isMax ? (
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  STREAMING DOM
                </span>
              ) : (
                <button
                  onClick={() => openModal('upgrade')}
                  className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  <Lock size={11} /> Unlock Live DOM
                </button>
              )}
            </div>

            {/* Micro Order Book DOM Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-positive border-b border-ui-border pb-1">
                  <span>Bid Price</span>
                  <span>Size</span>
                </div>
                {[
                  { price: isIndia ? '25,810.00' : '572.40', size: '1,420' },
                  { price: isIndia ? '25,808.50' : '572.35', size: '2,890' },
                  { price: isIndia ? '25,807.00' : '572.30', size: '4,150' },
                ].map((b, i) => (
                  <div key={i} className="flex justify-between py-1 px-1.5 rounded bg-positive/5">
                    <span className="font-bold text-positive">{currencySymbol}{b.price}</span>
                    <span className="text-text-main">{b.size}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-negative border-b border-ui-border pb-1">
                  <span>Ask Price</span>
                  <span>Size</span>
                </div>
                {[
                  { price: isIndia ? '25,811.50' : '572.45', size: '1,120' },
                  { price: isIndia ? '25,813.00' : '572.50', size: '3,240' },
                  { price: isIndia ? '25,814.50' : '572.55', size: '4,890' },
                ].map((a, i) => (
                  <div key={i} className="flex justify-between py-1 px-1.5 rounded bg-negative/5">
                    <span className="font-bold text-negative">{currencySymbol}{a.price}</span>
                    <span className="text-text-main">{a.size}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Institutional Flow & Anomaly detection */}
            <div className="mt-4 pt-3 border-t border-ui-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Activity size={13} className="text-primary" />
                <span className="text-[11px] text-text-muted">Dark Pool Volume:</span>
                <span className="font-mono font-bold text-text-main">34.2% of daily volume</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                Net Buying
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Watchlist + Market Movers + News + Derivatives + Recent Activity + Quick Trade (5 cols) */}
        <div className="xl:col-span-5 space-y-6 flex flex-col">
          
          {/* 1. Watchlist Widget */}
          <div className="bg-ui-surface rounded-2xl p-6 border border-ui-border shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-ui-border mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-sans text-text-main">Watchlist</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-ui-bg text-text-muted border border-ui-border">
                    {watchlistStocks.length} tracked
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5 font-medium">Your primary target assets</p>
              </div>

              <button
                onClick={() => onNavigate ? onNavigate('watchlist') : openModal('watchlist')}
                className="text-xs font-bold text-primary hover:text-text-main transition-colors flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight size={12} strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-2.5">
              {watchlistStocks.map((stock, idx) => {
                const isPos = stock.changePercent >= 0;
                return (
                  <div
                    key={`${stock.symbol}-${idx}`}
                    onClick={() => setAssetDetailStock(stock)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-ui-surface-hover/70 transition-colors border border-transparent hover:border-ui-border cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-ui-bg border border-ui-border flex items-center justify-center font-bold text-xs text-text-main group-hover:text-primary transition-colors shrink-0">
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-text-main group-hover:text-primary transition-colors truncate">
                          {stock.symbol}
                        </div>
                        <div className="text-[10px] text-text-muted truncate max-w-[110px]">{stock.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-text-main">
                          {stock.currency || currencySymbol}{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-[10px] font-mono font-bold flex items-center justify-end ${isPos ? 'text-positive' : 'text-negative'}`}>
                          {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTrade) onTrade(stock);
                        }}
                        className="px-2 py-1 rounded-lg bg-ui-bg border border-ui-border text-[10px] font-bold text-text-main hover:bg-primary hover:text-text-dark hover:border-primary transition-all"
                      >
                        Trade
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Market Movers Card */}
          <div className="bg-ui-surface rounded-2xl p-6 border border-ui-border shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-ui-border mb-4">
              <div>
                <h3 className="text-base font-bold font-sans text-text-main">Market Movers</h3>
                <p className="text-[11px] text-text-muted mt-0.5 font-medium">Top performing {isIndia ? 'NSE' : 'US'} equities</p>
              </div>

              {/* Tabs: Gainers | Losers */}
              <div className="flex bg-ui-bg p-1 rounded-xl border border-ui-border text-xs font-bold">
                <button
                  onClick={() => setMoversType('gainers')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    moversType === 'gainers' 
                      ? 'bg-ui-surface text-positive shadow-2xs font-bold' 
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Gainers
                </button>
                <button
                  onClick={() => setMoversType('losers')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    moversType === 'losers' 
                      ? 'bg-ui-surface text-negative shadow-2xs font-bold' 
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Losers
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {topMovers.map((stock, idx) => {
                const isPos = stock.changePercent >= 0;
                return (
                  <div 
                    key={`${stock.symbol}-${idx}`}
                    onClick={() => setAssetDetailStock(stock)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-ui-surface-hover/60 transition-colors border border-transparent hover:border-ui-border group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-ui-bg border border-ui-border flex items-center justify-center font-bold text-xs text-text-main shrink-0">
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-text-main truncate group-hover:text-primary transition-colors">{stock.symbol}</div>
                        <div className="text-[10px] text-text-muted truncate max-w-[120px]">{stock.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-text-main">
                          {stock.currency || currencySymbol}{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-[10px] font-mono font-bold flex items-center justify-end ${isPos ? 'text-positive' : 'text-negative'}`}>
                          {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTrade) onTrade(stock);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-ui-bg border border-ui-border text-[11px] font-bold text-text-main hover:bg-primary hover:text-text-dark hover:border-primary transition-all shadow-2xs"
                      >
                        Trade
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Market News Widget */}
          <div className="bg-ui-surface rounded-2xl p-6 border border-ui-border shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-ui-border mb-3">
              <div className="flex items-center gap-2">
                <Newspaper size={16} className="text-primary" />
                <h3 className="text-base font-bold font-sans text-text-main">Market News</h3>
              </div>
              <button
                onClick={() => onNavigate ? onNavigate('news') : openModal('news')}
                className="text-xs font-bold text-primary hover:text-text-main transition-colors flex items-center gap-1"
              >
                <span>More News</span>
                <ArrowRight size={12} strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-3">
              {dashboardNews.map((news, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-ui-bg hover:bg-ui-surface-hover transition-colors space-y-1 border border-ui-border/60 cursor-pointer">
                  <div className="flex items-center justify-between text-[10px] text-text-muted font-medium">
                    <span className="font-bold text-text-main">{news.source}</span>
                    <span className="font-mono">{news.time}</span>
                  </div>
                  <h4 className="text-xs font-bold text-text-main leading-snug hover:text-primary transition-colors">
                    {news.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Options & Futures Overview Widget */}
          <div className={`rounded-2xl p-6 border shadow-xs transition-all ${
            isMax 
              ? 'border-2 border-[#DFC27D]/60 bg-ui-surface' 
              : 'bg-ui-surface border-ui-border'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-ui-border mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                <h3 className="text-base font-bold font-sans text-text-main">Derivatives &amp; Futures</h3>
                {isMax && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#B88E1E]">
                    MAX
                  </span>
                )}
              </div>
              <button
                onClick={() => onNavigate ? onNavigate('options') : openModal('options')}
                className="text-xs font-bold text-primary hover:text-text-main flex items-center gap-1"
              >
                <span>Chain</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-ui-bg border border-ui-border/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Options Put/Call Ratio</span>
                <span className="text-sm font-mono font-bold text-text-main block">0.78</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Bullish Call Bias</span>
              </div>

              <div className="p-3 rounded-xl bg-ui-bg border border-ui-border/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Front-Month Futures</span>
                <span className="text-sm font-mono font-bold text-text-main block">
                  {isIndia ? '₹25,842.00' : '$5,732.50'}
                </span>
                <span className="text-[10px] text-primary font-semibold">+0.43% (Premium +12.5)</span>
              </div>
            </div>
          </div>

          {/* 5. Recent Activity Card */}
          <div className="bg-ui-surface rounded-2xl p-6 border border-ui-border shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-ui-border mb-4">
              <div>
                <h3 className="text-base font-bold font-sans text-text-main">Recent Activity</h3>
                <p className="text-[11px] text-text-muted mt-0.5 font-medium">Order executions and transaction logs</p>
              </div>
              <button 
                onClick={() => onNavigate ? onNavigate('orders') : openModal('orders')}
                className="text-xs font-bold text-primary hover:text-text-main transition-colors flex items-center gap-1"
              >
                View Orders <ArrowRight size={12} strokeWidth={2} />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                No orders executed yet. Your recent trades will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order, idx) => {
                  const isBuy = order.type === 'BUY';
                  const orderDate = new Date(order.timestamp);
                  const timeString = isNaN(orderDate.getTime()) 
                    ? 'Just now' 
                    : orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div 
                      key={`${order.id || 'order'}-${idx}`}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-ui-bg/50 border border-ui-border/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase ${
                          isBuy ? 'bg-positive/15 text-positive border border-positive/30' : 'bg-negative/15 text-negative border border-negative/30'
                        }`}>
                          {order.type}
                        </span>
                        <div>
                          <div className="font-bold text-text-main flex items-center gap-1.5">
                            <span>{order.symbol}</span>
                            <span className="text-[10px] text-text-muted font-normal">
                              ({order.shares} share{order.shares === 1 ? '' : 's'})
                            </span>
                          </div>
                          <div className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={10} className="text-positive inline" />
                            <span>Executed &middot; {timeString}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono font-bold text-text-main">
                        {currencySymbol}{(order.shares * order.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Trade Panel */}
          <QuickTradePanel />

        </div>

      </div>

      {/* Interactive Modals */}
      {detailsSymbol && (
        <PositionDetailsModal
          isOpen={!!detailsSymbol}
          onClose={() => setDetailsSymbol(null)}
          stock={stocks.find(s => s.symbol.toUpperCase() === detailsSymbol.toUpperCase()) || stocks[0]}
          holding={profile?.holdings?.find(h => h.symbol.toUpperCase() === detailsSymbol.toUpperCase())}
          onQuickTrade={(s) => onTrade && onTrade(s)}
          onModifyAllocation={(sym) => {
            setDetailsSymbol(null);
            setModifySymbol(sym);
          }}
        />
      )}

      {modifySymbol && (
        <ModifyAllocationModal
          isOpen={!!modifySymbol}
          onClose={() => setModifySymbol(null)}
          symbol={modifySymbol}
          name={stocks.find(s => s.symbol.toUpperCase() === modifySymbol.toUpperCase())?.name || modifySymbol}
          currentAllocation={
            profile?.targetAllocations?.[modifySymbol] ?? 
            Math.round(holdingsWithData.find(h => h.symbol === modifySymbol)?.allocation || 10)
          }
          onSave={(newAlloc) => {
            modifyHoldingAllocation(modifySymbol, newAlloc);
            addToast(`Updated target allocation for ${modifySymbol} to ${newAlloc}%`, 'success');
            setModifySymbol(null);
          }}
        />
      )}

      {assetDetailStock && (
        <AssetDetailPageModal
          isOpen={!!assetDetailStock}
          onClose={() => setAssetDetailStock(null)}
          stock={assetDetailStock}
          onTrade={onTrade}
        />
      )}
    </div>
  );
};

export default React.memo(DashboardView);
