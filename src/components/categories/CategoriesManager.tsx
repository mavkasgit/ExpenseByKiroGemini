'use client'

import { useState, useMemo, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent, Active, Over } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useToast } from '@/hooks/useToast'
import { Category, CategoryGroup } from '@/types'
import { updateCategoryGroup, updateGroupOrder, updateCategoryOrderInGroup } from '@/lib/actions/categories'
import { Preset } from '@/lib/presets'
import { applyPreset } from '@/lib/actions/presets'

import { GroupsManager } from './GroupsManager'
import { PresetPicker } from './PresetPicker'
import { Button } from '@/components/ui/Button'
import { GroupsModal } from './GroupsModal'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { Modal } from '@/components/ui/Modal'
import { CategoryForm } from './CategoryForm'

interface CategoriesManagerProps {
  initialGroups: CategoryGroup[]
  initialCategories: Category[]
}

export type CategoryGroupWithCategories = CategoryGroup & {
  categories: Category[];
};

const buildGroupsWithCategories = (allGroups: CategoryGroup[], allCategories: Category[]) : CategoryGroupWithCategories[] => {
  const categorizedGroups = allGroups.map(group => ({
    ...group,
    categories: allCategories.filter(c => c.category_group_id === group.id)
  }));

  const uncategorizedCategories = allCategories.filter(c => c.category_group_id === null);

  const uncategorizedGroup: CategoryGroup = {
    id: 'uncategorized',
    name: 'Без группы',
    icon: 'other',
    color: '#cccccc',
    sort_order: -1,
    user_id: null,
    created_at: null,
    updated_at: null,
    description: null, // Added missing description property
  };

  let finalGroups = [...categorizedGroups];
  if (uncategorizedCategories.length > 0 || finalGroups.some(g => g.id === 'uncategorized')) {
    finalGroups.push({ ...uncategorizedGroup, categories: uncategorizedCategories });
  }

  finalGroups.sort((a, b) => {
    if (a.id === 'uncategorized') return -1;
    if (b.id === 'uncategorized') return 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  return finalGroups;
};

export function CategoriesManager({ initialGroups, initialCategories }: CategoriesManagerProps) {
    const [groups, setGroups] = useState<CategoryGroupWithCategories[]>(() => buildGroupsWithCategories(initialGroups, initialCategories))
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [activeGroup, setActiveGroup] = useState<CategoryGroup | null>(null)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { showToast } = useToast()

  useEffect(() => {
    setGroups(buildGroupsWithCategories(initialGroups, initialCategories));
    setCategories(initialCategories);
  }, [initialGroups, initialCategories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleApplyPreset = async (newGroups: CategoryGroup[], newCategories: Category[]) => {
    // The PresetPicker already called applyPreset and passed the results here.
    // So, we just need to update the state in CategoriesManager.
    setGroups(buildGroupsWithCategories(newGroups, newCategories));
    setCategories(newCategories);
    showToast(`Пресет успешно применен!`, 'success'); // Generic success message
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'category') {
      setActiveCategory(active.data.current.category)
    }
    if (active.data.current?.type === 'group') {
      setActiveGroup(active.data.current.group)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || active.data.current?.type !== 'category') return

    const activeGroupId = active.data.current?.category.category_group_id // Use category_group_id
    const overId = over.id.toString()
    const overIsGroup = overId.startsWith('group-')
    const overGroupId = overIsGroup ? overId.replace('group-', '') : over.data.current?.category.category_group_id // Use category_group_id

    if (activeGroupId !== overGroupId) {
      setGroups(prev => {
        const newGroups = prev.map(g => ({ ...g, categories: [...g.categories] }))
        const sourceGroup = newGroups.find(g => g.id === activeGroupId)
        const destGroup = newGroups.find(g => g.id === overGroupId)
        if (!sourceGroup || !destGroup) return prev

        const activeIndex = sourceGroup.categories.findIndex(c => c.id === active.id)
        if (activeIndex === -1) return prev

        const [movedCategory] = sourceGroup.categories.splice(activeIndex, 1)
        movedCategory.category_group_id = overGroupId // Use category_group_id

        if (overIsGroup) {
          destGroup.categories.push(movedCategory)
        } else {
          const overIndex = destGroup.categories.findIndex(c => c.id === over.id)
          destGroup.categories.splice(overIndex, 0, movedCategory)
        }
        return newGroups
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveGroup(null)
    setActiveCategory(null)

    if (!over) return

    if (active.data.current?.type === 'group' && active.id !== over.id) {
      const oldIndex = groups.findIndex(g => g.id === active.id)
      const newIndex = groups.findIndex(g => g.id === over.id)
      const newOrder = arrayMove(groups, oldIndex, newIndex)
      setGroups(newOrder)
      await updateGroupOrder(newOrder.map((g, i) => ({ id: g.id, sort_order: i }))) // Use sort_order
    } else if (active.data.current?.type === 'category') {
      const sourceGroupId = active.data.current.category.category_group_id // Use category_group_id
      const overId = over.id.toString()
      const overIsGroup = overId.startsWith('group-')
      const destGroupId = overIsGroup ? overId.replace('group-', '') : over.data.current?.category.category_group_id // Use category_group_id

      if (sourceGroupId === destGroupId) {
        const group = groups.find(g => g.id === sourceGroupId)
        if (group && active.id !== over.id) {
          const oldIndex = group.categories.findIndex(c => c.id === active.id)
          const newIndex = group.categories.findIndex(c => c.id === over.id)
          const reorderedCategories = arrayMove(group.categories, oldIndex, newIndex)
          
          setGroups(prev => prev.map(g => g.id === sourceGroupId ? { ...g, categories: reorderedCategories } : g))
          await updateCategoryOrderInGroup(reorderedCategories.map((c, i) => ({ id: c.id, order: i })))
        }
      } else {
        await updateCategoryGroup(active.id.toString(), destGroupId)
        const finalGroups = groups.map(g => {
          if (g.id === destGroupId) {
            const destGroup = { ...g, categories: [...g.categories] };
            if (!destGroup.categories.some(c => c.id === active.id)) {
              const categoryToMove = categories.find(c => c.id === active.id);
              if (categoryToMove) {
                categoryToMove.category_group_id = destGroupId; // Ensure category_group_id is updated
                destGroup.categories.push(categoryToMove); // Use categoryToMove
              }
            }
            updateCategoryOrderInGroup(destGroup.categories.map((c, i) => ({ id: c.id, order: i })))
            return destGroup;
          } else if (g.id === sourceGroupId) {
            const sourceGroup = { ...g, categories: g.categories.filter(c => c.id !== active.id) };
            updateCategoryOrderInGroup(sourceGroup.categories.map((c, i) => ({ id: c.id, order: i })))
            return sourceGroup;
          }
          return g;
        });
        setGroups(finalGroups);
      }
    }
  }

  const handleGroupCreated = (newGroup: CategoryGroup) => {
    const groupWithCategories = { ...newGroup, categories: [] };
    setGroups(prev => [...prev, groupWithCategories])
  }

  const handleGroupUpdated = (updatedGroup: CategoryGroup) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? { ...g, name: updatedGroup.name, color: updatedGroup.color, icon: updatedGroup.icon } : g))
  }

  const openGroupModalForCreate = () => {
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  const openGroupModalForEdit = (group: CategoryGroup) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  const openCategoryModalForCreate = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const openCategoryModalForEdit = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySaved = (savedCategoryData: any) => {
    setIsCategoryModalOpen(false);
    const savedCategory = Array.isArray(savedCategoryData) ? savedCategoryData[0] : savedCategoryData;

    let newCategories;
    if (editingCategory) { // Update
        newCategories = categories.map(c => c.id === savedCategory.id ? savedCategory : c);
    } else { // Create
        newCategories = [...categories, savedCategory];
    }
    setCategories(newCategories);
    setGroups(buildGroupsWithCategories(groups, newCategories)); // Rebuild groups based on current groups and new categories
    setEditingCategory(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group && group.categories.length > 0) {
      showToast('Нельзя удалить группу, в которой есть категории.', 'error');
      return;
    }
    setDeletingGroupId(groupId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteGroup = async () => {
    if (deletingGroupId) {
      const originalGroups = groups;
      setGroups(prev => prev.filter(g => g.id !== deletingGroupId));
      // TODO: Call server action and revert on failure
      setIsDeleteModalOpen(false);
      setDeletingGroupId(null);
    }
  };

  const hasData = useMemo(() => groups.length > 0, [groups]);

  if (!hasData) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <div className="flex justify-center">
          <PresetPicker onSuccess={handleApplyPreset} />
        </div>
        <GroupsModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          onGroupCreated={handleGroupCreated}
          onGroupUpdated={handleGroupUpdated}
          editingGroup={editingGroup}
          onSuccess={() => {}} // Add this line
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Управление категориями</h2>
        <div className="flex gap-2">
          <Button onClick={openGroupModalForCreate}>Создать группу</Button>
          <Button onClick={openCategoryModalForCreate} variant="primary">+ Создать категорию</Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <GroupsManager
          groups={groups}
          handleEditGroup={openGroupModalForEdit}
          handleDeleteGroup={handleDeleteGroup}
          handleEditCategory={openCategoryModalForEdit}
          activeGroup={activeGroup}
          activeCategory={activeCategory}
        />
      </DndContext>

      <GroupsModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
        onGroupUpdated={handleGroupUpdated}
        editingGroup={editingGroup}
        onSuccess={() => {}} // Add this line
      />

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? "Редактировать категорию" : "Создать новую категорию"}
      >
        <CategoryForm
          category={editingCategory ?? undefined}
          onSuccess={handleCategorySaved}
          onCancel={() => setIsCategoryModalOpen(false)}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteGroup}
        title="Подтвердите удаление"
        message="Вы уверены, что хотите удалить эту группу? Это действие необратимо."
      />
    </div>
  )
}
