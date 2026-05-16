"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Users, CheckCircle2, Heart, Loader2 } from 'lucide-react';
import { useRequests } from '@/hooks/use-requests';
import { supabase } from '@/integrations/supabase/client';

const CommunityStats = () => {
  const { requests, loading: requestsLoading } = useRequests();
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Fetch real profile count from database
  useEffect(() => {
    const fetchMemberCount = async () => {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          setMemberCount(count);
        }
      } catch (err) {
        console.error("Error fetching member count:", err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMemberCount();
  }, []);

  const calculatedStats = useMemo(() => {
    let totalXPR = 0;
    let fundedCount = 0;
    const contributors = new Set<string>();

    requests.forEach(req => {
      // Count funded/completed bills
      if (req.status === 'Funded' || req.status === 'Completed' || req.raised >= req.amount) {
        fundedCount++;
      }

      // Sum all XPR contributions and track unique users
      req.contributions.forEach(c => {
        if (c.token === 'XPR') {
          totalXPR += c.amount;
        }
        contributors.add(c.user.toLowerCase().trim());
      });
    });

    return {
      totalXPR,
      fundedCount,
      uniqueContributors: contributors.size
    };
  }, [requests]);

  const stats = [
    {
      label: "Total Help Provided",
      value: `${calculatedStats.totalXPR.toLocaleString()} XPR`,
      icon: <Coins className="text-emerald-400" size={20} />,
      borderColor: "border-emerald-500/20",
      description: "Directly to community members",
      loading: requestsLoading
    },
    {
      label: "Bills Fully Funded",
      value: calculatedStats.fundedCount.toString(),
      icon: <CheckCircle2 className="text-blue-400" size={20} />,
      borderColor: "border-blue-500/20",
      description: "Needs met by the community",
      loading: requestsLoading
    },
    {
      label: "Verified Members",
      value: memberCount !== null ? memberCount.toString() : "...",
      icon: <Users className="text-purple-400" size={20} />,
      borderColor: "border-purple-500/20",
      description: "Registered community profiles",
      loading: loadingMembers
    },
    {
      label: "Total Contributors",
      value: calculatedStats.uniqueContributors.toString(),
      icon: <Heart className="text-rose-400" size={20} />,
      borderColor: "border-rose-500/20",
      description: "Unique generous donors",
      loading: requestsLoading
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
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5">{stat.label}</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-white mb-1 tracking-tight">
                {stat.loading ? <Loader2 size={20} className="animate-spin text-muted-foreground/30" /> : stat.value}
              </h3>
            </div>
            <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-tighter">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CommunityStats;