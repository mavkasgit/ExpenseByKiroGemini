'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  className?: string;
  inputClassName?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
}

export function InlineEdit({ 
  value, 
  onSave, 
  className,
  inputClassName,
  buttonSize = 'sm'
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedValue = currentValue.trim();
    if (trimmedValue && trimmedValue !== value) {
      setIsLoading(true);
      await onSave(trimmedValue);
      setIsLoading(false);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Input
          ref={inputRef}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCancel} // Revert on blur
          className={cn("h-8", inputClassName)}
          disabled={isLoading}
          autoComplete="new-password"
        />
        <Button onClick={handleSave} size={buttonSize} isLoading={isLoading} aria-label="Save">
          ✓
        </Button>
        <Button onClick={handleCancel} variant="ghost" size={buttonSize} disabled={isLoading} aria-label="Cancel">
          ×
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <span className="font-medium text-slate-900">{value}</span>
      <Button 
        variant="ghost" 
        size={buttonSize} 
        onClick={() => setIsEditing(true)} 
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Edit"
      >
        ✏️
      </Button>
    </div>
  );
}
