import React from 'react';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base'
};

export const Avatar: React.FC<AvatarProps> = ({ name = 'User', src, size = 'md' }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`} />;
  }

  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ring-2 ring-white`}>
      {initials || 'U'}
    </div>
  );
};
