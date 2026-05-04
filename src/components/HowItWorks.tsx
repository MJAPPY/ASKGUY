"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Users, Zap, HeartHandshake } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <ShieldCheck className="text-primary" size={24} />,
      title: "Verify",
      description: "Hold 25k GUY tokens and activate membership to ensure a committed community."
    },
    {
      icon: <Users className="text-primary" size={24} />,
      title: "Request",
      description: "Post your bill with proof. The community reviews and supports verified needs."
    },
    {
      icon: <Zap className="text-primary" size={24} />,
      title: "Direct Aid",
      description: "Funds go directly from donor to requester. No middleman, no fees."
    },
    {
      icon: <HeartHandshake className="text-primary" size={24} />,
      title: "Complete",
      description: "Once funded, mark as completed to show the community the impact made."
    }
  ];

  return (
    <section className="py-12 border-t border-white/5">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2">How it Works</h2>
        <p className="text-muted-foreground">Transparent, peer-to-peer support on the XPR Network.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <Card key={i} className="glass-card border-none bg-white/5 hover:bg-white/10 transition-colors">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                {step.icon}
              </div>
              <h3 className="font-bold text-lg">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;