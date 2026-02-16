import { forwardRef, type SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface Option {
  value: string
  label: string
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Option[]
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm text-white/60 mb-1">{label}</label>
        )}
        <select
          ref={ref}
          className={clsx(
            'glass-input w-full appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.4)%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8',
            error && 'border-red-400/50',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0a0a0f] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
