import React from 'react';

export const SkeletonLoader: React.FC<{ rows?: number; className?: string }> = ({ rows = 4, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />
    ))}
  </div>
);
