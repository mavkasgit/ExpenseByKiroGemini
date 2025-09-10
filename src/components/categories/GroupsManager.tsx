'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CategoryGroup } from './CategoryGroup'
import { Category, CategoryGroup as TCategoryGroup } from '@/types'

import type { CategoryGroupWithCategories } from '@/components/categories/CategoriesManager';

interface GroupsManagerProps {
  groups: CategoryGroupWithCategories[]
  handleEditGroup: (group: TCategoryGroup) => void
  handleDeleteGroup: (groupId: string) => void
  handleEditCategory: (category: Category) => void
  activeGroup: TCategoryGroup | null
  activeCategory: Category | null
}

export function GroupsManager({
  groups,
  handleEditGroup,
  handleDeleteGroup,
  handleEditCategory,
}: GroupsManagerProps) {
  return (
    <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.map(group => (
          <CategoryGroup
            key={group.id}
            group={group}
            onEditGroup={handleEditGroup}
            onDeleteGroup={handleDeleteGroup}
            onEditCategory={handleEditCategory}
          />
        ))}
      </div>
    </SortableContext>
  )
}
