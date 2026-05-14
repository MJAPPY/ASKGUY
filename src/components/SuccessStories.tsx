"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, Star } from 'lucide-react';

const SuccessStories = () => {
  const stories = [
    {
      name: "Sarah J.",
      handle: "sarah_x.xpr",
      text: "The community helped me cover my utility bill during a tough month. I'm so grateful for the GUY family!",
      category: "Utilities"
    },
    {
      name: "Marcus T.",
      handle: "m_tech.xpr",
      text: "I was able to get my textbooks for the semester thanks to direct aid from fellow members. Truly peer-to-peer.",
      category: "Education"
    },
    {
      name: "Elena R.",
      handle: "elena_dev.xpr",
      text: "When my cat needed emergency surgery, the AskGuy community stepped up in hours. Transparent and fast.",
      category: "Medical"
    }
  ];

  return (
    <section className="py-12">
      <div className="flex items-center gap-2 mb-8">
        <Star className="text-primary fill-primary" size={24} />
        <h2 className="text-3xl font-bold">Success Stories</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stories.map((story, i) => (
          <Card key={i} className="glass-card border-none bg-white/5 relative overflow-hidden">
            <Quote className="absolute -top-2 -right-2 text-primary/10 w-20 h-20 -rotate-12" />
            <CardContent className="pt-8 pb-6">
              <p className="text-sm italic text-foreground/90 mb-6 leading-relaxed">
                "{story.text}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{story.name}</p>
                  <p className="text-[10px] text-muted-foreground">{story.handle}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">
                  {story.category}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default SuccessStories;
＜/dyad-write>

<dyad-write path="src/components/HowItWorks.tsx" description="Add missing import for Card component">
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Zap, Users, Trophy } from 'lucide-react';

const HowItWorks = () => {
  const features = [
    {
      icon: <ShieldCheck className="text-primary" size={20} />,
      title: "Membership Protected",
      description: "Only holders of 7,770+ GUY tokens can participate, ensuring a tight-knit, trustworthy community."
    },
    {
      icon: <Zap className="text-primary" size={20} />,
      title: "Instant XPR Transfers",
      description: "Help flows directly on-chain. No middlemen, no delays — XPR lands in the recipient's wallet immediately."
    },
    {
      icon: <Users className="text-primary" size={20} />,
      title: "Community Requests",
      description: "Post your needs and let the community respond. Medical bills, rent, utilities — real help for real life."
    },
    {
      icon: <Trophy className="text-primary" size={20} />,
      title: "Leaderboard",
      description: "The most generous members earn recognition. Top helpers are celebrated on our public leaderboard."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Connect Your Wallet",
      description: "Use Proton WebAuth to securely connect your XPR Network wallet."
    },
    {
      number: "02",
      title: "Verify Membership",
      description: "Hold at least 7,770 GUY tokens to access the platform."
    },
    {
      number: "03",
      title: "Post or Browse",
      description: "Share your needs or find someone to help today."
    },
    {
      number: "04",
      title: "Send XPR Directly",
      description: "One click and XPR is on its way. Transparent, on-chain."
    }
  ];

  return (
    <div className="space-y-32 py-20">
      {/* Why AskGuy Section */}
      <section>
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">Why AskGuy?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A platform built on trust, transparency, and the XPR Network ecosystem.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <Card key={i} className="glass-card bg-white/[0.03] border-white/5 hover:bg-white/[0.06] transition-all duration-300 h-full group">
              <CardContent className="pt-8 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                  <div className="transition-all duration-300 group-hover:brightness-150 group-hover:scale-110">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="font-bold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section>
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">How It Works</h2>
          <p className="text-muted-foreground">Get started in four simple steps.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {steps.map((step, i) => (
            <div key={i} className="space-y-4 group">
              <span className="text-5xl font-black text-white/5 group-hover:text-primary/20 transition-all duration-500 block transform group-hover:-translate-y-1">
                {step.number}
              </span>
              <h3 className="font-bold text-xl group-hover:text-primary transition-colors">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
＜/dyad-write>

＜dyad-write path="src/components/CommunityStats.tsx" description="Add missing import for Card component">
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Users, CheckCircle2, Heart } from 'lucide-react';

const CommunityStats = () => {
  const stats = [
    {
      label: "Total Help Provided",
      value: "142,500 XPR",
      icon: <Coins className="text-emerald-400" size={20} />,
      borderColor: "border-emerald-500/20",
      description: "Directly to community members"
    },
    {
      label: "Bills Fully Funded",
      value: "342",
      icon: <CheckCircle2 className="text-blue-400" size={20} />,
      borderColor: "border-blue-500/20",
      description: "100% success rate"
    },
    {
      label: "Active Members",
      value: "1,204",
      icon: <Users className="text-purple-400" size={20} />,
      borderColor: "border-purple-500/20",
      description: "Verified GUY holders"
    },
    {
      label: "Total Contributors",
      value: "856",
      icon: <Heart className="text-rose-400" size={20} />,
      borderColor: "border-rose-500/20",
      description: "Unique donors this month"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <Card key={i} className={`glass-card ${stat.borderColor} overflow-hidden relative group cursor-default transition-all duration-500 hover:translate-y-[-2px]`}>
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-60 transition-opacity duration-500">
            {stat.icon}
          </div>
          <CardContent className="p-5 relative z-10">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{stat.value}</h3>
            <p className="text-[10px] text-muted-foreground/70 font-medium">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CommunityStats;
＜/dyad-write>

＜dyad-write path="src/components/LiveTicker.tsx" description="Add missing import for Card component">
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Zap } from 'lucide-react';
import { useRequests } from '@/hooks/use-requests';

const LiveTicker = () => {
  const { requests } = useRequests();

  const recentDonations = useMemo(() => {
    return requests
      .flatMap(req => req.contributions.map(c => ({ ...c, target: req.requestor })))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [requests]);

  if (recentDonations.length === 0) return null;

  return (
    <div className="w-full bg-primary/5 border-y border-primary/10 py-2 overflow-hidden whitespace-nowrap relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
      
      <div className="inline-block animate-marquee">
        {recentDonations.map((donation, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-8 text-[10px] font-black uppercase tracking-widest">
            <Heart size={12} className="text-primary fill-primary" />
            <span className="text-primary">{donation.user}</span>
            <span className="text-muted-foreground">SENT</span>
            <span className="text-white">{donation.amount} {donation.token}</span>
            <span className="text-muted-foreground">TO</span>
            <span className="text-blue-400">{donation.target}</span>
          </span>
        ))}
      </div>
      
      {/* Duplicate for seamless loop */}
      <div className="inline-block animate-marquee">
        {recentDonations.map((donation, i) => (
          <span key={`dup-${i}`} className="inline-flex items-center gap-2 mx-8 text-[10px] font-black uppercase tracking-widest">
            <Heart size={12} className="text-primary fill-primary" />
            <span className="text-primary">{donation.user}</span>
            <span className="text-muted-foreground">SENT</span>
            <span className="text-white">{donation.amount} {donation.token}</span>
            <span className="text-muted-foreground">TO</span>
            <span className="text-blue-400">{donation.target}</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LiveTicker;
＜/dyad-write>

＜dyad-write path="src/components/CTASection.tsx" description="Add missing import for Card component">
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';

const CTASection = () => {
  const { connect, isConnecting } = useWallet();

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto glass-card rounded-3xl p-12 text-center space-y-8 border-primary/20 bg-primary/5 relative overflow-hidden">
        <div className="flex justify-center">
          <Heart className="text-primary fill-primary animate-pulse" size={48} />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to help or be helped?</h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Join the AskGuy community today. Hold 7,770 GUY and start making a difference.
          </p>
        </div>

        <Button 
          onClick={connect}
          disabled={isConnecting}
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-black font-bold rounded-xl gold-glow flex gap-2 mx-auto"
        >
          {isConnecting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <Heart size={18} className="fill-black" />
              Get Started
            </>
          )}
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
＜/dyad-write>

＜dyad-write path="src/components/AccessDenied.tsx" description="Add missing import for Card component">
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert, LogOut, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';

const AccessDenied = () => {
  const { guyBalance, disconnect, refreshBalances, isFetchingBalances, address } = useWallet();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-md w-full glass-card rounded-[32px] p-12 text-center space-y-8 border-red-500/30 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <ShieldAlert className="text-red-500" size={48} />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-white">Access Restricted</h1>
          <p className="text-red-400 font-black uppercase tracking-widest text-xs">@{address}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The AskGuy community is exclusive to members who support the ecosystem. You need at least <span className="text-white font-bold">7,770 GUY</span> tokens in your wallet to enter.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button 
            asChild 
            variant="outline"
            className="w-full h-14 border-white/10 hover:bg-white/5 font-bold gap-3"
          >
            <a href="</think><dyad-write path="src/components/ActivityFeed.tsx" description="Fix syntax error with Card import and ensure proper JSX">
"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Heart, PlusCircle, CheckCircle2, Zap } from 'lucide-react';
import { useRequests } from '@/hooks/use-requests';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = () => {
  const { requests } = useRequests();

  const activities = useMemo(() => {
    const list: any[] = [];

    requests.forEach(req => {
      list.push({
        id: `post-${req.id}`,
        type: 'request',
        user: req.requestor,
        category: req.category,
        amount: `${req.amount} ${req.token}`,
        time: req.timestamp,
      });

      req.contributions.forEach(c => {
        list.push({
          id: `contrib-${c.id}`,
          type: 'contribution',
          user: c.user,
          target: req.requestor,
          amount: `${c.amount} ${c.token}`,
          time: c.timestamp,
        });
      });

      if (req.status === 'Completed') {
        const completionTime = req.contributions.length > 0 
          ? Math.max(...req.contributions.map(c => c.timestamp))
          : req.timestamp;

        list.push({
          id: `complete-${req.id}`,
          type: 'completed',
          user: req.requestor,
          time: completionTime + 1,
        });
      }
    });

    return list
      .sort((a, b) => b.time - a.time)
      .slice(0, 8);
  }, [requests]);

  const latestId = activities.length > 0 ? activities[0].id : null;

  return (
    <Card className="glass-card border-white/5 overflow-hidden">
      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="text-sm font-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <span>LIVE ACTIVITY</span>
          </div>
          <Zap size={12} className="text-primary animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const isLatest = activity.id === latestId;
              return (
                <div 
                  key={activity.id} 
                  className={`flex gap-3 items-start p-4 transition-all duration-500 relative group ${
                    isLatest 
                      ? 'bg-blue-500/[0.03] shadow-[inset_4px_0_0_0_#60a5fa]' 
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {isLatest && (
                    <div className="absolute inset-0 bg-blue-400/5 blur-xl pointer-events-none animate-pulse" />
                  )}
                  
                  <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-110 ${
                    activity.type === 'contribution' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    activity.type === 'request' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {activity.type === 'contribution' ? <Heart size={14} className="fill-current" /> :
                     activity.type === 'request' ? <PlusCircle size={14} /> :
                     <CheckCircle2 size={14} />}
                  </div>
                  
                  <div className="flex-1 min-w-0 z-10">
                    <p className="text-xs leading-normal">
                      <span className="font-black text-foreground hover:text-blue-400 transition-colors cursor-pointer">{activity.user}</span>
                      {activity.type === 'contribution' && (
                        <span className="text-muted-foreground"> contributed <span className="text-primary font-bold">{activity.amount}</span> to <span className="text-blue-400 font-bold">{activity.target}</span></span>
                      )}
                      {activity.type === 'request' && (
                        <span className="text-muted-foreground"> posted a new <span className="text-red-400 font-bold">{activity.category.split(' ')[0]}</span> request</span>
                      )}
                      {activity.type === 'completed' && (
                        <span className="text-muted-foreground"> marked their request as <span className="text-emerald-400 font-bold">COMPLETED</span></span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-bold flex items-center gap-1 uppercase tracking-tighter">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      {formatDistanceToNow(activity.time, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-8">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;