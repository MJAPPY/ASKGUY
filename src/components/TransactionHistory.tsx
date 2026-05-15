"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';

const TransactionHistory = () => {
  const transactions: any[] = [];

  return (
    <Card className="glass-card border-white/5">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {/* Transaction mapping would go here */}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/20">
              <History size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No recent transactions</p>
              <p className="text-[9px] text-muted-foreground/60 font-medium">Your on-chain activity will appear here.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;