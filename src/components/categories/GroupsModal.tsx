'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Input, Modal, useToast } from '@/components/ui'
import { createCategoryGroup, updateCategoryGroup, deleteCategoryGroup, getCategoryGroups } from '@/lib/actions/categories'

interface Group {
  id: string
  name: string
  icon?: string
  color?: string
  description?: string
  created_at: string
}

interface GroupsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const availableColors = [
  '#6366f1', // Индиго
  '#ef4444', // Красный
  '#10b981', // Зеленый
  '#f59e0b', // Желтый
  '#8b5cf6', // Фиолетовый
  '#06b6d4', // Голубой
  '#f97316', // Оранжевый
  '#84cc16', // Лайм
  '#ec4899', // Розовый
  '#6b7280', // Серый
  '#14b8a6', // Бирюзовый
  '#f43f5e', // Роза
  '#a855f7', // Пурпурный
  '#3b82f6', // Синий
  '#22c55e', // Зеленый лайм
  '#eab308', // Янтарный
]

const availableIcons = [
  { key: 'shopping-bag', emoji: '🛍️', names: ['покупки', 'магазин', 'шоппинг'] },
  { key: 'car', emoji: '🚗', names: ['машина', 'автомобиль', 'транспорт'] },
  { key: 'home', emoji: '🏠', names: ['дом', 'жилье', 'квартира'] },
  { key: 'food', emoji: '🍽️', names: ['еда', 'питание', 'ресторан'] },
  { key: 'health', emoji: '🏥', names: ['здоровье', 'медицина', 'больница'] },
  { key: 'entertainment', emoji: '🎬', names: ['развлечения', 'кино', 'театр'] },
  { key: 'education', emoji: '📚', names: ['образование', 'учеба', 'школа'] },
  { key: 'travel', emoji: '✈️', names: ['путешествия', 'отпуск', 'поездки'] },
  { key: 'sport', emoji: '⚽', names: ['спорт', 'фитнес', 'тренировки'] },
  { key: 'clothes', emoji: '👕', names: ['одежда', 'вещи', 'гардероб'] },
  { key: 'bills', emoji: '📄', names: ['счета', 'платежи', 'коммунальные'] },
  { key: 'other', emoji: '📦', names: ['другое', 'прочее', 'разное'] },
  { key: 'work', emoji: '💼', names: ['работа', 'офис', 'деловые'] },
  { key: 'baby', emoji: '👶', names: ['ребенок', 'дети', 'детские'] },
  { key: 'pet', emoji: '🐕', names: ['питомцы', 'животные', 'собака'] },
  { key: 'beauty', emoji: '💄', names: ['красота', 'косметика', 'салон'] },
  { key: 'tools', emoji: '🔧', names: ['инструменты', 'ремонт', 'стройка'] },
  { key: 'garden', emoji: '🌱', names: ['сад', 'огород', 'растения'] },
  { key: 'cleaning', emoji: '🧽', names: ['уборка', 'чистка', 'моющие'] },
  { key: 'gift', emoji: '🎁', names: ['подарки', 'сувениры', 'праздники'] }
]

export function GroupsModal({ isOpen, onClose, onSuccess }: GroupsModalProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupIcon, setNewGroupIcon] = useState('shopping-bag')
  const [newGroupColor, setNewGroupColor] = useState('#6366f1')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [iconSearchTerm, setIconSearchTerm] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  // Загружаем группы при открытии модала
  useEffect(() => {
    if (isOpen) {
      loadGroups()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]) // loadGroups стабильная функция

  // Автофокус при создании новой группы
  useEffect(() => {
    if (isCreating && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [isCreating])

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Введите название группы')
      return
    }

    try {
      const result = await createCategoryGroup({
        name: newGroupName.trim(),
        icon: newGroupIcon,
        color: newGroupColor,
        description: newGroupDescription.trim() || undefined
      })

      if ('error' in result) {
        toast.error(result.error || 'Ошибка при создании группы')
      } else {
        toast.success('Группа создана')
        setNewGroupName('')
        setNewGroupIcon('shopping-bag')
        setNewGroupColor('#6366f1')
        setNewGroupDescription('')
        setIsCreating(false)
        loadGroups()
      }
    } catch (error) {
      toast.error('Ошибка при создании группы')
    }
  }

  const loadGroups = async () => {
    setIsLoading(true)
    try {
      const result = await getCategoryGroups()
      if ('error' in result) {
        toast.error(result.error || 'Неизвестная ошибка')
      } else {
        setGroups(result.data || [])
      }
    } catch (error) {
      toast.error('Ошибка при загрузке групп')
    } finally {
      setIsLoading(false)
    }
  }



  const handleUpdateGroup = async (group: Group, newName: string, newIcon: string, newColor: string, newDescription: string) => {
    try {
      const result = await updateCategoryGroup(group.id, {
        name: newName.trim(),
        icon: newIcon,
        color: newColor,
        description: newDescription.trim() || undefined
      })

      if ('error' in result) {
        toast.error(result.error || 'Неизвестная ошибка')
      } else {
        toast.success('Группа обновлена')
        setEditingGroup(null)
        loadGroups()
      }
    } catch (error) {
      toast.error('Ошибка при обновлении группы')
    }
  }

  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`Удалить группу "${group.name}"? Все категории из этой группы будут перемещены в группу "Основные".`)) {
      return
    }

    try {
      const result = await deleteCategoryGroup(group.id)

      if ('error' in result) {
        toast.error(result.error || 'Неизвестная ошибка')
      } else {
        toast.success('Группа удалена')
        loadGroups()
      }
    } catch (error) {
      toast.error('Ошибка при удалении группы')
    }
  }

  const handleToggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  const handleSelectAllGroups = () => {
    if (selectedGroups.size === groups.length) {
      setSelectedGroups(new Set())
    } else {
      setSelectedGroups(new Set(groups.map(group => group.id)))
    }
  }

  const handleDeleteSelectedGroups = async () => {
    if (selectedGroups.size === 0) {
      toast.error('Выберите группы для удаления')
      return
    }

    const selectedGroupNames = groups
      .filter(group => selectedGroups.has(group.id))
      .map(group => group.name)
      .join(', ')

    if (!confirm(`Удалить выбранные группы (${selectedGroups.size}): ${selectedGroupNames}?\n\nВсе категории из этих групп будут перемещены в группу "Основные".`)) {
      return
    }

    setIsDeleting(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const groupId of selectedGroups) {
        try {
          const result = await deleteCategoryGroup(groupId)
          if ('error' in result) {
            errorCount++
          } else {
            successCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Удалено ${successCount} групп`)
        setSelectedGroups(new Set())
        loadGroups()
        onSuccess() // Обновляем список в родительском компоненте
        handleClose() // Закрываем модал
      }

      if (errorCount > 0) {
        toast.error(`Ошибка при удалении ${errorCount} групп`)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Фильтрация иконок
  const filteredIcons = availableIcons.filter(icon => {
    if (iconSearchTerm === '') return true
    
    const searchLower = iconSearchTerm.toLowerCase()
    return icon.names.some(name => name.toLowerCase().includes(searchLower)) ||
           icon.key.toLowerCase().includes(searchLower)
  })

  const handleClose = () => {
    setEditingGroup(null)
    setIsCreating(false)
    setSelectedGroups(new Set())
    setNewGroupName('')
    setNewGroupIcon('shopping-bag')
    setIconSearchTerm('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Управление группами"
      description="Создавайте и редактируйте группы для организации категорий"
      size="lg"
    >
      <div className="space-y-6">
        {/* Кнопка создания новой группы */}
        {!isCreating && (
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => setIsCreating(true)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Создать группу
            </Button>
          </div>
        )}

        {/* Форма создания новой группы */}
        {isCreating && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-900">Новая группа</h4>
            
            <Input
              ref={nameInputRef}
              label="Название группы"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Например: Хобби, Подписки, Инвестиции"
              required
            />

            <Input
              label="Описание (необязательно)"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              placeholder="Краткое описание группы"
            />

            {/* Выбор цвета */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цвет группы
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewGroupColor(color)}
                    className={`
                      w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110
                      ${newGroupColor === color 
                        ? 'border-gray-600 shadow-lg ring-2 ring-gray-300' 
                        : 'border-gray-200 hover:border-gray-400'
                      }
                    `}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Выбор иконки */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Иконка группы
              </label>
              
              <Input
                value={iconSearchTerm}
                onChange={(e) => setIconSearchTerm(e.target.value)}
                placeholder="Поиск иконки..."
                className="mb-3"
              />
              
              <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                {filteredIcons.map((icon) => (
                  <button
                    key={icon.key}
                    type="button"
                    onClick={() => setNewGroupIcon(icon.key)}
                    className={`
                      p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105
                      ${newGroupIcon === icon.key 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    title={icon.names[0]}
                  >
                    <div className="text-lg">{icon.emoji}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreating(false)
                  setNewGroupName('')
                  setNewGroupIcon('shopping-bag')
                  setNewGroupColor('#6366f1')
                  setNewGroupDescription('')
                  setIconSearchTerm('')
                }}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateGroup}
              >
                Создать
              </Button>
            </div>
          </div>
        )}

        {/* Список существующих групп */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Существующие группы ({groups.length})
            </h4>
            
            {groups.length > 0 && (
              <div className="flex items-center space-x-3">
                {selectedGroups.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteSelectedGroups}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isDeleting ? 'Удаление...' : `Удалить выбранные (${selectedGroups.size})`}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllGroups}
                >
                  {selectedGroups.size === groups.length ? 'Снять все' : 'Выбрать все'}
                </Button>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Загрузка групп...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📁</div>
              <p>Пока нет созданных групп</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div 
                  key={group.id} 
                  className={`flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                    selectedGroups.has(group.id) 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {editingGroup?.id === group.id ? (
                    <EditGroupForm
                      group={group}
                      onSave={handleUpdateGroup}
                      onCancel={() => setEditingGroup(null)}
                    />
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(group.id)}
                          onChange={() => handleToggleGroupSelection(group.id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                          style={{ backgroundColor: group.color + '20' }}
                        >
                          <span>
                            {availableIcons.find(icon => icon.key === group.icon)?.emoji || '📦'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{group.name}</div>
                          {group.description && (
                            <div className="text-sm text-gray-600 mb-1">{group.description}</div>
                          )}
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: group.color || '#6366f1' }}
                            />
                            <div className="text-xs text-gray-500">
                              Создана {new Date(group.created_at).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingGroup(group)}
                        >
                          Редактировать
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Удалить
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Кнопки управления */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="ghost" onClick={handleClose}>
            Закрыть
          </Button>
          <Button variant="primary" onClick={() => { onSuccess(); handleClose(); }}>
            Готово
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Компонент для редактирования группы
function EditGroupForm({ 
  group, 
  onSave, 
  onCancel 
}: { 
  group: Group
  onSave: (group: Group, name: string, icon: string, color: string, description: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(group.name)
  const [icon, setIcon] = useState(group.icon || 'shopping-bag')
  const [color, setColor] = useState(group.color || '#6366f1')
  const [description, setDescription] = useState(group.description || '')
  const [iconSearchTerm, setIconSearchTerm] = useState('')

  const filteredIcons = availableIcons.filter(iconItem => {
    if (iconSearchTerm === '') return true
    
    const searchLower = iconSearchTerm.toLowerCase()
    return iconItem.names.some(name => name.toLowerCase().includes(searchLower)) ||
           iconItem.key.toLowerCase().includes(searchLower)
  })

  return (
    <div className="flex-1 space-y-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название группы"
        className="w-full"
      />

      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Описание группы"
        className="w-full"
      />

      {/* Выбор цвета */}
      <div>
        <div className="flex flex-wrap gap-1 mb-2">
          {availableColors.slice(0, 8).map((colorOption) => (
            <button
              key={colorOption}
              type="button"
              onClick={() => setColor(colorOption)}
              className={`
                w-6 h-6 rounded-full border-2 transition-all
                ${color === colorOption 
                  ? 'border-gray-600 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-400'
                }
              `}
              style={{ backgroundColor: colorOption }}
            />
          ))}
        </div>
      </div>
      
      <div>
        <Input
          value={iconSearchTerm}
          onChange={(e) => setIconSearchTerm(e.target.value)}
          placeholder="Поиск иконки..."
          className="mb-2"
        />
        
        <div className="grid grid-cols-6 gap-1">
          {filteredIcons.slice(0, 12).map((iconItem) => (
            <button
              key={iconItem.key}
              type="button"
              onClick={() => setIcon(iconItem.key)}
              className={`
                p-1 rounded border transition-all
                ${icon === iconItem.key 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="text-sm">{iconItem.emoji}</div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Отмена
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => onSave(group, name, icon, color, description)}
          disabled={!name.trim()}
        >
          Сохранить
        </Button>
      </div>
    </div>
  )
}