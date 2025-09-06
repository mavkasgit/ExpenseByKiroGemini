'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button, Input, Modal, useToast } from '@/components/ui'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { createCategoryGroup, updateCategoryGroup, deleteCategoryGroup, getCategoryGroups, updateGroupOrder } from '@/lib/actions/categories'
import { SortableGroupItem } from './SortableGroupItem';
import type { CategoryGroup } from '@/types';
import { availableIcons, availableColors, getRandomColor } from '@/lib/utils/constants';

interface GroupsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function GroupsModal({ isOpen, onClose, onSuccess }: GroupsModalProps) {
  const [groups, setGroups] = useState<CategoryGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupIcon, setNewGroupIcon] = useState('other')
  const [newGroupColor, setNewGroupColor] = useState('#6b7280')
  const [groupToDelete, setGroupToDelete] = useState<CategoryGroup | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCategoryGroups();
      if (result.success) {
        setGroups(result.data || []);
      } else {
        toast.error(result.error || 'Ошибка загрузки групп');
      }
    } catch (error) {
      toast.error('Ошибка при загрузке групп');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen, loadGroups]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Введите название группы');
      return;
    }
    const result = await createCategoryGroup({ 
      name: newGroupName.trim(),
      icon: newGroupIcon,
      color: newGroupColor
    });
    if (result.success) {
      toast.success('Группа создана');
      setIsCreating(false);
      setNewGroupName('');
      setNewGroupIcon('other');
      setNewGroupColor('#6b7280');
      loadGroups();
      onSuccess();
    } else {
      toast.error(result.error || 'Ошибка при создании');
    }
  };

  const handleUpdateGroup = async (group: CategoryGroup, name: string, icon: string, color: string) => {
    const result = await updateCategoryGroup(group.id, { name, icon, color });
    if (result.success) {
      toast.success('Группа обновлена');
      setEditingGroup(null);
      loadGroups();
      onSuccess();
    } else {
      toast.error(result.error || 'Ошибка при обновлении');
    }
  };

  const handleDeleteRequest = (group: CategoryGroup) => {
    setGroupToDelete(group);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    setIsConfirmingDelete(true);

    const result = await deleteCategoryGroup(groupToDelete.id);
    if (result.success) {
      toast.success('Группа удалена');
      loadGroups();
      onSuccess();
    } else {
      toast.error(result.error || 'Ошибка при удалении');
    }

    setIsConfirmingDelete(false);
    setGroupToDelete(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex((g) => g.id === active.id);
      const newIndex = groups.findIndex((g) => g.id === over.id);
      const newOrder = arrayMove(groups, oldIndex, newIndex);
      setGroups(newOrder);
      const orderToUpdate = newOrder.map((g, index) => ({ id: g.id, sort_order: index }));
      await updateGroupOrder(orderToUpdate).catch(() => {
        toast.error('Ошибка при обновлении порядка');
        loadGroups();
      });
    }
  };

  const handleClose = () => {
    setEditingGroup(null);
    setIsCreating(false);
    onClose();
  }

  useEffect(() => {
    if (isCreating) {
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
      }, 100);
    }
  }, [isCreating]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Управление группами" size="lg">
      <div className="space-y-4">
        {!isCreating && (
          <div className="flex justify-end">
            <Button onClick={() => {
              setIsCreating(true);
              setNewGroupName('');
              setNewGroupColor(getRandomColor());
              setNewGroupIcon('other');
            }}>Создать группу</Button>
          </div>
        )}

        {isCreating && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">
            <h4 className="font-medium text-gray-800">Новая группа</h4>
            <Input 
              ref={nameInputRef} 
              value={newGroupName} 
              onChange={(e) => setNewGroupName(e.target.value)} 
              placeholder="Название новой группы" 
              required 
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleCreateGroup(); }
                if (e.key === 'Escape') { setIsCreating(false); }
              }}
            />
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-700 mr-4">Цвет</label>
              <div className="flex-1 flex space-x-2 overflow-x-auto p-2">
                {availableColors.map(color => (
                  <button key={color} type="button" onClick={() => setNewGroupColor(color)} className={`w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150 ${newGroupColor === color ? 'ring-2 ring-offset-2 ring-blue-500 border-white' : 'border-transparent'}`} style={{ backgroundColor: color }}>
                    {newGroupColor === color && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-700 mr-4">Иконка</label>
              <div className="flex-1 flex space-x-2 overflow-x-auto p-2">
                {availableIcons.map(icon => <button key={icon.key} type="button" onClick={() => setNewGroupIcon(icon.key)} className={`w-10 h-10 p-2 rounded-lg border-2 flex-shrink-0 ${newGroupIcon === icon.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} title={icon.names[0]}>{icon.emoji}</button>)}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Отмена</Button>
              <Button onClick={handleCreateGroup}>Сохранить</Button>
            </div>
          </div>
        )}

        <div className="min-h-[200px]">
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : groups.length === 0 && !isCreating ? (
            <div className="text-center py-8 text-gray-500">Нет созданных групп.</div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {groups.map((group) => (
                    <SortableGroupItem 
                      key={group.id} 
                      group={group} 
                      editingGroup={editingGroup}
                      onEdit={setEditingGroup} 
                      onDelete={() => handleDeleteRequest(group)}
                      onSave={handleUpdateGroup}
                      onCancel={() => setEditingGroup(null)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="ghost" onClick={handleClose}>Закрыть</Button>
          <Button variant="primary" onClick={() => { onSuccess(); handleClose(); }}>Готово</Button>
        </div>
      </div>
      <ConfirmationModal
        isOpen={!!groupToDelete}
        onClose={() => setGroupToDelete(null)}
        onConfirm={handleDeleteGroup}
        title={`Удалить группу "${groupToDelete?.name}"?`}
        message="Все категории из этой группы не будут удалены, а переместятся в раздел 'Без группы'. Это действие нельзя отменить."
        isLoading={isConfirmingDelete}
      />
    </Modal>
  )
}