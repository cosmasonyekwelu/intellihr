import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({ className = '', padded = true, children, ...props }) => {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/60 ${padded ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`mb-5 flex items-start justify-between gap-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', children, ...props }) => (
  <h2 className={`text-base font-semibold text-slate-950 ${className}`} {...props}>
    {children}
  </h2>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = '', children, ...props }) => (
  <p className={`mt-1 text-sm text-slate-500 ${className}`} {...props}>
    {children}
  </p>
);
