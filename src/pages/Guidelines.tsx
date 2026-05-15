"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Zap, Scale, Info, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useWallet } from '@/hooks/use-wallet';

const Guidelines = () => {
  const { membershipFee } = useWallet();

  const sections = [
    {
      icon: <ShieldCheck className="text-emerald-400" size={24} />,
      title: "Membership & Eligibility",
      content: [
        "AskGuy is open to all XPR Network wallet holders. Anyone can connect and support the community.",
        `To post a request, a yearly membership fee of ${membershipFee.toLocaleString()} XPR is required. This fee supports platform maintenance and prevents spam.`,
        "The membership fee is paid directly on-chain and grants full posting rights for 365 days."
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Guidelines;