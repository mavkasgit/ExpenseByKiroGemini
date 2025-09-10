'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface DroppableGroupProps {
  id: string
  children: React.ReactNode
  groupName: string
  isCategoryDragging: boolean
  isSourceGroup: boolean
}

export function DroppableGroup({ id, children, groupName, isCategoryDragging, isSourceGroup }: DroppableGroupProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `group-${id}`,
  });

  const showOverlay = isCategoryDragging && !isSourceGroup;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-3 rounded-lg transition-all duration-200 min-h-[120px] flex justify-center items-center text-center",
        {
            "bg-blue-50 text-blue-700 font-medium": isOver && showOverlay,
            "bg-gray-100 text-gray-500": !isOver && showOverlay,
            "bg-gray-50/50": !showOverlay,
        }
      )}
    >
      {showOverlay ? (
        <span className="p-4">Вставить категорию в группу &quot;{groupName}&quot;</span>
      ) : (
        children
      )}
    </div>
  );
}
