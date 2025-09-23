'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface ExpandableOption {
  value: string
  label: string
  description?: string
}

interface ExpandableSearchSelectProps {
  options: ExpandableOption[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  className?: string
  disabled?: boolean
  maxVisible?: number
}

const DEFAULT_MAX_VISIBLE = 3

export function ExpandableSearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Выберите значение',
  searchPlaceholder = 'Поиск по списку…',
  emptyLabel = 'Ничего не найдено',
  className,
  disabled = false,
  maxVisible = DEFAULT_MAX_VISIBLE
}: ExpandableSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAll, setShowAll] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = useMemo(
    () => options.find(option => option.value === value) ?? null,
    [options, value]
  )

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) {
      return options
    }

    return options.filter(option => {
      const labelMatch = option.label.toLowerCase().includes(term)
      const descriptionMatch = option.description?.toLowerCase().includes(term)
      return labelMatch || Boolean(descriptionMatch)
    })
  }, [options, searchTerm])

  const visibleOptions = useMemo(
    () => (showAll ? filteredOptions : filteredOptions.slice(0, maxVisible)),
    [filteredOptions, showAll, maxVisible]
  )

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setSearchTerm('')
      setShowAll(false)
    }
  }, [open])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
            disabled && 'cursor-not-allowed opacity-60',
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
        >
          <span className={cn('flex-1 truncate', !selectedOption && 'text-slate-400')}>
            {selectedOption?.label ?? placeholder}
          </span>
          <svg
            className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start" sideOffset={6}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 flex-1"
            />
            {selectedOption && (
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                Сбросить
              </Button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto rounded-md border border-slate-200">
            {visibleOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-500">{emptyLabel}</div>
            ) : (
              <ul className="divide-y divide-slate-200" role="listbox">
                {visibleOptions.map(option => (
                  <li key={option.value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'flex w-full flex-col items-start gap-1 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100',
                        value === option.value && 'bg-sky-50 text-sky-700'
                      )}
                      role="option"
                      aria-selected={value === option.value}
                    >
                      <span className="font-medium">{option.label}</span>
                      {option.description && <span className="text-xs text-slate-500">{option.description}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {filteredOptions.length > maxVisible && (
            <button
              type="button"
              onClick={() => setShowAll(prev => !prev)}
              className="text-xs font-medium text-sky-600 transition hover:text-sky-500"
            >
              {showAll ? 'Показать меньше' : `Показать все (${filteredOptions.length})`}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
