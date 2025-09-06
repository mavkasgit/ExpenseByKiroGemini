'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'

// Иконки для групп
const groupIcons = [
  { key: 'basic', emoji: '📋', name: 'Основные' },
  { key: 'transport', emoji: '🚗', name: 'Транспорт' },
  { key: 'food', emoji: '🍽️', name: 'Еда и напитки' },
  { key: 'entertainment', emoji: '🎬', name: 'Развлечения' },
  { key: 'health', emoji: '🏥', name: 'Здоровье' },
  { key: 'home', emoji: '🏠', name: 'Дом и быт' },
  { key: 'education', emoji: '📚', name: 'Образование' },
  { key: 'travel', emoji: '✈️', name: 'Путешествия' },
  { key: 'work', emoji: '💼', name: 'Работа' },
  { key: 'shopping', emoji: '🛍️', name: 'Покупки' },
  { key: 'finance', emoji: '💰', name: 'Финансы' },
  { key: 'hobby', emoji: '🎨', name: 'Хобби' }
]

interface Group {
  id: string
  name: string
  icon: string
  categoriesCount: number
}

interface GroupsManagerProps {
  onClose: () => void
}

export function GroupsManager({ onClose }: GroupsManagerProps) {
  const [groups, setGroups] = useState<Group[]>([
    { id: '1', name: 'Основные', icon: '📋', categoriesCount: 5 },
    { id: '2', name: 'Транспорт', icon: '🚗', categoriesCount: 3 },
    { id: '3', name: 'Еда и напитки', icon: '🍽️', categoriesCount: 8 },
    { id: '4', name: 'Развлечения', icon: '🎬', categoriesCount: 4 },
    { id: '5', name: 'Здоровье', icon: '🏥', categoriesCount: 2 },
    { id: '6', name: 'Дом и быт', icon: '🏠', categoriesCount: 6 },
    { id: '7', name: 'Образование', icon: '📚', categoriesCount: 1 },
    { id: '8', name: 'Путешествия', icon: '✈️', categoriesCount: 3 }
  ])
  
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupIcon, setNewGroupIcon] = useState('📋')
  const { showToast } = useToast()

  const handleAddGroup = () => {
    if (!newGroupName.trim()) {
      showToast('Введите название группы', 'error')
      return
    }

    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      icon: newGroupIcon,
      categoriesCount: 0
    }

    setGroups(prev => [...prev, newGroup])
    setNewGroupName('')
    setNewGroupIcon('📋')
    setShowAddForm(false)
    showToast('Группа создана', 'success')
  }

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group)
  }

  const handleUpdateGroup = (updatedGroup: Group) => {
    setGroups(prev => prev.map(group => 
      group.id === updatedGroup.id ? updatedGroup : group
    ))
    setEditingGroup(null)
    showToast('Группа обновлена', 'success')
  }

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (group && group.categoriesCount > 0) {
      showToast('Нельзя удалить группу с категориями', 'error')
      return
    }

    setGroups(prev => prev.filter(group => group.id !== groupId))
    showToast('Группа удалена', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Управление группами</h2>
        <Button
          variant="primary"
          onClick={() => setShowAddForm(true)}
        >
          + Добавить группу
        </Button>
      </div>

      {/* Список групп */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{group.icon}</div>
                <div>
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-500">
                    {group.categoriesCount} категорий
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditGroup(group)}
                >
                  ✏️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteGroup(group.id)}
                  disabled={group.categoriesCount > 0}
                  className={group.categoriesCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  🗑️
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Модал добавления группы */}
      <Modal
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false)
          setNewGroupName('')
          setNewGroupIcon('📋')
        }}
        title="Добавить новую группу"
      >
        <div className="space-y-4">
          <Input
            label="Название группы"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Например: Хобби, Подписки, Инвестиции"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Иконка группы
            </label>
            <div className="grid grid-cols-6 gap-2">
              {groupIcons.map((icon) => (
                <button
                  key={icon.key}
                  type="button"
                  onClick={() => setNewGroupIcon(icon.emoji)}
                  className={`
                    p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105
                    ${newGroupIcon === icon.emoji 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  title={icon.name}
                >
                  <div className="text-xl">{icon.emoji}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false)
                setNewGroupName('')
                setNewGroupIcon('📋')
              }}
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleAddGroup}
              disabled={!newGroupName.trim()}
            >
              Создать группу
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модал редактирования группы */}
      {editingGroup && (
        <GroupEditModal
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onUpdate={handleUpdateGroup}
        />
      )}
    </div>
  )
}

// Компонент для редактирования группы
function GroupEditModal({ 
  group, 
  onClose, 
  onUpdate 
}: { 
  group: Group
  onClose: () => void
  onUpdate: (group: Group) => void
}) {
  const [name, setName] = useState(group.name)
  const [icon, setIcon] = useState(group.icon)

  const handleSave = () => {
    if (!name.trim()) return
    
    onUpdate({
      ...group,
      name: name.trim(),
      icon
    })
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Редактировать группу"
    >
      <div className="space-y-4">
        <Input
          label="Название группы"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название группы"
          required
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Иконка группы
          </label>
          <div className="grid grid-cols-6 gap-2">
            {groupIcons.map((iconOption) => (
              <button
                key={iconOption.key}
                type="button"
                onClick={() => setIcon(iconOption.emoji)}
                className={`
                  p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105
                  ${icon === iconOption.emoji 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                title={iconOption.name}
              >
                <div className="text-xl">{iconOption.emoji}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  )
}