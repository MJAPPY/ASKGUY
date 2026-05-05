"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Zap, Users, Trophy } from 'lucide-react';

const HowItWorks = () => {
  const features = [
    {
      icon: <ShieldCheck className="text-primary" size={20} />,
      title: "Membership Protected",
      description: "Only holders of 25,000+ GUY tokens can participate, ensuring a tight-knit, trustworthy community."
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
      description: "Hold at least 25,000 GUY tokens to access the platform."
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
            <Card key={i} className="glass-card bg-white/[0.03] border-white/5 hover:bg-white/[0.06] transition-colors h-full">
              <CardContent className="pt-8 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {feature.icon}
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
              <span className="text-5xl font-black text-white/5 group-hover:text-primary/20 transition-colors duration-500">
                {step.number}
              </span>
              <h3 className="font-bold text-xl">{step.title}</h3>
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