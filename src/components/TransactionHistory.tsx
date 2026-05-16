"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History, ArrowUpRight, ArrowDownLeft, PlusCircle, CheckCircle2, Heart } from 'lucide-react';
import { useRequests } from '@/hooks/use-requests';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TransactionHistoryProps {
  userAddress?: string;
}

const TransactionHistory = ({ userAddress }: TransactionHistoryProps) => {
  const { requests } = useRequests();

  const transactions = useMemo(() => {
    if (!userAddress) return [];
    
    const list: any[] = [];
    const addr = userAddress.toLowerCase().trim();

    requests.forEach(req => {
      // 1. Check if user posted this request
      if (req.requestor.toLowerCase().trim() === addr) {
        list.push({
          id: `post-${req.id}`,
          type: 'request',
          amount: req.amount,
          token: req.token,
          title: req.title,
          timestamp: req.timestamp,
          status: req.status
        });

        // Add "Completed" event if it is completed
        if (req.status === 'Completed') {
          list.push({
            id: `complete-${req.id}`,
            type: 'completed',
            title: req.title,
            timestamp: req.timestamp + 1000, // Small offset
          });
        }
      }

      // 2. Check contributions
      req.contributions.forEach(c => {
        const contributor = c.user.toLowerCase().trim();
        const requestor = req.requestor.toLowerCase().trim();

        // User sent help
        if (contributor === addr) {
          list.push({
            id: `sent-${c.id}`,
            type: 'sent',
            amount: c.amount,
            token: c.token,
            target: req.requestor,
            timestamp: c.timestamp,
          });
        }

        // User received help
        if (requestor === addr && contributor !== addr) {
          list.push({
            id: `received-${c.id}`,
            type: 'received',
            amount: c.amount,
            token: c.token,
            from: c.user,
            timestamp: c.timestamp,
          });
        }
      });
    });

    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
  }, [requests, userAddress]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'sent': return <ArrowUpRight className="text-rose-400" size={16} />;
      case 'received': return <ArrowDownLeft className="text-emerald-400" size={16} />;
      case 'request': return <PlusCircle className="text-blue-400" size={16} />;
      case 'completed': return <CheckCircle2 className="text-emerald-400" size={16} />;
      default: return <History size={16} />;
    }
  };

  return (
    <Card className="glass-card border-white/5 rounded-[32px] overflow-hidden">
      <CardHeader className="border-b border-white/5 bg-white/[0.01] px-6 py-4">
        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <History size={14} className="text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length > 0 ? (
          <div className="divide-y divide-white/5">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {getIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm font-bold text-white/90 leading-tight">
                    {tx.type === 'sent' && (
                      <>Sent <span className="text-rose-400">{tx.amount.toLocaleString()} {tx.token}</span> to @{tx.target}</>
                    )}
                    {tx.type === 'received' && (
                      <>Received <span className="text-emerald-400">{tx.amount.toLocaleString()} {tx.token}</span> from @{tx.from}</>
                    )}
                    {tx.type === 'request' && (
                      <>Posted request for <span className="text-blue-400">{tx.amount.toLocaleString()} {tx.token}</span></>
                    )}
                    {tx.type === 'completed' && (
                      <>Successfully completed "{tx.title}"</>
                    )}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                    </p>
                    {tx.type === 'request' && (
                      <span className={cn(
                        "text-[9px] font-black uppercase px-1.5 py-0.5 rounded border",
                        tx.status === 'Open' ? "text-primary border-primary/20 bg-primary/5" : "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                      )}>
                        {tx.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/10 mb-4">
              <History size={32} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No activity history</p>
            <p className="text-[9px] text-muted-foreground/60 font-medium mt-1">Interactions with the platform will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;