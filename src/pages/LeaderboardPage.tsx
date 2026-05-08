"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Leaderboard from '@/components/Leaderboard';
import { Trophy, Medal, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const LeaderboardPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="space-y-4">
            <Button variant="ghost" asChild className="-ml-2 text-muted-foreground hover:text-primary">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Dashboard
              </Link>
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Trophy className="text-primary" size={28} />
                  </div>
                  <h1 className="text-4xl font-black tracking-tight">Top Contributors</h1>
                </div>
                <p className="text-muted-foreground text-lg max-w-xl">
                  Celebrating the most generous members of the AskGuy community. Your support makes a real difference.
                </p>
              </div>
              
              <div className="flex gap-4">
                <div className="text-center px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Given</p>
                  <p className="text-xl font-black text-primary">142,500 XPR</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Leaderboard />
            </div>
            
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border-primary/20 bg-primary/5 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Star size={18} className="fill-primary" />
                  <h3 className="font-bold">How to Rank?</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Rankings are based on the total amount of XPR contributed to community requests. Help others to climb the leaderboard!
                </p>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-black font-bold">
                  <Link to="/">Start Helping</Link>
                </Button>
              </div>

              <div className="glass-card p-6 rounded-2xl border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <Medal size={18} />
                  <h3 className="font-bold">Badges</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Coming soon: Earn unique NFT badges for reaching contribution milestones.
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

export default LeaderboardPage;