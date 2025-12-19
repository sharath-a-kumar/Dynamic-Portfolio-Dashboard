'use client';

import { useState, useEffect, memo, useRef } from 'react';
import { TrendingUp, BarChart3, PieChart, Wallet, RefreshCw, Sparkles } from 'lucide-react';

// Loading messages that cycle through
const LOADING_MESSAGES = [
  { text: "Waking up the server", icon: RefreshCw, subtext: "Free tier servers need a moment to spin up" },
  { text: "Connecting to markets", icon: TrendingUp, subtext: "Establishing secure connections" },
  { text: "Fetching live stock prices", icon: BarChart3, subtext: "Getting real-time data from Yahoo Finance" },
  { text: "Analyzing your portfolio", icon: PieChart, subtext: "Calculating gains, losses, and metrics" },
  { text: "Crunching the numbers", icon: Wallet, subtext: "Computing sector allocations" },
  { text: "Almost there", icon: Sparkles, subtext: "Preparing your dashboard" },
];

// Stock market tips/facts to keep users engaged
const MARKET_TIPS = [
  "Tip: Diversification helps reduce portfolio risk across different sectors.",
  "Did you know? The Indian stock market is one of the oldest in Asia.",
  "Pro tip: Regular portfolio reviews help identify rebalancing opportunities.",
  "Fun fact: The term 'bull market' comes from how bulls attack - upward!",
  "Tip: P/E ratio helps compare valuations across similar companies.",
  "Remember: Past performance doesn't guarantee future results.",
  "Fun fact: 'Bear market' refers to how bears swipe down when attacking.",
  "Tip: Time in the market beats timing the market.",
  "Did you know? Index funds often outperform actively managed funds.",
  "Pro tip: Focus on long-term goals rather than short-term fluctuations.",
];

interface LoadingScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export const LoadingScreen = memo(function LoadingScreen({ isVisible, onComplete }: LoadingScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [dots, setDots] = useState('');
  const progressRef = useRef(0);

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Simulate progress
  useEffect(() => {
    if (!isVisible || !mounted) {
      progressRef.current = 0;
      setProgress(0);
      setMessageIndex(0);
      return;
    }

    const progressInterval = setInterval(() => {
      progressRef.current = Math.min(95, progressRef.current + Math.max(0.5, (95 - progressRef.current) / 20));
      setProgress(progressRef.current);
      
      // Update message based on progress
      const newIndex = Math.min(
        Math.floor((progressRef.current / 100) * LOADING_MESSAGES.length),
        LOADING_MESSAGES.length - 1
      );
      setMessageIndex(newIndex);
    }, 200);

    return () => clearInterval(progressInterval);
  }, [isVisible, mounted]);

  // Cycle tips every 4 seconds
  useEffect(() => {
    if (!isVisible || !mounted) return;
    
    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % MARKET_TIPS.length);
    }, 4000);

    return () => clearInterval(tipInterval);
  }, [isVisible, mounted]);

  // Animate dots
  useEffect(() => {
    if (!isVisible || !mounted) return;
    
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    return () => clearInterval(dotsInterval);
  }, [isVisible, mounted]);

  // Complete animation when data loads
  useEffect(() => {
    if (!isVisible && progressRef.current > 0 && mounted) {
      setProgress(100);
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, mounted, onComplete]);

  // Don't render anything on server or when not visible
  if (!mounted) return null;
  if (!isVisible && progress === 0) return null;

  const currentMessage = LOADING_MESSAGES[messageIndex];
  const CurrentIcon = currentMessage.icon;
  const currentTip = MARKET_TIPS[tipIndex];

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-spin-slow" />
      </div>

      {/* Glass card container */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-loading-card rounded-3xl p-8 shadow-2xl">
          {/* Logo/Brand area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4 animate-float">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Portfolio Dashboard</h1>
            <p className="text-slate-400 text-sm">Loading your investments</p>
          </div>

          {/* Current action with icon */}
          <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <CurrentIcon className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {currentMessage.text}{dots}
              </p>
              <p className="text-slate-400 text-sm truncate">
                {currentMessage.subtext}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Progress</span>
              <span className="text-sm font-mono text-indigo-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Animated steps indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {LOADING_MESSAGES.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx <= messageIndex 
                    ? 'w-6 bg-indigo-500' 
                    : 'w-1.5 bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Market tip */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-200/90 text-center">
              💡 {currentTip}
            </p>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-slate-500 text-xs mt-4">
          First load may take 30-60 seconds on free hosting
        </p>
      </div>
    </div>
  );
});

export default LoadingScreen;
