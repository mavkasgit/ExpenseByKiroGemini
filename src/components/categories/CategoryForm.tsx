import { useState, useRef, useEffect } from 'react'
import { Input, Button, useToast } from '@/components/ui'
import { createCategory, updateCategory, getCategoryGroups } from '@/lib/actions/categories'
import type { Category, CreateCategoryData, CategoryGroup } from '@/types'

interface CategoryFormProps {
  category?: Category
  onSuccess: (data?: any) => void
  onCancel: () => void
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
  '#dc2626', // Красный темный
  '#7c3aed', // Фиолетовый темный
  '#059669', // Изумрудный
  '#d97706', // Оранжевый темный
  '#be123c', // Малиновый
  '#7e22ce', // Пурпурный темный
  '#1d4ed8', // Синий темный
  '#16a34a', // Зеленый темный
  '#ca8a04'  // Желтый темный
]

const availableIcons = [
  { key: 'shopping-bag', emoji: '🛍️', names: ['покупки', 'магазин', 'шоппинг', 'торговля', 'товары'] },
  { key: 'car', emoji: '🚗', names: ['машина', 'автомобиль', 'транспорт', 'авто', 'бензин'] },
  { key: 'home', emoji: '🏠', names: ['дом', 'жилье', 'квартира', 'недвижимость', 'аренда'] },
  { key: 'food', emoji: '🍽️', names: ['еда', 'питание', 'ресторан', 'кафе', 'обед'] },
  { key: 'health', emoji: '🏥', names: ['здоровье', 'медицина', 'больница', 'лечение', 'врач'] },
  { key: 'entertainment', emoji: '🎬', names: ['развлечения', 'кино', 'театр', 'досуг', 'отдых'] },
  { key: 'education', emoji: '📚', names: ['образование', 'учеба', 'школа', 'университет', 'курсы'] },
  { key: 'travel', emoji: '✈️', names: ['путешествия', 'отпуск', 'поездки', 'туризм', 'командировка'] },
  { key: 'sport', emoji: '⚽', names: ['спорт', 'фитнес', 'тренировки', 'футбол', 'зал'] },
  { key: 'clothes', emoji: '👕', names: ['одежда', 'вещи', 'гардероб', 'мода', 'обувь'] },
  { key: 'bills', emoji: '📄', names: ['счета', 'платежи', 'коммунальные', 'услуги', 'квитанции'] },
  { key: 'other', emoji: '📦', names: ['другое', 'прочее', 'разное', 'остальное', 'прочие'] },
  { key: 'coffee', emoji: '☕', names: ['кофе', 'напитки', 'чай', 'кофейня', 'бариста'] },
  { key: 'gas', emoji: '⛽', names: ['бензин', 'топливо', 'заправка', 'газ', 'азс'] },
  { key: 'phone', emoji: '📱', names: ['телефон', 'мобильный', 'связь', 'смартфон', 'сотовый'] },
  { key: 'internet', emoji: '🌐', names: ['интернет', 'сеть', 'wifi', 'провайдер', 'подключение'] },
  { key: 'electricity', emoji: '⚡', names: ['электричество', 'свет', 'энергия', 'электроэнергия', 'ток'] },
  { key: 'water', emoji: '💧', names: ['вода', 'водоснабжение', 'водопровод', 'канализация', 'сантехника'] },
  { key: 'rent', emoji: '🏢', names: ['аренда', 'квартплата', 'съем', 'наем', 'жилье'] },
  { key: 'insurance', emoji: '🛡️', names: ['страховка', 'страхование', 'полис', 'осаго', 'каско'] },
  { key: 'bank', emoji: '🏦', names: ['банк', 'кредит', 'займ', 'проценты', 'комиссия'] },
  { key: 'gift', emoji: '🎁', names: ['подарки', 'сувениры', 'праздники', 'день рождения', 'новый год'] },
  { key: 'pet', emoji: '🐕', names: ['питомцы', 'животные', 'собака', 'кошка', 'ветеринар'] },
  { key: 'beauty', emoji: '💄', names: ['красота', 'косметика', 'парикмахерская', 'салон', 'маникюр'] },
  { key: 'taxi', emoji: '🚕', names: ['такси', 'яндекс', 'убер', 'поездка', 'водитель'] },
  { key: 'bus', emoji: '🚌', names: ['автобус', 'общественный транспорт', 'маршрутка', 'проезд', 'билет'] },
  { key: 'train', emoji: '🚆', names: ['поезд', 'электричка', 'метро', 'железная дорога', 'ржд'] },
  { key: 'plane', emoji: '✈️', names: ['самолет', 'авиабилеты', 'перелет', 'аэропорт', 'авиакомпания'] },
  { key: 'hotel', emoji: '🏨', names: ['отель', 'гостиница', 'проживание', 'номер', 'бронирование'] },
  { key: 'restaurant', emoji: '🍴', names: ['ресторан', 'кафе', 'столовая', 'заведение', 'общепит'] },
  { key: 'pizza', emoji: '🍕', names: ['пицца', 'доставка', 'фастфуд', 'пиццерия', 'итальянская'] },
  { key: 'burger', emoji: '🍔', names: ['бургер', 'макдональдс', 'кфс', 'фастфуд', 'гамбургер'] },
  { key: 'beer', emoji: '🍺', names: ['пиво', 'алкоголь', 'бар', 'паб', 'напитки'] },
  { key: 'wine', emoji: '🍷', names: ['вино', 'алкоголь', 'винный', 'ресторан', 'дегустация'] },
  { key: 'pharmacy', emoji: '💊', names: ['аптека', 'лекарства', 'медикаменты', 'таблетки', 'препараты'] },
  { key: 'doctor', emoji: '👨‍⚕️', names: ['врач', 'доктор', 'медицина', 'консультация', 'прием'] },
  { key: 'dentist', emoji: '🦷', names: ['стоматолог', 'зубы', 'дантист', 'лечение', 'зубной'] },
  { key: 'gym', emoji: '🏋️', names: ['спортзал', 'фитнес', 'тренажерный зал', 'качалка', 'абонемент'] },
  { key: 'cinema', emoji: '🎭', names: ['кино', 'театр', 'билеты', 'фильм', 'спектакль'] },
  { key: 'music', emoji: '🎵', names: ['музыка', 'концерт', 'подписка', 'спотифай', 'яндекс музыка'] },
  { key: 'game', emoji: '🎮', names: ['игры', 'геймпад', 'консоль', 'стим', 'развлечения'] },
  { key: 'book', emoji: '📖', names: ['книги', 'литература', 'чтение', 'библиотека', 'учебники'] },
  { key: 'laptop', emoji: '💻', names: ['ноутбук', 'компьютер', 'техника', 'электроника', 'пк'] },
  { key: 'camera', emoji: '📷', names: ['камера', 'фотоаппарат', 'фото', 'съемка', 'техника'] },
  { key: 'tools', emoji: '🔧', names: ['инструменты', 'ремонт', 'стройка', 'мастер', 'работы'] },
  { key: 'garden', emoji: '🌱', names: ['сад', 'огород', 'растения', 'дача', 'цветы'] },
  { key: 'cleaning', emoji: '🧽', names: ['уборка', 'чистка', 'моющие', 'химия', 'клининг'] },
  { key: 'laundry', emoji: '👔', names: ['стирка', 'химчистка', 'прачечная', 'одежда', 'чистка'] },
  { key: 'baby', emoji: '👶', names: ['ребенок', 'дети', 'малыш', 'детские', 'игрушки'] },
  { key: 'school', emoji: '🎓', names: ['школа', 'образование', 'учеба', 'канцелярия', 'учебники'] },
  { key: 'work', emoji: '💼', names: ['работа', 'офис', 'командировка', 'деловые', 'карьера'] }
]

// Функция для случайного выбора цвета
const getRandomColor = () => {
  return availableColors[Math.floor(Math.random() * availableColors.length)]
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
  const [iconSearchTerm, setIconSearchTerm] = useState('')
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

  // Фильтрация иконок по поисковому запросу
  const filteredIcons = availableIcons.filter(icon => {
    if (iconSearchTerm === '') return true
    
    const searchLower = iconSearchTerm.toLowerCase()
    
    // Поиск по русским названиям
    const matchesNames = icon.names.some(name => 
      name.toLowerCase().includes(searchLower)
    )
    
    // Поиск по эмодзи
    const matchesEmoji = icon.emoji.includes(iconSearchTerm)
    
    // Поиск по английскому ключу (для совместимости)
    const matchesKey = icon.key.toLowerCase().includes(searchLower)
    
    return matchesNames || matchesEmoji || matchesKey
  })

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Название */}
      <Input
        ref={nameInputRef}
        label="Название категории"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        placeholder="Например: Продукты, Транспорт, Развлечения"
        required
      />

      {/* Выбор группы */}
      <div>
        <label htmlFor="category_group_id" className="block text-sm font-medium text-gray-700 mb-1">
          Группа
        </label>
        <select
          id="category_group_id"
          value={formData.category_group_id || ''}
          onChange={(e) => handleChange('category_group_id', e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Без группы</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Выбор иконки */}
      <div className="flex items-center">
        <label className="text-sm font-medium text-gray-700 mr-4">Иконка</label>
        <div className="flex-1 flex space-x-2 overflow-x-auto p-2">
          {filteredIcons.map((icon) => (
            <button
              key={icon.key}
              type="button"
              onClick={() => handleChange('icon', icon.key)}
              className={`
                w-10 h-10 p-2 rounded-lg border-2 flex-shrink-0 transition-all duration-200 hover:scale-105
                ${formData.icon === icon.key 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              title={icon.names[0]}
            >
              <div className="text-xl">{icon.emoji}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center">
        <label className="text-sm font-medium text-gray-700 mr-4">Цвет</label>
        <div className="flex-1 flex space-x-2 overflow-x-auto p-2">
          {availableColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleChange('color', color)}
              className={`
                w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 hover:scale-110
                ${formData.color === color 
                  ? 'ring-2 ring-offset-2 ring-blue-500 border-white' 
                  : 'border-transparent'
                }
              `}
              style={{ backgroundColor: color }}
            >
              {formData.color === color && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleChange('color', getRandomColor())}
        >
          🎲
        </Button>
      </div>

      {/* Предварительный просмотр */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Предварительный просмотр
        </label>
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: formData.color + '20' }}
          >
            <span>
              {availableIcons.find(icon => icon.key === formData.icon)?.emoji || '📦'}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {formData.name || 'Название категории'}
            </div>
            <div 
              className="w-16 h-1 rounded-full mt-1"
              style={{ backgroundColor: formData.color }}
            />
          </div>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
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
        >
          {category ? 'Обновить' : 'Создать'}
        </Button>
      </div>
    </form>
  )
}