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
  Info,
  Zap,
  Repeat,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { showSuccess } from '@/utils/toast';
import guyLogo from '@/assets/guy-logo.jpg';

type CalculationMode = 'fiat-to-xpr' | 'xpr-to-fiat' | 'guy-swap';

const Calculator = () => {
  const [mode, setMode] = useState<CalculationMode>('guy-swap'); 
  const [inputValue, setInputValue] = useState<string>('1,000,000');
  const [resultValue, setResultValue] = useState<string>('');
  const [secondaryResult, setSecondaryResult] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [guyPriceXpr, setGuyPriceXpr] = useState<number>(0.0000305); 
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

      const alcorRes = await fetch('https://proton.alcor.exchange/api/v2/tickers');
      const tickers = await alcorRes.json();
      
      const guyTicker = tickers.find((t: any) => 
        (t.base_currency === 'GUY' && t.quote_currency === 'XPR') ||
        (t.ticker_id === 'GUY_XPR')
      );
      
      if (guyTicker && guyTicker.last_price) {
        const price = parseFloat(guyTicker.last_price);
        if (price > 0 && price < 0.1) { 
          setGuyPriceXpr(price);
        }
      }
    } catch (error) {
      console.error('Failed to fetch live prices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  useEffect(() => {
    const rate = prices[currency];
    const rawInput = inputValue.replace(/,/g, '');
    if (!rawInput || isNaN(parseFloat(rawInput))) {
      setResultValue('0');
      setSecondaryResult('0');
      return;
    }

    const val = parseFloat(rawInput);
    if (mode === 'fiat-to-xpr' && rate) {
      const calculated = val / rate;
      setResultValue(Math.round(calculated).toLocaleString());
    } else if (mode === 'xpr-to-fiat' && rate) {
      const calculated = val * rate;
      setResultValue(calculated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else if (mode === 'guy-swap') {
      const xprValue = val * guyPriceXpr;
      setResultValue(xprValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }));
      
      const usdRate = prices[currency] || 0.003;
      const fiatValue = xprValue * usdRate;
      setSecondaryResult(fiatValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  }, [inputValue, currency, prices, mode, guyPriceXpr]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      const parts = rawValue.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      setInputValue(parts.join('.'));
    }
  };

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val.replace(/,/g, ''));
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
              <Sparkles size={10} className="animate-pulse" /> Live Market Data
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
              <span className="text-primary drop-shadow-[0_0_15px_rgba(244,201,93,0.2)] uppercase italic">AskGuy Calculator</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed font-medium">
              Calculate instant conversions between GUY, XPR, and Global Fiat.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 animate-in fade-in zoom-in-95 duration-1000 delay-200">
            <div className="flex justify-center">
              <div className="bg-white/5 border border-white/10 p-1.5 rounded-2xl flex gap-1.5">
                <Button 
                  variant={mode === 'fiat-to-xpr' ? 'default' : 'ghost'}
                  onClick={() => setMode('fiat-to-xpr')}
                  className={cn(
                    "rounded-xl font-black text-[9px] uppercase tracking-widest h-10 px-4 transition-all",
                    mode === 'fiat-to-xpr' ? "bg-primary text-black shadow-lg" : "text-muted-foreground hover:text-white"
                  )}
                >
                  Fiat ⇆ XPR
                </Button>
                <Button 
                  variant={mode === 'guy-swap' ? 'default' : 'ghost'}
                  onClick={() => setMode('guy-swap')}
                  className={cn(
                    "rounded-xl font-black text-[9px] uppercase tracking-widest h-10 px-4 transition-all",
                    mode === 'guy-swap' ? "bg-[#1565C0] text-white shadow-[0_0_20px_rgba(21,101,192,0.3)]" : "text-muted-foreground hover:text-white"
                  )}
                >
                  GUY ⇆ Assets
                </Button>
              </div>
            </div>

            <Card className="glass-card border-white/10 overflow-hidden rounded-[32px] shadow-2xl relative">
              <CardContent className="p-6 md:p-10 space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                  <div className="md:col-span-7 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {mode === 'fiat-to-xpr' ? 'Enter Amount' : mode === 'xpr-to-fiat' ? 'Enter XPR' : 'Enter GUY Amount'}
                    </label>
                    <div className="relative group">
                      <div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center text-2xl font-black text-primary/50 group-focus-within:text-primary transition-colors pointer-events-none">
                        {mode === 'guy-swap' ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 bg-black/40">
                            <img src={guyLogo} alt="GUY" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span>{mode === 'fiat-to-xpr' ? currentSymbol : '⚡'}</span>
                        )}
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currency Context</label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-16 bg-white/5 border-white/10 text-lg font-black rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        {currencies.map(c => (
                          <SelectItem key={c.code} value={c.code} className="font-black">
                            {c.code} — {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {mode !== 'guy-swap' ? (
                    <div className="relative p-8 md:p-10 rounded-[32px] bg-white/[0.03] border border-white/10 text-center space-y-4 shadow-2xl">
                      <p className="text-[11px] font-black uppercase tracking-widest text-primary/70">Estimated {mode === 'fiat-to-xpr' ? 'XPR' : 'Fiat'} Value</p>
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-5xl md:text-6xl font-black text-white tracking-tighter tabular-nums">
                          {loading ? "..." : resultValue}
                        </span>
                        <span className="text-xl font-black text-primary uppercase">{mode === 'fiat-to-xpr' ? 'XPR' : currency}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(resultValue)} className="h-8 w-8 text-muted-foreground/40 hover:text-primary">
                          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="relative p-6 rounded-[28px] bg-white/[0.03] border border-white/10 space-y-2">
                         <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Estimated XPR</p>
                         <div className="flex items-end justify-between">
                            <span className="text-2xl md:text-3xl font-black text-white tabular-nums">{resultValue}</span>
                            <span className="text-[10px] font-black text-blue-400 mb-1">XPR</span>
                         </div>
                       </div>
                       <div className="relative p-6 rounded-[28px] bg-white/[0.03] border border-white/10 space-y-2">
                         <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Estimated Value</p>
                         <div className="flex items-end justify-between">
                            <span className="text-2xl md:text-3xl font-black text-white tabular-nums">{currentSymbol}{secondaryResult}</span>
                            <span className="text-[10px] font-black text-emerald-400 mb-1">{currency}</span>
                         </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                  <button 
                    onClick={() => fetchPrices()}
                    disabled={loading}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                  >
                    <RefreshCw size={14} className={cn("text-blue-400 transition-transform group-hover:rotate-180", loading && "animate-spin")} />
                    <div className="text-left space-y-0">
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground leading-none">Live DEX Data (Auto-update)</p>
                      <p className="text-[11px] font-black">
                        {mode === 'guy-swap' ? `1 GUY ≈ ${guyPriceXpr.toFixed(6)} XPR` : `1 XPR = ${prices[currency]?.toFixed(6)} ${currency}`}
                      </p>
                    </div>
                  </button>
                  
                  <div className="flex gap-3">
                    {mode === 'guy-swap' && (
                      <Button asChild variant="outline" className="h-10 border-white/10 hover:bg-white/10 font-black text-[9px] uppercase tracking-widest px-6 rounded-xl gap-2">
                        <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                          Trade on Vibrr <ExternalLink size={12} />
                        </a>
                      </Button>
                    )}
                    <Button asChild className="h-11 bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-wider px-8 rounded-xl shadow-[0_0_25px_rgba(244,201,93,0.3)] gold-glow gap-3 border-none group">
                      <a href="https://alcor.exchange/v/xpr/swap?input=xpr-eosio.token&output=guy-vtoken" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        Swap Assets
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
              <div className="glass-card p-6 rounded-[28px] border-white/5 flex gap-4 hover:border-primary/20 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                  <Repeat size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-base tracking-tight">Fair Market Estimates</h3>
                  <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                    Estimates are pulled directly from Alcor DEX and CoinGecko every minute to provide real-world accuracy.
                  </p>
                </div>
              </div>
              <div className="glass-card p-6 rounded-[28px] border-white/5 flex gap-4 hover:border-blue-500/20 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-[#1565C0]/10 flex items-center justify-center text-[#1565C0] border border-[#1565C0]/20 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-base tracking-tight">XPR Network Ready</h3>
                  <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                    Direct access to the ecosystem's most reliable decentralized liquidity pools.
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