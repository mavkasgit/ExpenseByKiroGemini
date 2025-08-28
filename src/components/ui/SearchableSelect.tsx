'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import ReactDOM from 'react-dom'

interface Option {
  value: string
  label: string
  color?: string | null
  emoji?: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string | null | undefined
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Выберите опцию",
  className,
  required = false,
  disabled = false,
  size = 'md'
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  })

  // Фильтруем опции по поисковому запросу
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Получаем выбранную опцию
  const selectedOption = options.find(option => option.value === value)

  // Создаем портал-ноду при монтировании
  useEffect(() => {
    const node = document.createElement('div')
    document.body.appendChild(node)
    setPortalNode(node)

    return () => {
      document.body.removeChild(node)
    }
  }, [])

  // Обновляем позицию портала
  const updatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }

  useEffect(() => {
    if (isOpen) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true) // Use capture phase for scroll
    }

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  // Закрываем при клике вне компонента
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        portalNode &&
        !portalNode.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [portalNode])

  // Обработка клавиш
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Escape':
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
        break
    }
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true)
      inputRef.current?.focus()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(-1)
    if (!isOpen) setIsOpen(true)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Поле ввода */}
      <div
        className={cn(
          "relative w-full cursor-pointer",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={handleInputClick}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (selectedOption?.label || '')}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full pr-10 border border-gray-300 rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "bg-white text-gray-900",
            size === 'sm' && "px-2 py-1 text-sm",
            size === 'md' && "px-3 py-2",
            size === 'lg' && "px-4 py-3 text-lg",
            disabled && "bg-gray-100 cursor-not-allowed"
          )}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
        
        {/* Иконка стрелки */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200",
              isOpen && "transform rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Выпадающий список (порталированный) */}
      {isOpen && portalNode && ReactDOM.createPortal(
        <div 
          className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">
              Ничего не найдено
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                className={cn(
                  "px-3 py-2 cursor-pointer text-sm flex items-center space-x-2",
                  "hover:bg-gray-100",
                  highlightedIndex === index && "bg-gray-100",
                  value === option.value && "bg-blue-50 text-blue-700"
                )}
                onClick={() => handleSelect(option.value)}
              >
                {option.color && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.emoji && (
                  <span className="text-lg flex-shrink-0">{option.emoji}</span>
                )}
                <span className="text-gray-900">{option.label}</span>
              </div>
            ))
          )}
        </div>,
        portalNode
      )}
    </div>
  )
}