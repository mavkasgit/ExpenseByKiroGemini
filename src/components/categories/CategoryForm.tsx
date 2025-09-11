'use client'

import { useState, useRef, useEffect } from 'react'
import { Input, Button, useToast } from '@/components/ui'
import { createCategory, updateCategory, getCategoryGroups } from '@/lib/actions/categories'
import type { Category, CreateCategoryData, CategoryGroup } from '@/types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { availableColors, availableIcons, getRandomColor } from '@/lib/utils/category-constants';

interface CategoryFormProps {
  category?: Category
  onSuccess: (data?: any) => void
  onCancel: () => void
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: category?.name || '',
    color: category?.color || getRandomColor(),
    icon: category?.icon || 'shopping-bag',
    category_group_id: category?.category_group_id || null
  })
  const [groups, setGroups] = useState<CategoryGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [iconSearch, setIconSearch] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  // Автофокус на поле ввода названия
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [])

  // Загружаем доступные группы
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const result = await getCategoryGroups()
        if ('success' in result && result.data) {
          setGroups(result.data)
        } 
      } catch (error) {
        toast.error('Не удалось загрузить группы')
      }
    }
    
    loadGroups()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    try {
      const result = category 
        ? await updateCategory(category.id, formData)
        : await createCategory(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(category ? 'Категория обновлена' : 'Категория создана')
        onSuccess(result.data)
      }
    } catch (error) {
      toast.error('Произошла ошибка при сохранении')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof CreateCategoryData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const selectedIconEmoji = availableIcons.find(i => i.key === formData.icon)?.emoji;

  const filteredIcons = availableIcons.filter(icon => 
    icon.names.some(name => name.toLowerCase().includes(iconSearch.toLowerCase())) ||
    icon.emoji.includes(iconSearch)
  );

  const groupOptions = [
    { value: '', label: 'Без группы' },
    ...groups.map(g => ({ value: g.id, label: g.name, color: g.color || undefined }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <Input
        ref={nameInputRef}
        label="Название категории"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        placeholder="Например: Продукты, Транспорт, Развлечения"
        required
        autoComplete="off"
      />

      <div>
        <SearchableSelect 
          options={groupOptions}
          value={formData.category_group_id || ''}
          onChange={(value) => handleChange('category_group_id', value || null)}
          placeholder="Выберите группу..."
        />
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <span className="text-xl">{selectedIconEmoji}</span>
              <span>Иконка</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-2">
            <Input 
              placeholder="Поиск иконки..."
              value={iconSearch}
              onChange={e => setIconSearch(e.target.value)}
              className="mb-2"
              autoComplete="off"
            />
            <div className="grid grid-cols-7 gap-1">
              {filteredIcons.map(icon => (
                <button key={icon.key} type="button" onClick={() => handleChange('icon', icon.key)} className={`w-10 h-10 p-2 rounded-lg border-2 transition-all ${formData.icon === icon.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>{icon.emoji}</button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: formData.color || '#ccc' }} />
              <span>Цвет</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-6 gap-1">
              {availableColors.map(color => (
                <button key={color} type="button" onClick={() => handleChange('color', color)} className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? 'ring-2 ring-offset-1 ring-blue-500 border-white' : 'border-transparent'}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button type="button" variant="outline" size="sm" onClick={() => handleChange('color', getRandomColor())} title="Случайный цвет">🎲</Button>

        <div className="flex-grow"></div>

        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="min-w-[120px]"
          >
            {category ? 'Обновить' : 'Создать'}
          </Button>
        </div>
      </div>
    </form>
  )
}
