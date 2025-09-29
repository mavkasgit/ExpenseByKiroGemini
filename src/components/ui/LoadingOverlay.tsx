import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function LoadingOverlay({ 
  text, 
  icon, 
  containerClassName 
}: { 
  text?: string; 
  icon?: ReactNode; 
  containerClassName?: string 
}) {
  return (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm",
        containerClassName
      )}
    >
      <div className="flex flex-col items-center">
        {icon || <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>}
        <p className="mt-4 text-lg font-medium text-gray-700">
          {text || 'Загрузка...'}
        </p>
      </div>
    </div>
  )
}
