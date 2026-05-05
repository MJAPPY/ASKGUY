"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  to_from: string;
  date: string;
  status: string;
}

const TransactionHistory = () => {
  const transactions: Transaction[] = [
    { id: 'tx_1', type: 'sent', amount: 1500, to_from: '@tripseven', date: '2024-03-15', status: 'Confirmed' },
    { id: 'tx_2', type: 'sent', amount: 50, to_from: 'alice.xpr', date: '2024-03-14', status: 'Confirmed' },
    { id: 'tx_3', type: 'received', amount: 450, to_from: 'helper.xpr', date: '2024-03-10', status: 'Confirmed' },
    { id: 'tx_4', type: 'sent', amount: 100, to_from: 'bob.xpr', date: '2024-03-08', status: 'Confirmed' },
  ];

  return (
    <Card className="glass-card border-white/5">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'sent' ? 'bg-orange-500/10 text-orange-400' : 'bg-primary/10 text-primary'
                }`}>
                  {tx.type === 'sent' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                </div>
                <div>
                  <p className="text-sm font-bold">
                    {tx.type === 'sent' ? 'Sent to' : 'Received from'} {tx.to_from}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{tx.date} • {tx.status}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <p className={`font-bold ${tx.type === 'sent' ? 'text-foreground' : 'text-primary'}`}>
                  {tx.type === 'sent' ? '-' : '+'}{tx.amount} XPR
                </p>
                <ExternalLink size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;