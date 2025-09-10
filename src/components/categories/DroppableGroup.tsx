'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface DroppableGroupProps {
  id: string
  children: React.ReactNode
}

export function DroppableGroup({ id, children }: DroppableGroupProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `group-${id}`,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "p-3 border-2 border-dashed border-gray-200 rounded-lg transition-colors min-h-[120px]",
        isOver ? "border-indigo-500 bg-indigo-50" : "hover:border-gray-300 bg-gray-50"
      )}
    >
      {children}
    </div>
  );
}