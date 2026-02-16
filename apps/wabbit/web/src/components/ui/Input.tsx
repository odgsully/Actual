import { forwardRef, type InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm text-white/60 mb-1">{label}</label>
        )}
        <input
          ref={ref}
          className={clsx('glass-input w-full', error && 'border-red-400/50', className)}
          {...props}
        />
        {error && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
