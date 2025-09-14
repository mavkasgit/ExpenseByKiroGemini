'use client'

import { useState, useMemo, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useToast } from '@/hooks/useToast'
import { Category, CategoryGroup, CategoryKeyword } from '@/types'
import { moveCategoryToGroup, updateGroupOrder, updateCategoryOrderInGroup } from '@/lib/actions/categories'
import { getAllKeywords } from '@/lib/actions/keywords'
import { getUserSettings, UserSettings } from '@/lib/actions/settings'
import { Preset } from '@/lib/presets'
import { applyPreset } from '@/lib/actions/presets'

import { GroupsManager } from './GroupsManager'
import { PresetPicker } from './PresetPicker'
import { Button } from '@/components/ui/Button'
import { GroupsModal } from './GroupsModal'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { Modal } from '@/components/ui/Modal'
import { CategoryForm } from './CategoryForm'
import { CategoryCard } from './CategoryCard'
import { CategoryGroup as CategoryGroupComponent } from './CategoryGroup'
import { KeywordEditorModal } from './KeywordEditorModal'


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
    description: null,
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
  const [allKeywords, setAllKeywords] = useState<CategoryKeyword[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({});
  const [activeGroup, setActiveGroup] = useState<CategoryGroup | null>(null)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [draggedItemWidth, setDraggedItemWidth] = useState<number | null>(null); // New state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [isKeywordsModalOpen, setIsKeywordsModalOpen] = useState(false);
  const [selectedCategoryForKeywords, setSelectedCategoryForKeywords] = useState<Category | null>(null);

  const { showToast } = useToast()

  useEffect(() => {
    setGroups(buildGroupsWithCategories(initialGroups, initialCategories));
    setCategories(initialCategories);
    const fetchData = async () => {
      const [keywordsResult, settingsResult] = await Promise.all([
        getAllKeywords(),
        getUserSettings()
      ]);
      
      if (keywordsResult.success) {
        setAllKeywords(keywordsResult.data || []);
      }
      if (settingsResult.settings) {
        setUserSettings(settingsResult.settings);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0,
      },
    })
  )

  const handleApplyPreset = async (newGroups: CategoryGroup[], newCategories: Category[]) => {
    setGroups(buildGroupsWithCategories(newGroups, newCategories));
    setCategories(newCategories);
    showToast(`Пресет успешно применен!`, 'success');
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'category') {
      setActiveCategory(active.data.current.category)
    }
    if (active.data.current?.type === 'group') {
      setActiveGroup(active.data.current.group)
      setDraggedItemWidth(active.rect.current?.initial?.width || null); // Set width
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveGroup(null);
    setActiveCategory(null);
    setDraggedItemWidth(null); // Reset width

    if (!over) {
      return;
    }

    // Handle group sorting
    if (active.data.current?.type === 'group' && active.id !== over.id) {
      const oldIndex = groups.findIndex(g => g.id === active.id);
      const newIndex = groups.findIndex(g => g.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(groups, oldIndex, newIndex);
        setGroups(newOrder);
        updateGroupOrder(newOrder.map((g, i) => ({ id: g.id, sort_order: i })));
      }
      return;
    }

    // Handle category sorting
    if (active.data.current?.type === 'category') {
      const activeCategory = active.data.current.category as Category;
      const sourceGroupId = activeCategory.category_group_id;

      const overId = over.id.toString();
      const overData = over.data.current;
      
      let destGroupId: string | null = null;
      if (over.id.toString().startsWith('group-')) { // Dropped on a DroppableGroup
          destGroupId = over.id.toString().replace('group-', '');
      } else if (overData?.type === 'category') { // Dropped on a CategoryCard
          destGroupId = overData.category.category_group_id;
      } else if (overData?.type === 'group') { // This case might not happen if using DroppableGroup
          destGroupId = over.id.toString();
      }

      if (!destGroupId) return;

      const sourceGroup = groups.find(g => g.id === sourceGroupId);
      const destGroup = groups.find(g => g.id === destGroupId);

      if (!sourceGroup || !destGroup) return;

      // Moving within the same group
      if (sourceGroupId === destGroupId) {
        if (active.id === over.id) return;
        const oldIndex = sourceGroup.categories.findIndex(c => c.id === active.id);
        const newIndex = destGroup.categories.findIndex(c => c.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedCategories = arrayMove(sourceGroup.categories, oldIndex, newIndex);
            const newGroups = groups.map(g => g.id === sourceGroupId ? {...g, categories: reorderedCategories} : g);
            setGroups(newGroups);
            updateCategoryOrderInGroup(reorderedCategories.map((c, i) => ({ id: c.id, order: i })));
        }
      } else { // Moving to a different group
        const activeIndex = sourceGroup.categories.findIndex(c => c.id === active.id);
        if (activeIndex === -1) return;

        const [movedCategory] = sourceGroup.categories.splice(activeIndex, 1);
        movedCategory.category_group_id = destGroupId;

        let overIndex = destGroup.categories.length; // Default to end
        if (overData?.type === 'category') {
            overIndex = destGroup.categories.findIndex(c => c.id === over.id);
            if (overIndex === -1) overIndex = destGroup.categories.length;
        }
        
        destGroup.categories.splice(overIndex, 0, movedCategory);

        const newGroups = groups.map(g => {
            if (g.id === sourceGroupId) return sourceGroup;
            if (g.id === destGroupId) return destGroup;
            return g;
        });

        setGroups(newGroups);
        moveCategoryToGroup(active.id.toString(), destGroupId);
        updateCategoryOrderInGroup(destGroup.categories.map((c, i) => ({ id: c.id, order: i })));
        if(sourceGroup.categories.length > 0) {
            updateCategoryOrderInGroup(sourceGroup.categories.map((c, i) => ({ id: c.id, order: i })));
        }
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
    setEditingCategory(undefined);
    setIsCategoryModalOpen(true);
  };

  const openCategoryModalForEdit = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleOpenKeywordsModal = (category: Category) => {
    setSelectedCategoryForKeywords(category);
    setIsKeywordsModalOpen(true);
  };

  const handleCloseKeywordsModal = () => {
    setIsKeywordsModalOpen(false);
    setSelectedCategoryForKeywords(null);
  };

  const handleKeywordChange = async () => {
    const result = await getAllKeywords();
    if (result.success) {
      setAllKeywords(result.data || []);
    }
  };

  const handleCategorySaved = (savedCategoryData: any) => {
    setIsCategoryModalOpen(false);
    const savedCategory = Array.isArray(savedCategoryData) ? savedCategoryData[0] : savedCategoryData;

    let newCategories;
    if (editingCategory) {
        newCategories = categories.map(c => c.id === savedCategory.id ? savedCategory : c);
    } else {
        newCategories = [...categories, savedCategory];
    }
    setCategories(newCategories);
    const currentGroups = groups.map(g => {
        const { categories, ...groupData } = g;
        return groupData;
    });
    setGroups(buildGroupsWithCategories(currentGroups, newCategories));
    setEditingCategory(undefined);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const newCategories = categories.filter(c => c.id !== categoryId);
    setCategories(newCategories);
    setGroups(buildGroupsWithCategories(initialGroups, newCategories));
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
      setGroups(prev => prev.filter(g => g.id !== deletingGroupId));
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

      <GroupsModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
        onGroupUpdated={handleGroupUpdated}
        editingGroup={editingGroup}
        onSuccess={() => setIsGroupModalOpen(false)}
      />

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
        customSize="max-w-[550px]"
      >
        <CategoryForm
          onSuccess={handleCategorySaved}
          onCancel={() => setIsCategoryModalOpen(false)}
          category={editingCategory}
        />
      </Modal>

      {selectedCategoryForKeywords && (
        <KeywordEditorModal
          isOpen={isKeywordsModalOpen}
          onClose={handleCloseKeywordsModal}
          category={selectedCategoryForKeywords}
          categories={categories}
          keywords={allKeywords.filter(k => k.category_id === selectedCategoryForKeywords.id)}
          onKeywordChange={handleKeywordChange}
          userSettings={userSettings}
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <GroupsManager
          groups={groups}
          handleEditGroup={openGroupModalForEdit}
          handleDeleteGroup={handleDeleteGroup}
          handleEditCategory={openCategoryModalForEdit}
          handleDeleteCategory={handleDeleteCategory}
          handleKeywordsCategory={handleOpenKeywordsModal}
          activeGroup={activeGroup}
          activeCategory={activeCategory}
        />
        <DragOverlay>
          {activeCategory ? (
            <CategoryCard category={activeCategory} isOverlay />
          ) : null}
          {activeGroup ? (
             <CategoryGroupComponent 
                group={{...activeGroup, categories: groups.find(g => g.id === activeGroup.id)?.categories || []}}
                activeCategory={null}
                onDeleteGroup={() => {}}
                onEditCategory={() => {}}
                onEditGroup={() => {}}
                onKeywordsCategory={() => {}}
                onDeleteCategory={async (categoryId: string) => {}}
                style={draggedItemWidth ? { width: draggedItemWidth } : undefined} // Add style prop
             />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}