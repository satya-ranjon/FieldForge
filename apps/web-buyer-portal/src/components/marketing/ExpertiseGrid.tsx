'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const row1Cards = [
  {
    category: 'IT INFRASTRUCTURE',
    title: 'Networking',
    desc: 'Switches, routers and enterprise network support.',
    img: '/marketing/service-networking.png',
    href: '/solutions'
  },
  {
    category: 'CABLING & INFRASTRUCTURE',
    title: 'Structured Cabling',
    desc: 'Cable runs, rack cleanup and infrastructure work.',
    img: '/marketing/service-cabling.png',
    href: '/solutions'
  },
  {
    category: 'RETAIL & HOSPITALITY',
    title: 'Point of Sale',
    desc: 'Retail POS installs and service calls.',
    img: '/marketing/service-pos.png',
    href: '/solutions'
  }
];

const row2Cards = [
  {
    category: 'SECURITY',
    title: 'Security & Surveillance',
    desc: 'Cameras, NVRs and site security systems.',
    img: '/marketing/service-security.png',
    href: '/solutions'
  },
  {
    category: 'COMPUTER HARDWARE',
    title: 'Computer Hardware',
    desc: 'On-site IT hardware repair and refresh.',
    img: '/marketing/service-hardware.png',
    href: '/solutions'
  },
  {
    category: 'AUDIO VISUAL',
    title: 'AV & Digital Signage',
    desc: 'Displays, signage and workplace media systems.',
    img: '/marketing/service-av.png',
    href: '/solutions'
  },
  {
    category: 'ENTERPRISE',
    title: 'Enterprise Locations',
    desc: 'Distributed field service across business sites.',
    img: '/marketing/service-enterprise-map.png',
    href: '/solutions'
  }
];

export const ExpertiseGrid: React.FC = () => {
  return (
    <section className="relative mx-auto my-20 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.1] text-[#09130F]">
          Expertise for the work your business needs.
        </h2>
        <p className="text-base sm:text-lg text-[#5A6874] leading-relaxed">
          From infrastructure to installations, FieldForge connects you with skilled technicians
          across the IT and physical tech space.
        </p>
      </div>

      {/* Row 1 (3 Cards) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {row1Cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group flex flex-col overflow-hidden rounded-3xl border border-[#DCE8DB] bg-white shadow-[0_10px_30px_rgba(9,20,15,0.03)] transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Photographic Image Container */}
            <div className="relative h-44 w-full overflow-hidden bg-slate-100">
              <img
                src={card.img}
                alt={card.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>

            {/* Card Content Footer */}
            <div className="flex flex-1 items-center justify-between p-6">
              <div>
                <h4 className="text-base font-black text-[#09130F]">{card.title}</h4>
                <p className="mt-1 text-xs text-[#5A6874]">{card.desc}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DCE8DB] bg-[#F8FAF7] text-[#09130F] transition group-hover:bg-[#85EB32] group-hover:border-[#85EB32]">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Row 2 (4 Cards) */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {row2Cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group flex flex-col overflow-hidden rounded-3xl border border-[#DCE8DB] bg-white shadow-[0_10px_30px_rgba(9,20,15,0.03)] transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Photographic Image with Category Tag */}
            <div className="relative h-36 w-full overflow-hidden bg-slate-100">
              <img
                src={card.img}
                alt={card.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/95 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#09130F] shadow-xs backdrop-blur">
                {card.category}
              </span>
            </div>

            {/* Card Content Footer */}
            <div className="flex flex-1 items-center justify-between p-5">
              <div>
                <h4 className="text-sm font-black text-[#09130F]">{card.title}</h4>
                <p className="mt-1 text-[11px] text-[#5A6874] leading-relaxed">{card.desc}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#DCE8DB] bg-[#F8FAF7] text-[#09130F] transition group-hover:bg-[#85EB32] group-hover:border-[#85EB32]">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
