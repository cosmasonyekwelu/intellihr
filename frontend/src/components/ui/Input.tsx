import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, FieldProps {}
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FieldProps {}
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

const fieldBase = 'w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-950 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

const FieldFrame: React.FC<FieldProps & { children: React.ReactNode; id?: string }> = ({ label, error, hint, children, id }) => (
  <div className="space-y-1.5">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
    )}
    {children}
    {(error || hint) && (
      <p className={`text-xs ${error ? 'text-rose-600' : 'text-slate-500'}`}>
        {error || hint}
      </p>
    )}
  </div>
);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, hint, icon: Icon, id, ...props }, ref) => (
    <FieldFrame label={label} error={error} hint={hint} id={id}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input
          ref={ref}
          id={id}
          className={`${fieldBase} ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : ''} ${className}`}
          {...props}
        />
      </div>
    </FieldFrame>
  )
);

Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, hint, icon: Icon, id, children, ...props }, ref) => (
    <FieldFrame label={label} error={error} hint={hint} id={id}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <select
          ref={ref}
          id={id}
          className={`${fieldBase} ${Icon ? 'pl-9' : 'pl-3'} pr-9 py-2.5 ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
    </FieldFrame>
  )
);

Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, hint, id, ...props }, ref) => (
    <FieldFrame label={label} error={error} hint={hint} id={id}>
      <textarea
        ref={ref}
        id={id}
        className={`${fieldBase} min-h-24 px-3 py-2.5 ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : ''} ${className}`}
        {...props}
      />
    </FieldFrame>
  )
);

Textarea.displayName = 'Textarea';
