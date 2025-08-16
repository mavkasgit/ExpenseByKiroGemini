'use client'

import { useState } from 'react'
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useToast,
  ErrorMessage
} from '@/components/ui'

export default function UIDemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const toast = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (e.target.value.length < 3) {
      setInputError('Минимум 3 символа')
    } else {
      setInputError('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">UI Components Demo</h1>
          <p className="text-gray-600">Демонстрация всех базовых UI компонентов</p>
        </div>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Различные варианты кнопок</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
              <Button isLoading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <Button 
                leftIcon={<span>📧</span>}
                variant="primary"
              >
                With Left Icon
              </Button>
              <Button 
                rightIcon={<span>→</span>}
                variant="outline"
              >
                With Right Icon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>Поля ввода с различными состояниями</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Обычное поле"
                placeholder="Введите текст"
                helperText="Это поле помощи"
              />
              <Input 
                label="Поле с ошибкой"
                value={inputValue}
                onChange={handleInputChange}
                error={inputError}
                placeholder="Минимум 3 символа"
              />
              <Input 
                label="Email"
                type="email"
                leftIcon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
                placeholder="user@example.com"
              />
              <Input 
                label="Пароль"
                type="password"
                rightIcon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
                placeholder="Введите пароль"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Обычная карточка</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Содержимое карточки</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Действие</Button>
            </CardFooter>
          </Card>

          <Card variant="outlined">
            <CardHeader>
              <CardTitle>Outlined Card</CardTitle>
              <CardDescription>Карточка с рамкой</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Содержимое карточки</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">Действие</Button>
            </CardFooter>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>Карточка с тенью</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Содержимое карточки</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="secondary">Действие</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Toast Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
            <CardDescription>Уведомления различных типов</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => toast.success('Операция выполнена успешно!')}
                variant="primary"
              >
                Success Toast
              </Button>
              <Button 
                onClick={() => toast.error('Произошла ошибка!')}
                variant="danger"
              >
                Error Toast
              </Button>
              <Button 
                onClick={() => toast.warning('Внимание! Проверьте данные')}
                variant="secondary"
              >
                Warning Toast
              </Button>
              <Button 
                onClick={() => toast.info('Информационное сообщение')}
                variant="ghost"
              >
                Info Toast
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        <Card>
          <CardHeader>
            <CardTitle>Modal</CardTitle>
            <CardDescription>Модальные окна</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsModalOpen(true)}>
              Открыть модальное окно
            </Button>
          </CardContent>
        </Card>

        {/* Error Message */}
        <Card>
          <CardHeader>
            <CardTitle>Error Messages</CardTitle>
            <CardDescription>Сообщения об ошибках</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ErrorMessage error="Invalid login credentials" />
              <ErrorMessage error="User already registered" />
              <ErrorMessage error="Network error occurred" />
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center space-y-4">
          <div>
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              variant="primary"
            >
              ← Вернуться на главную
            </Button>
          </div>
          <div>
            <Button 
              onClick={() => window.location.href = '/categories'}
              variant="outline"
            >
              Посмотреть категории
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Пример модального окна"
        description="Это демонстрация модального окна с различными элементами"
        size="md"
      >
        <ModalBody>
          <div className="space-y-4">
            <Input 
              label="Имя"
              placeholder="Введите ваше имя"
            />
            <Input 
              label="Email"
              type="email"
              placeholder="user@example.com"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Введите описание..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="ghost" 
            onClick={() => setIsModalOpen(false)}
          >
            Отмена
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              toast.success('Данные сохранены!')
              setIsModalOpen(false)
            }}
          >
            Сохранить
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}