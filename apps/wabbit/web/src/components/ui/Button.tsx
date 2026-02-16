import { type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Variant = 'default' | 'primary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  default: 'glass-button',
  primary:
    'bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl px-4 py-2 transition-all duration-700 hover:scale-[1.02]',
  ghost:
    'text-white/60 hover:text-white hover:bg-white/5 rounded-xl px-4 py-2 transition-all duration-700',
  danger:
    'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl px-4 py-2 transition-all duration-700 hover:scale-[1.02]',
}

export function Button({ variant = 'default', className, disabled, ...props }: Props) {
  return (
    <button
      className={clsx(variants[variant], disabled && 'opacity-50 cursor-not-allowed', className)}
      disabled={disabled}
      {...props}
    />
  )
}
