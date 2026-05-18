"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Leaderboard from '@/components/Leaderboard';
import { Trophy, Star, ArrowLeft, Heart, Share2, Gift, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { useRequests } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';

const LeaderboardPage = () => {
  const { requests } = useRequests();
  const { leaderboardLikes, incrementLikes } = useWallet();
  const [hasLiked, setHasLiked] = useState(false);

  // Check if user has liked in this session
  useEffect(() => {
    const localLiked = localStorage.getItem('askguy_liked_leaderboard');
    if (localLiked) setHasLiked(true);
  }, []);

  const totalXPRGiven = useMemo(() => {
    return requests.reduce((total, req) => {
      const xprContribs = req.contributions
        .filter(c => c.token === 'XPR')
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      return total + xprContribs;
    }, 0);
  }, [requests]);

  const handleLike = async () => {
    if (!hasLiked) {
      setHasLiked(true);
      localStorage.setItem('askguy_liked_leaderboard', 'true');
      await incrementLikes();
      showSuccess("Thanks for showing support!");
    }
  };

  const handleShare = async () => {
    // Using the verified production domain for the share link
    const productionUrl = window.location.origin.includes('localhost') 
      ? 'https://askguy.vercel.app'
      : window.location.origin;

    const shareData = {
      title: 'AskGuy Hall of Fame',
      text: `Join the movement! Over ${totalXPRGiven.toLocaleString()} XPR has been gifted in the AskGuy community. Check out our Top Contributors! 💎✨`,
      url: `${productionUrl}/leaderboard`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n\nView here: ${shareData.url}`);
        showSuccess("Link and impact total copied to clipboard!");
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        showError("Could not share leaderboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-12">
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
              
              <div className="flex flex-wrap gap-3">
                <div className="text-center px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Given</p>
                  <p className="text-xl font-black text-primary">{totalXPRGiven.toLocaleString()} XPR</p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleLike}
                    variant="outline"
                    className={`h-auto py-3 px-6 rounded-2xl border-white/10 transition-all gap-3 ${hasLiked ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    <div className="flex flex-col items-start">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5">Show Support</p>
                      <div className="flex items-center gap-2">
                        <Heart size={18} className={hasLiked ? 'fill-primary' : ''} />
                        <span className="text-lg font-black">{leaderboardLikes.toLocaleString()}</span>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    onClick={handleShare}
                    variant="outline"
                    className="h-auto py-3 px-4 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
                    title="Share Leaderboard"
                  >
                    <Share2 size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Leaderboard limit={100} />
            </div>
            
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-3xl border-blue-500/30 bg-blue-500/10 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Gift size={80} className="text-blue-400" />
                </div>
                <div className="flex items-center gap-3 text-blue-400 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Zap size={20} className="fill-blue-400" />
                  </div>
                  <h3 className="font-black text-xl">Quarterly Rewards</h3>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed relative z-10 font-medium">
                  The <span className="text-blue-400 font-black">top 5 quarterly contributors</span> will share a dedicated <span className="text-white font-black">$GUY token pool</span> as a thank you for their immense impact.
                </p>
                <div className="pt-2 relative z-10">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 w-fit">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Status: Active</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-3xl border-primary/20 bg-primary/5 space-y-6 sticky top-24">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Star size={20} className="fill-primary" />
                  </div>
                  <h3 className="font-black text-xl">How to Rank?</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Rankings are based on the total amount of XPR contributed to community requests. Every gift counts towards your standing in the Hall of Fame.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs">1</div>
                    <p className="text-xs font-medium">Connect your WebAuth wallet</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs">2</div>
                    <p className="text-xs font-medium">Browse active requests</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs">3</div>
                    <p className="text-xs font-medium">Contribute XPR or GUY</p>
                  </div>
                </div>
                <Button asChild className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-black rounded-xl gold-glow">
                  <Link to="/">Start Helping Today</Link>
                </Button>
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