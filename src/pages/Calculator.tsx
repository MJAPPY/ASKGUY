"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator as CalcIcon, Coins, RefreshCw, ArrowRightLeft, TrendingUp, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const Calculator = () => {
  const [fiatAmount, setFiatAmount] = useState<string>('100');
  const [xprAmount, setXprAmount] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'NZD', symbol: 'NZ$', name: 'NZ Dollar' },
  ];

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=proton&vs_currencies=usd,eur,gbp,aud,nzd'
      );
      const data = await response.json();
      const protonPrices = data.proton;
      setPrices({
        USD: protonPrices.usd,
        EUR: protonPrices.eur,
        GBP: protonPrices.gbp,
        AUD: protonPrices.aud,
        NZD: protonPrices.nzd,
      });
    } catch (error) {
      console.error('Failed to fetch XPR prices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  useEffect(() => {
    if (prices[currency] && fiatAmount && !isNaN(parseFloat(fiatAmount))) {
      const calculated = parseFloat(fiatAmount) / prices[currency];
      setXprAmount(calculated.toLocaleString(undefined, { maximumFractionDigits: 2 }));
    } else {
      setXprAmount('0');
    }
  }, [fiatAmount, currency, prices]);

  const handleFiatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFiatAmount(value);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center">
        <div className="max-w-2xl w-full space-y-12">
          {/* Header Section */}
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center mx-auto border border-primary/20 shadow-[0_0_40px_rgba(244,201,93,0.1)]">
              <CalcIcon className="text-primary" size={40} />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">XPR Calculator</h1>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
                Calculate exactly how much XPR you need to send or request based on real-time market data.
              </p>
            </div>
          </div>

          {/* Calculator Card */}
          <Card className="glass-card border-white/10 p-8 md:p-12 relative overflow-hidden rounded-[40px] animate-in fade-in zoom-in-95 duration-1000 delay-200">
            <div className="absolute top-[-10%] right-[-10%] p-6 opacity-[0.03] pointer-events-none rotate-12">
              <TrendingUp size={300} />
            </div>
            
            <CardContent className="p-0 space-y-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Amount in Fiat</label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle size={14} className="text-muted-foreground/50 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="glass-card border-white/10 text-[10px] font-bold uppercase tracking-widest">
                          Enter the amount in your local currency
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-primary group-focus-within:scale-110 transition-transform">
                      {currencies.find(c => c.code === currency)?.symbol}
                    </div>
                    <Input 
                      type="text"
                      inputMode="decimal"
                      value={fiatAmount}
                      onChange={handleFiatChange}
                      placeholder="0.00"
                      className="h-16 bg-white/5 border-white/10 focus:border-primary/50 text-2xl font-black pl-14 transition-all rounded-2xl"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Local Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-16 bg-white/5 border-white/10 text-lg font-bold rounded-2xl focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10">
                      {currencies.map(c => (
                        <SelectItem key={c.code} value={c.code} className="font-bold py-3 hover:bg-white/5 focus:bg-white/10 rounded-xl m-1 transition-colors">
                          <span className="text-primary mr-2">{c.symbol}</span> {c.code} — {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Decorative Divider */}
              <div className="flex items-center gap-4 py-2">
                <div className="h-[1px] flex-1 bg-white/5" />
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground shadow-inner">
                  <ArrowRightLeft size={24} className="opacity-50" />
                </div>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>

              {/* Result Area */}
              <div className="p-10 rounded-[32px] bg-primary/5 border border-primary/20 text-center space-y-3 shadow-[inset_0_0_30px_rgba(244,201,93,0.05)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="text-[11px] font-black uppercase tracking-widest text-primary/80 relative z-10">Estimated Help Required</p>
                <div className="flex items-center justify-center gap-4 relative z-10">
                  <span className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-md">
                    {loading ? "..." : xprAmount}
                  </span>
                  <span className="text-2xl font-black text-primary mt-2">XPR</span>
                </div>
                <div className="pt-2 relative z-10">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Sparkles size={12} className="animate-pulse" /> Live Market Rate
                  </div>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <RefreshCw size={14} className={cn("text-blue-400", loading && "animate-spin")} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Current Exchange Rate</p>
                    <p className="text-xs font-bold">1 XPR = {loading ? "Fetching..." : `${prices[currency]?.toFixed(6)} ${currency}`}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchPrices}
                    disabled={loading}
                    className="h-10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 gap-2 px-4 rounded-xl border border-white/5"
                  >
                    Refresh Rates
                  </Button>
                  <Button 
                    asChild
                    variant="outline" 
                    size="sm" 
                    className="h-10 text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-primary hover:text-black transition-all px-4 rounded-xl"
                  >
                    <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                      Buy XPR
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
             <div className="glass-card p-8 rounded-[32px] border-white/5 flex items-start gap-5 group hover:border-blue-500/30 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <TrendingUp size={24} />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Market Source</p>
                  <p className="text-sm font-bold text-foreground/90 leading-relaxed">
                    Live pricing is synchronized with <span className="text-blue-400">CoinGecko</span> for maximum accuracy across all regions.
                  </p>
                </div>
             </div>
             <div className="glass-card p-8 rounded-[32px] border-white/5 flex items-start gap-5 group hover:border-emerald-500/30 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Coins size={24} />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Community Impact</p>
                  <p className="text-sm font-bold text-foreground/90 leading-relaxed">
                    XPR Network allows for <span className="text-emerald-400">instant, zero-fee</span> transfers, meaning 100% of help reaches the recipient.
                  </p>
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