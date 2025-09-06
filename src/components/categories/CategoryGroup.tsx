'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CategoryCard } from './CategoryCard'
import type { Category } from '@/types'

interface CategoryGroupProps {
  groupName: string
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (categoryId: string) => void
  onKeywords: (category: Category) => void
}

export function CategoryGroup({ groupName, categories, onEdit, onDelete, onKeywords }: CategoryGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const { setNodeRef } = useDroppable({
    id: `group-${groupName}`,
    data: {
      type: 'group',
      groupName
    }
  })

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Заголовок группы */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center space-x-2 text-lg font-semibold text-gray-800 hover:text-gray-600 transition-colors"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>{groupName}</span>
          <span className="text-sm text-gray-500 font-normal">({categories.length})</span>
        </button>
      </div>

      {/* Область для drop */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className="min-h-[60px] p-2 border-2 border-dashed border-gray-200 rounded-lg transition-colors hover:border-gray-300"
        >
          <SortableContext 
            items={categories.map(cat => cat.id)} 
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onKeywords={onKeywords}
                  isDraggable={true}
                />
              ))}
            </div>
          </SortableContext>
          
          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>Перетащите категории сюда</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}