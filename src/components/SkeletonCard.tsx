import React from 'react';
import { motion } from 'motion/react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="glass-card p-8 space-y-6 overflow-hidden relative">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-slate-100 rounded-md animate-pulse" />
            <div className="h-3 w-24 bg-slate-50 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="w-12 h-12 bg-slate-50 rounded-xl animate-pulse" />
      </div>

      <div className="space-y-3">
        <div className="h-4 w-full bg-slate-50 rounded-md animate-pulse" />
        <div className="h-4 w-5/6 bg-slate-50 rounded-md animate-pulse" />
      </div>

      <div className="pt-4 flex gap-2">
        <div className="h-8 w-20 bg-slate-100 rounded-full animate-pulse" />
        <div className="h-8 w-24 bg-slate-100 rounded-full animate-pulse" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
