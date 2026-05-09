"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, AlertCircle, Heart, Zap, Scale, Info, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Guidelines = () => {
  const sections = [
    {
      icon: <ShieldCheck className="text-emerald-400" size={24} />,
      title: "Membership & Eligibility",
      content: [
        "To participate in the AskGuy community, users must hold a minimum of 7,770 GUY tokens in their WebAuth wallet.",
        "To post a request, a yearly membership fee of 2,500 XPR is required. This fee supports platform maintenance and prevents spam.",
        "Membership is verified on-chain. If your GUY balance falls below the threshold, your access to community features may be restricted."
      ]
    },
    {
      icon: <Scale className="text-blue-400" size={24} />,
      title: "Request Limits & Honesty",
      content: [
        "Users are limited to 3 active requests at any given time. An active request is one that is 'Open' or 'Funded' but not yet 'Completed'.",
        "Once your need has been met, you are expected to mark your request as 'Completed' to allow others to receive help.",
        "Misrepresenting needs or creating multiple accounts to bypass limits will result in a permanent ban from the platform."
      ]
    },
    {
      icon: <Zap className="text-primary" size={24} />,
      title: "Transparency & Proof",
      content: [
        "While not mandatory, providing proof of need (e.g., a photo of a bill with your @handle handwritten next to it) significantly increases trust.",
        "The community is built on radical transparency. Requests with clear descriptions and proof are prioritized by contributors.",
        "All transactions occur directly on the XPR Network. AskGuy does not hold or escrow funds."
      ]
    },
    {
      icon: <Heart className="text-rose-400" size={24} />,
      title: "Community Conduct",
      content: [
        "Be respectful in your requests and support messages. Harassment, hate speech, or predatory behavior will not be tolerated.",
        "AskGuy is a mutual aid platform, not a professional fundraising service. Treat every contribution as a gift from a fellow community member.",
        "Do not spam the activity feed or solicit members via private messages outside of the platform's intended use."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="space-y-4">
            <Button variant="ghost" asChild className="-ml-2 text-muted-foreground hover:text-primary">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-4xl font-black tracking-tight">Community Guidelines</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              AskGuy is built on trust, transparency, and the power of the XPR Network community. 
              These guidelines ensure a safe and effective environment for mutual aid.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <div key={i} className="glass-card p-8 rounded-3xl border-white/5 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>
                <ul className="space-y-4">
                  {section.content.map((item, j) => (
                    <li key={j} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 flex items-start gap-4">
            <Info className="text-primary shrink-0 mt-1" size={20} />
            <div className="space-y-2">
              <p className="font-bold text-primary">Disclaimer</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AskGuy is a decentralized interface for peer-to-peer transfers. We do not guarantee that any request will be funded. 
                Users are responsible for their own security and should perform their own due diligence before contributing to any request.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Guidelines;