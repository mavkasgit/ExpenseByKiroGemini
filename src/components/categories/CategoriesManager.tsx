'use client'

import { useState, useEffect, useRef } from 'react'
import { DndContext, closestCorners } from '@dnd-kit/core'
import { Button, Modal, Card, CardContent, useToast } from '@/components/ui'
import { CategoryForm } from './CategoryForm'
import { StandardCategoriesModal } from './StandardCategoriesModal'
import { CategoryKeywordsModal } from './CategoryKeywordsModal'
import { GroupsModal } from './GroupsModal'
import { deleteAllCategories, resetToDefaultCategories, moveCategoryToGroup, getCategoriesWithGroups } from '@/lib/actions/categories'
import type { Category } from '@/types'
import { CategoryCard } from './CategoryCard'

interface CategoriesManagerProps {
  initialCategories: Category[]
  initialGroups?: CategoryGroup[]
}

interface CategoryGroup {
  id: string
  name: string
  icon?: string
  color?: string
  sort_order?: number
}

export function CategoriesManager({ initialCategories, initialGroups = [] }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>(initialGroups)
  const [isLoadingGroups, setIsLoadingGroups] = useState(initialGroups.length === 0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [keywordsCategory, setKeywordsCategory] = useState<Category | null>(null)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showStandardModal, setShowStandardModal] = useState(false)
  const [showGroupsModal, setShowGroupsModal] = useState(false)
  const [groupSummary, setGroupSummary] = useState<Record<string, number>>({});
  const bulkActionsRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  // Загружаем группы при инициализации (только если нет данных)
  useEffect(() => {
    if (categoryGroups.length === 0) {
      const loadGroups = async () => {
        try {
          const result = await getCategoriesWithGroups()
          if ('success' in result && result.data) {
            setCategoryGroups(result.data.groups)
            // Обновляем категории если они изменились
            if (result.data.categories.length !== categories.length) {
              setCategories(result.data.categories)
            }
          }
        } catch (error) {
          console.error('Ошибка загрузки данных:', error)
        } finally {
          setIsLoadingGroups(false)
        }
      }
      
      loadGroups()
    } else {
      setIsLoadingGroups(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Намеренно пустой массив - загружаем только при монтировании

  // Группируем категории по group_name
  const groupedCategories = categories.reduce((groups, category) => {
    const groupId = category.category_group_id || 'unassigned';
    if (!groups[groupId]) {
      groups[groupId] = [];
    }
    groups[groupId].push(category);
    return groups;
  }, {} as Record<string, Category[]>)

  // Добавляем все группы из category_groups (включая пустые)
  categoryGroups.forEach(group => {
    if (!groupedCategories[group.name]) {
      groupedCategories[group.name] = []
    }
  })

  // Закрываем меню при клике вне его
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bulkActionsRef.current && !bulkActionsRef.current.contains(event.target as Node)) {
        setShowBulkActions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Универсальная функция обновления всех данных
  const refreshAllData = async () => {
    try {
      const result = await getCategoriesWithGroups()
      if ('success' in result && result.data) {
        setCategoryGroups(result.data.groups)
        setCategories(result.data.categories)
      }
    } catch (error) {
      console.error('Ошибка обновления данных:', error)
      // В случае ошибки перезагружаем страницу
      window.location.reload()
    }
  }

  const handleCreateSuccess = async (newCategory?: any) => {
    setIsCreateModalOpen(false)
    if (newCategory) {
      setCategories(prev => [newCategory, ...prev])
    } else {
      // Обновляем все данные
      await refreshAllData()
    }
  }

  const handleEditSuccess = async (updatedCategory?: any) => {
    setEditingCategory(null)
    if (updatedCategory) {
      setCategories(prev => prev.map(cat => 
        cat.id === updatedCategory.id ? updatedCategory : cat
      ))
    } else {
      // Обновляем все данные
      await refreshAllData()
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
  }

  const handleKeywords = (category: Category) => {
    setKeywordsCategory(category)
  }

  const handleDeleteCategory = (categoryId: string) => {
    // Оптимистично удаляем из интерфейса
    setCategories(prev => prev.filter(cat => cat.id !== categoryId))
  }



  const handleDeleteAll = async () => {
    if (!confirm('Вы уверены, что хотите удалить ВСЕ категории и группы? Это действие нельзя отменить.')) {
      return
    }

    // Оптимистично очищаем список
    setCategories([])
    setCategoryGroups([])
    setIsDeletingAll(true)
    
    try {
      const result = await deleteAllCategories()
      
      if (result.error) {
        toast.error(result.error)
        // Восстанавливаем данные при ошибке
        await refreshAllData()
      } else {
        toast.success(result.message || 'Все категории удалены')
        // Обновляем все данные
        await refreshAllData()
      }
    } catch (error) {
      toast.error('Произошла ошибка при удалении категорий')
      // Восстанавливаем данные при ошибке
      await refreshAllData()
    } finally {
      setIsDeletingAll(false)
    }
  }

  const handleResetToDefaults = async () => {
    if (!confirm('Вы уверены, что хотите сбросить все категории и группы к стандартным? Все ваши пользовательские данные будут удалены.')) {
      return
    }

    setIsResetting(true)
    
    try {
      const result = await resetToDefaultCategories()
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message || 'Категории сброшены к стандартным')
        // Обновляем все данные
        await refreshAllData()
      }
    } catch (error) {
      toast.error('Произошла ошибка при сбросе категорий')
    } finally {
      setIsResetting(false)
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Если перетаскиваем на группу
    if (overId.startsWith('group-')) {
      const newGroupName = overId.replace('group-', '')
      const newGroupId = overId.startsWith('group-') ? overId.replace('group-', '') : null;
      const category = categories.find(cat => cat.id === activeId)
      
      if (category && category.category_group_id !== newGroupId) {
        // Оптимистично обновляем UI
        setCategories(prev => prev.map(cat => 
          cat.id === activeId 
            ? { ...cat, group_name: newGroupName }
            : cat
        ))

        // Обновляем в базе данных
        try {
          const result = await moveCategoryToGroup(activeId, newGroupName)
          if (result.error) {
            // Откатываем изменения при ошибке
            setCategories(prev => prev.map(cat => 
              cat.id === activeId 
                ? { ...cat, category_group_id: category.category_group_id }
                : cat
            ))
            toast.error(result.error)
          } else {
            toast.success(`Категория перемещена в группу "${newGroupName}"`)
          }
        } catch (error) {
          // Откатываем изменения при ошибке
          setCategories(prev => prev.map(cat => 
            cat.id === activeId 
              ? { ...cat, category_group_id: category.category_group_id }
              : cat
          ))
          toast.error('Произошла ошибка при перемещении категории')
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Панель управления */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-lg font-medium text-gray-700">
            Всего категорий: <span className="text-indigo-600 font-semibold">{categories.length}</span>
          </span>
          <span className="text-sm text-gray-500">
            Перетаскивайте категории между группами
          </span>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Создать категорию
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowGroupsModal(true)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          >
            Группы
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowStandardModal(true)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          >
            {categories.length === 0 ? 'Создать стандартные' : 'Добавить стандартные'}
          </Button>
          
          {categories.length > 0 && (
            <div className="relative" ref={bulkActionsRef}>
              <Button
                variant="ghost"
                onClick={() => setShowBulkActions(!showBulkActions)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                }
              >
                Действия
              </Button>
              
              {showBulkActions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      Массовые операции
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowBulkActions(false)
                        handleResetToDefaults()
                      }}
                      disabled={isResetting}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <div>
                        <div>{isResetting ? 'Сброс...' : 'Сбросить к стандартным'}</div>
                        <div className="text-xs text-gray-500">Заменить все на стандартные</div>
                      </div>
                    </button>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button
                      onClick={() => {
                        setShowBulkActions(false)
                        handleDeleteAll()
                      }}
                      disabled={isDeletingAll}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <div>
                        <div>{isDeletingAll ? 'Удаление...' : 'Удалить все категории и группы'}</div>
                        <div className="text-xs text-red-500">Удалить все категории и группы без исключения</div>
                      </div>
                    </button>
                    
                    <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                      ⚠️ Недоступно, если есть связанные расходы
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Список категорий */}
      {isLoadingGroups ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Загрузка групп...</p>
        </div>
      ) : categories.length === 0 ? (
        <Card variant="outlined" className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              У вас пока нет категорий
            </h3>
            <p className="text-gray-600">
              Создайте категории для организации ваших расходов
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(groupedCategories)
              .sort(([a, aCats], [b, bCats]) => {
                // Получаем порядок сортировки из category_groups
                const groupA = categoryGroups.find(g => g.name === a)
                const groupB = categoryGroups.find(g => g.name === b)
                
                const sortOrderA = groupA?.sort_order || 999
                const sortOrderB = groupB?.sort_order || 999
                
                // Сначала сортируем по sort_order
                if (sortOrderA !== sortOrderB) {
                  return sortOrderA - sortOrderB
                }
                
                // Затем по количеству категорий (больше сверху)
                if (bCats.length !== aCats.length) {
                  return bCats.length - aCats.length
                }
                
                // Затем по алфавиту
                return a.localeCompare(b)
              })
              .map(([groupId, groupCategories]) => {
                const group = categoryGroups.find(g => g.id === groupId);
                const groupName = groupId === 'unassigned' ? 'Без группы' : group?.name || 'Неизвестная группа';
                // Вычисляем высоту на основе количества категорий
                const minHeight =
                  groupCategories.length === 0
                    ? 120
                    : Math.max(120, groupCategories.length * 60 + 80);
              
                return (
                  <div key={groupName} className="space-y-3">
                    {/* Заголовок группы */}
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const group = categoryGroups.find(g => g.name === groupName)
                        const iconMap: Record<string, string> = {
                          'shopping-bag': '🛍️',
                          'car': '🚗',
                          'home': '🏠',
                          'food': '🍽️',
                          'health': '🏥',
                          'entertainment': '🎬',
                          'education': '📚',
                          'travel': '✈️',
                          'other': '📦'
                        }
                        const emoji = group?.icon ? iconMap[group.icon] || '📦' : '📦'
                        
                        return (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                              style={{ backgroundColor: (group?.color || '#6366f1') + '20' }}
                            >
                              {emoji}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">{groupName}</h3>
                            <span className="text-sm text-gray-500">
                              ({groupCategories.length})
                            </span>
                            {groupSummary[groupId] && (
                              <span className="text-xs font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                                {new Intl.NumberFormat('ru-RU').format(groupSummary[groupId])} ₽
                              </span>
                            )}
                          </div>
                        )
                      })()}
                    </div>
              
                    {/* Область для drop */}
                    <div
                      className="p-3 border-2 border-dashed border-gray-200 rounded-lg transition-colors hover:border-gray-300 bg-gray-50"
                      style={{ minHeight: `${minHeight}px` }}
                                              onDrop={(e) => {
                        e.preventDefault();
                        const categoryId = e.dataTransfer.getData("text/plain");
                        if (categoryId) {
                          handleDragEnd({
                            active: { id: categoryId },
                            over: { id: `group-${groupId}` },
                          } as any);
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <div className="space-y-2">
                        {groupCategories.map((category) => (
                          <div
                            key={category.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", category.id);
                            }}
                            className="cursor-move"
                          >
                            <CategoryCard
                              category={category}
                              onEdit={handleEdit}
                              onDelete={handleDeleteCategory}
                              onKeywords={handleKeywords}
                              isDraggable={false}
                            />
                          </div>
                        ))}
              
                        {groupCategories.length === 0 && (
                          <div className="text-center py-4 text-gray-400">
                            <p className="text-sm">Перетащите категории сюда</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </DndContext>
      )}

      {/* Статистика */}
      {categories.length > 0 && (
        <Card variant="elevated">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Статистика категорий
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {categories.length}
                </div>
                <div className="text-sm text-gray-600">
                  Всего категорий
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {categories.filter(c => c.created_at && c.created_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).length}
                </div>
                <div className="text-sm text-gray-600">
                  Создано за неделю
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(categories.map(c => c.color)).size}
                </div>
                <div className="text-sm text-gray-600">
                  Уникальных цветов
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Модальное окно создания */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создать новую категорию"
        description="Заполните информацию о новой категории расходов"
        size="md"
      >
        <CategoryForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Модальное окно редактирования */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Редактировать категорию"
        description="Измените информацию о категории"
        size="md"
      >
        {editingCategory && (
          <CategoryForm
            category={editingCategory}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingCategory(null)}
          />
        )}
      </Modal>

      {/* Модальное окно стандартных категорий */}
      <StandardCategoriesModal
        isOpen={showStandardModal}
        onClose={() => setShowStandardModal(false)}
        onSuccess={async () => {
          // Обновляем все данные
          await refreshAllData()
        }}
      />

      {/* Модальное окно ключевых слов */}
      {keywordsCategory && (
        <CategoryKeywordsModal
          isOpen={!!keywordsCategory}
          onClose={() => setKeywordsCategory(null)}
          category={keywordsCategory}
        />
      )}

      {/* Модальное окно управления группами */}
      <GroupsModal
        isOpen={showGroupsModal}
        onClose={() => setShowGroupsModal(false)}
        onSuccess={async () => {
          // Обновляем все данные
          await refreshAllData()
        }}
      />
    </div>
  )
}