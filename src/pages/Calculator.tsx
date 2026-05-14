"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator as CalcIcon, 
  Coins, 
  RefreshCw, 
  ArrowLeftRight, 
  TrendingUp, 
  HelpCircle, 
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { showSuccess } from '@/utils/toast';

type CalculationMode = 'fiat-to-xpr' | 'xpr-to-fiat';

const Calculator = () => {
  const [mode, setMode] = useState<CalculationMode>('fiat-to-xpr');
  const [inputValue, setInputValue] = useState<string>('100');
  const [resultValue, setResultValue] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    { code: 'NZD', symbol: 'NZ$', name: 'NZ Dollar' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  ];

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const vsCurrencies = currencies.map(c => c.code.toLowerCase()).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=proton&vs_currencies=${vsCurrencies}`
      );
      const data = await response.json();
      const protonPrices = data.proton;
      
      const newPrices: Record<string, number> = {};
      currencies.forEach(c => {
        newPrices[c.code] = protonPrices[c.code.toLowerCase()];
      });
      
      setPrices(newPrices);
    } catch (error) {
      console.error('Failed to fetch XPR prices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    const rate = prices[currency];
    if (!rate || !inputValue || isNaN(parseFloat(inputValue))) {
      setResultValue('0');
      return;
    }

    const val = parseFloat(inputValue);
    if (mode === 'fiat-to-xpr') {
      const calculated = val / rate;
      setResultValue(Math.round(calculated).toLocaleString());
    } else {
      const calculated = val * rate;
      setResultValue(Math.round(calculated).toLocaleString());
    }
  }, [inputValue, currency, prices, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultValue.replace(/,/g, ''));
    setCopied(true);
    showSuccess("Value copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const currentSymbol = currencies.find(c => c.code === currency)?.symbol || '$';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary mb-1">
              <Sparkles size={10} className="animate-pulse" /> Community Utility
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
              <span className="text-primary drop-shadow-[0_0_15px_rgba(244,201,93,0.2)]">XPR Calculator</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed font-medium">
              Real-time calculations for peer-to-peer support across global currencies.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 animate-in fade-in zoom-in-95 duration-1000 delay-200">
            <div className="flex justify-center">
              <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex gap-1">
                <Button 
                  variant={mode === 'fiat-to-xpr' ? 'default' : 'ghost'}
                  onClick={() => setMode('fiat-to-xpr')}
                  className={cn(
                    "rounded-lg font-black text-[10px] uppercase tracking-widest h-9 px-5 transition-all",
                    mode === 'fiat-to-xpr' ? "bg-primary text-black shadow-lg" : "text-muted-foreground hover:text-white"
                  )}
                >
                  Fiat to XPR
                </Button>
                <Button 
                  variant={mode === 'xpr-to-fiat' ? 'default' : 'ghost'}
                  onClick={() => setMode('xpr-to-fiat')}
                  className={cn(
                    "rounded-lg font-black text-[10px] uppercase tracking-widest h-9 px-5 transition-all",
                    mode === 'xpr-to-fiat' ? "bg-primary text-black shadow-lg" : "text-muted-foreground hover:text-white"
                  )}
                >
                  XPR to Fiat
                </Button>
              </div>
            </div>

            <Card className="glass-card border-white/10 overflow-hidden rounded-[32px] shadow-2xl relative">
              <div className="absolute top-0 right-0 p-8 opacity-[0.01] pointer-events-none rotate-12">
                <CalcIcon size={300} />
              </div>
              
              <CardContent className="p-6 md:p-10 space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {mode === 'fiat-to-xpr' ? 'Enter Amount' : 'Enter XPR'}
                      </label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle size={12} className="text-muted-foreground/40 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="glass-card border-white/10 text-[9px] font-bold p-2">
                            {mode === 'fiat-to-xpr' ? 'How much help do you need?' : 'How much XPR are you sending?'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center text-2xl font-black text-primary/50 group-focus-within:text-primary transition-colors pointer-events-none">
                        {mode === 'fiat-to-xpr' ? currentSymbol : '⚡'}
                      </div>
                      <Input 
                        type="text"
                        inputMode="decimal"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="h-16 bg-white/5 border-white/10 focus:border-primary/50 text-2xl font-black pl-16 transition-all rounded-2xl"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Currency</label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-16 bg-white/5 border-white/10 text-lg font-black rounded-2xl focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10 max-h-[300px]">
                        {currencies.map(c => (
                          <SelectItem key={c.code} value={c.code} className="font-black py-3 hover:bg-white/5 focus:bg-white/10 rounded-xl m-1 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px]">{c.symbol}</span>
                              <span className="text-base">{c.code}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">— {c.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-white/10" />
                  <div className="w-12 h-12 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground shadow-inner transition-colors">
                    <ArrowLeftRight size={20} className="opacity-40" />
                  </div>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-white/10 to-white/10" />
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative p-8 md:p-10 rounded-[32px] bg-white/[0.03] border border-white/10 text-center space-y-5 shadow-2xl overflow-hidden">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-widest text-primary/70">
                        {mode === 'fiat-to-xpr' ? 'Estimated XPR Required' : 'Equivalent Fiat Value'}
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-5xl md:text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">
                          {loading ? "..." : resultValue}
                        </span>
                        <div className="flex flex-col items-start mt-2">
                          <span className="text-xl font-black text-primary leading-none">
                            {mode === 'fiat-to-xpr' ? 'XPR' : currency}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleCopy}
                            className="h-7 w-7 text-muted-foreground/40 hover:text-primary transition-colors mt-1"
                          >
                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold leading-relaxed max-w-lg mx-auto">
                        <Info size={14} className="text-blue-400 shrink-0" />
                        <span className="text-foreground/80 italic">
                          {mode === 'fiat-to-xpr' 
                            ? `${currentSymbol}${inputValue} ≈ ${resultValue} XPR.`
                            : `${inputValue} XPR ≈ ${currentSymbol}${resultValue} in ${currency}.`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <RefreshCw size={14} className={cn("text-blue-400", loading && "animate-spin")} />
                    </div>
                    <div className="space-y-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Live Market Price</p>
                      <p className="text-xs font-black">
                        {loading ? "Syncing..." : `1 XPR = ${prices[currency]?.toFixed(6)} ${currency}`}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={fetchPrices}
                      disabled={loading}
                      className="h-7 w-7 rounded-lg hover:bg-white/10 ml-1"
                    >
                      <RefreshCw size={12} />
                    </Button>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      asChild
                      variant="outline" 
                      className="h-10 border-white/10 hover:bg-white/10 font-black text-[10px] uppercase tracking-widest px-6 rounded-xl gap-2"
                    >
                      <a href="https://explorer.xprnetwork.org/" target="_blank" rel="noopener noreferrer">
                        Verify <TrendingUp size={12} />
                      </a>
                    </Button>
                    <Button 
                      asChild
                      className="h-10 bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest px-6 rounded-xl shadow-lg gold-glow gap-2"
                    >
                      <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                        Get XPR <ArrowRight size={12} />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
              <div className="glass-card p-6 rounded-[28px] border-white/5 flex gap-4 hover:border-primary/20 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-base tracking-tight">Simple Aid</h3>
                  <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                    Mid-market rates from CoinGecko for fair community support estimation.
                  </p>
                </div>
              </div>
              <div className="glass-card p-6 rounded-[28px] border-white/5 flex gap-4 hover:border-emerald-500/20 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Coins size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-base tracking-tight">Zero-Fee</h3>
                  <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                    Feeless transfers ensure every cent reaches the recipient in full.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Calculator;