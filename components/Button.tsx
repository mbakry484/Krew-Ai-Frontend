'use client';

import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary';
type Size = 'md' | 'sm';

type CommonProps = {
  /** Visual style. `primary` = solid capsule, `secondary` = bordered capsule. */
  variant?: Variant;
  /** `md` (default) for hero/CTA, `sm` for compact spots like the navbar. */
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonProps = CommonProps &
  (
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>)
    | ({ href?: never } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>)
  );

/**
 * Reusable capsule button. Renders a Next.js <Link> when `href` is provided,
 * otherwise a native <button>. All visual styling (radius, padding, gap,
 * hover-scale) lives in the `.btn` token-driven classes in globals.css —
 * do not inline raw sizes here.
 */
export default function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  const cls = ['btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className].filter(Boolean).join(' ');

  if ('href' in rest && typeof rest.href === 'string') {
    const { href, ...anchorRest } = rest as { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Link href={href} className={cls} {...anchorRest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
