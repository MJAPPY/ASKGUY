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