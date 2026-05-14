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
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'NZD', symbol: 'NZ$', name: 'NZ Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
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
      setResultValue(calculated.toLocaleString(undefined, { maximumFractionDigits: 2 }));
    } else {
      const calculated = val * rate;
      setResultValue(calculated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
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
      <main className="flex-1 container mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
        <div className="max-w-3xl w-full space-y-12">
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
              <Sparkles size={12} className="animate-pulse" /> Community Utility
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
              Precision <span className="text-primary drop-shadow-[0_0_15px_rgba(244,201,93,0.2)]">XPR Calculator</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed font-medium">
              Real-time calculations for accurate peer-to-peer support across global currencies.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 animate-in fade-in zoom-in-95 duration-1000 delay-200">
            <div className="flex justify-center">
              <div className="bg-white/5 border border-white/10 p-1 rounded-2xl flex gap-1">
                <Button 
                  variant={mode === 'fiat-to-xpr' ? 'default' : 'ghost'}
                  onClick={() => setMode('fiat-to-xpr')}
                  className={cn(
                    "rounded-xl font-black text-[11px] uppercase tracking-widest h-10 px-6 transition-all",
                    mode === 'fiat-to-xpr' ? "bg-primary text-black shadow-lg" : "text-muted-foreground hover:text-white"
                  )}
                >
                  Fiat to XPR
                </Button>
                <Button 
                  variant={mode === 'xpr-to-fiat' ? 'default' : 'ghost'}
                  onClick={() => setMode('xpr-to-fiat')}
                  className={cn(
                    "rounded-xl font-black text-[11px] uppercase tracking-widest h-10 px-6 transition-all",
                    mode === 'xpr-to-fiat' ? "bg-primary text-black shadow-lg" : "text-muted-foreground hover:text-white"
                  )}
                >
                  XPR to Fiat
                </Button>
              </div>
            </div>

            <Card className="glass-card border-white/10 overflow-hidden rounded-[40px] shadow-2xl relative">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12">
                <CalcIcon size={400} />
              </div>
              
              <CardContent className="p-8 md:p-14 space-y-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                  <div className="md:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                        {mode === 'fiat-to-xpr' ? 'Enter Amount' : 'Enter XPR'}
                      </label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle size={14} className="text-muted-foreground/40 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="glass-card border-white/10 text-[10px] font-bold p-3">
                            {mode === 'fiat-to-xpr' ? 'How much help do you need in your currency?' : 'How much XPR are you planning to send?'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute left-0 top-0 bottom-0 w-24 flex items-center justify-center text-3xl font-black text-primary/50 group-focus-within:text-primary transition-colors pointer-events-none">
                        {mode === 'fiat-to-xpr' ? currentSymbol : '⚡'}
                      </div>
                      <Input 
                        type="text"
                        inputMode="decimal"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="h-20 bg-white/5 border-white/10 focus:border-primary/50 text-3xl font-black pl-24 transition-all rounded-3xl"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Select Currency</label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-20 bg-white/5 border-white/10 text-xl font-black rounded-3xl focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10 max-h-[300px]">
                        {currencies.map(c => (
                          <SelectItem key={c.code} value={c.code} className="font-black py-4 hover:bg-white/5 focus:bg-white/10 rounded-2xl m-1 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs">{c.symbol}</span>
                              <span className="text-lg">{c.code}</span>
                              <span className="text-xs text-muted-foreground font-medium">— {c.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-6 py-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-white/10" />
                  <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground shadow-inner group-hover:border-primary/30 transition-colors">
                    <ArrowLeftRight size={28} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-white/10 to-white/10" />
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative p-10 md:p-14 rounded-[40px] bg-white/[0.03] border border-white/10 text-center space-y-6 shadow-2xl overflow-hidden group">
                    <div className="space-y-2">
                      <p className="text-[12px] font-black uppercase tracking-widest text-primary/70">
                        {mode === 'fiat-to-xpr' ? 'Estimated XPR Required' : 'Equivalent Fiat Value'}
                      </p>
                      <div className="flex items-center justify-center gap-6">
                        <span className="text-6xl md:text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">
                          {loading ? "..." : resultValue}
                        </span>
                        <div className="flex flex-col items-start mt-4">
                          <span className="text-2xl font-black text-primary leading-none">
                            {mode === 'fiat-to-xpr' ? 'XPR' : currency}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleCopy}
                            className="h-8 w-8 text-muted-foreground/40 hover:text-primary transition-colors mt-2"
                          >
                            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold leading-relaxed max-w-lg mx-auto">
                        <Info size={16} className="text-blue-400 shrink-0" />
                        <span className="text-foreground/80 italic">
                          {mode === 'fiat-to-xpr' 
                            ? `At current market rates, ${currentSymbol}${inputValue} is roughly equal to ${resultValue} XPR.`
                            : `Sending ${inputValue} XPR is currently worth approximately ${currentSymbol}${resultValue} in ${currency}.`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <RefreshCw size={18} className={cn("text-blue-400", loading && "animate-spin")} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Live Market Price</p>
                      <p className="text-sm font-black">
                        {loading ? "Syncing..." : `1 XPR = ${prices[currency]?.toFixed(6)} ${currency}`}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={fetchPrices}
                      disabled={loading}
                      className="h-8 w-8 rounded-lg hover:bg-white/10 ml-2"
                    >
                      <RefreshCw size={14} />
                    </Button>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button 
                      asChild
                      variant="outline" 
                      className="h-12 border-white/10 hover:bg-white/10 font-black text-xs uppercase tracking-widest px-8 rounded-2xl gap-2"
                    >
                      <a href="https://explorer.xprnetwork.org/" target="_blank" rel="noopener noreferrer">
                        Verify Price <TrendingUp size={14} />
                      </a>
                    </Button>
                    <Button 
                      asChild
                      className="h-12 bg-primary hover:bg-primary/90 text-black font-black text-xs uppercase tracking-widest px-8 rounded-2xl shadow-lg gold-glow gap-2"
                    >
                      <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                        Get XPR <ArrowRight size={14} />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              <div className="glass-card p-10 rounded-[40px] border-white/5 flex gap-6 hover:border-primary/20 transition-all group">
                <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                  <TrendingUp size={28} />
                </div>
                <div className="space-y-3">
                  <h3 className="font-black text-lg tracking-tight">Accurate Aid</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    We use mid-market rates from CoinGecko to ensure both donors and requestors get a fair value estimation for community support.
                  </p>
                </div>
              </div>
              <div className="glass-card p-10 rounded-[40px] border-white/5 flex gap-6 hover:border-emerald-500/20 transition-all group">
                <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Coins size={28} />
                </div>
                <div className="space-y-3">
                  <h3 className="font-black text-lg tracking-tight">Zero-Fee Network</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    XPR Network allows for feeless transfers. This means every single cent calculated here reaches the recipient in full.
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