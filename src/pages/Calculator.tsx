"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator as CalcIcon, Coins, RefreshCw, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    if (prices[currency] && fiatAmount) {
      const calculated = parseFloat(fiatAmount) / prices[currency];
      setXprAmount(calculated.toLocaleString(undefined, { maximumFractionDigits: 2 }));
    } else {
      setXprAmount('0');
    }
  }, [fiatAmount, currency, prices]);

  const handleFiatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setFiatAmount(value);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
              <CalcIcon className="text-primary" size={32} />
            </div>
            <h1 className="text-4xl font-black tracking-tight">XPR Calculator</h1>
            <p className="text-muted-foreground">Convert fiat currencies to XPR based on live market rates.</p>
          </div>

          <Card className="glass-card border-white/10 p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <TrendingUp size={120} />
            </div>
            
            <CardContent className="p-0 space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount in Fiat</label>
                  <div className="relative">
                    <Input 
                      type="text"
                      value={fiatAmount}
                      onChange={handleFiatChange}
                      className="h-14 bg-white/5 border-white/10 text-xl font-black pl-12"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-primary">
                      {currencies.find(c => c.code === currency)?.symbol}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-14 bg-white/5 border-white/10 text-lg font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      {currencies.map(c => (
                        <SelectItem key={c.code} value={c.code} className="font-bold">
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground">
                  <ArrowRightLeft size={20} />
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Estimated XPR Needed</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-black text-white">{xprAmount}</span>
                  <span className="text-xl font-black text-primary">XPR</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  Rate: 1 XPR = {prices[currency]?.toFixed(6)} {currency}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchPrices}
                  disabled={loading}
                  className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5 gap-2"
                >
                  Update Prices
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="glass-card p-6 rounded-2xl border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Data</p>
                  <p className="text-sm font-bold">Prices synced from CoinGecko</p>
                </div>
             </div>
             <div className="glass-card p-6 rounded-2xl border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Coins size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">XPR Network</p>
                  <p className="text-sm font-bold">Fast, zero-fee help.</p>
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