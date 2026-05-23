import React from 'react';

export const TableShell: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`} {...props}>
    <div className="overflow-x-auto">{children}</div>
  </div>
);

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className = '', children, ...props }) => (
  <table className={`min-w-full divide-y divide-slate-200 text-left text-sm ${className}`} {...props}>
    {children}
  </table>
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className = '', children, ...props }) => (
  <th className={`whitespace-nowrap bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`} {...props}>
    {children}
  </th>
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className = '', children, ...props }) => (
  <td className={`px-4 py-4 align-middle text-slate-700 ${className}`} {...props}>
    {children}
  </td>
);
