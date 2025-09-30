'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DroppableGroup } from './DroppableGroup'
import { CategoryCard } from './CategoryCard'
import { Button } from '@/components/ui'
import { Category, CategoryGroup as TCategoryGroup } from '@/types'
import { availableIcons } from '@/lib/utils/category-constants'
import { memo } from 'react'

interface CategoryGroupProps {
  group: TCategoryGroup & { categories: Category[] }
  onEditGroup: (group: TCategoryGroup) => void
  onDeleteGroup: (groupId: string) => void
  onEditCategory: (category: Category) => void
  onKeywordsCategory: (category: Category) => void
  onDeleteCategory: (categoryId: string) => Promise<void>;
  activeCategory: Category | null
  style?: React.CSSProperties
  isOverlay?: boolean
  isGroupDragging?: boolean
}

function CategoryGroupComponent({ group, onEditGroup, onDeleteGroup, onEditCategory, onKeywordsCategory, onDeleteCategory, activeCategory, style: propStyle, isOverlay, isGroupDragging }: CategoryGroupProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: group.id,
    data: { type: 'group', group },
    disabled: group.id === 'uncategorized',
  })

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const iconEmoji = availableIcons.find(icon => icon.key === group.icon)?.emoji || '📁'
  const isAnyCategoryDragging = !!activeCategory;
  const isSourceGroup = activeCategory ? group.id === activeCategory.category_group_id : false;

  const overlayClasses = isOverlay ? 'scale-105 shadow-2xl rotate-1' : ''
  const draggingClasses = isDragging ? 'opacity-30' : 'opacity-100'
  const overClasses = isOver && isGroupDragging && !isDragging ? 'outline-2 outline-dashed outline-blue-500 bg-blue-50' : ''

  return (
    <div 
      ref={setNodeRef} 
      style={{...dndStyle, ...propStyle}} 
      className={`bg-white rounded-xl shadow-sm transition-all duration-300 ease-in-out ${overlayClasses} ${draggingClasses} ${overClasses}`}>
      <div 
        {...attributes} 
        {...listeners}
        className="p-4 border-b border-gray-200 flex justify-between items-center cursor-grab"
      >
        <div className="flex items-center gap-3">
          <span className="p-2 -ml-2 text-gray-400">
            <svg viewBox="0 0 20 20" width="20"><path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 6zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 12z" fill="currentColor"></path></svg>
          </span>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${group.color}20` }}>
            <span>{iconEmoji}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800">{group.name}</h3>
        </div>
      </div>
      <div className="p-4">
        <DroppableGroup 
            id={group.id} 
            groupName={group.name} 
            isCategoryDragging={isAnyCategoryDragging}
            isSourceGroup={isSourceGroup}
        >
          {group.categories && group.categories.length > 0 ? (
            <SortableContext items={group.categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {group.categories.map(category => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={onEditCategory}
                    onKeywords={onKeywordsCategory}
                    onDelete={onDeleteCategory}
                    isDraggable
                  />
                ))}
              </div>
            </SortableContext>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Перетащите категории сюда или создайте новую.
            </div>
          )}
        </DroppableGroup>
      </div>
    </div>
  )
}

export const CategoryGroup = memo(CategoryGroupComponent);
