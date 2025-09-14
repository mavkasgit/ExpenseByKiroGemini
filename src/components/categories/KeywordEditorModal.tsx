'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Card, Modal, ErrorMessage } from '@/components/ui'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { SimpleToast } from '@/components/ui/Toast'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { 
  createKeyword, 
  updateKeyword, 
  deleteKeyword 
} from '@/lib/actions/keywords'
import { UserSettings } from '@/lib/actions/settings'
import { formatDateLocaleRu } from '@/lib/utils/dateUtils'
import { transliterate } from '@/lib/utils/transliteration'
import type { CategoryKeyword, Category } from '@/types'

interface KeywordEditorModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category
  categories: Category[]
  keywords: CategoryKeyword[]
  userSettings: UserSettings
  onKeywordChange?: () => void
}

export function KeywordEditorModal({ isOpen, onClose, category, categories, keywords, userSettings, onKeywordChange }: KeywordEditorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingKeyword, setEditingKeyword] = useState<CategoryKeyword | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deletingKeywordId, setDeletingKeywordId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    keyword: '',
    cyrillic_keyword: '',
    category_id: category.id
  })

  const handleLatinInputChange = (value: string) => {
    const cyrillicValue = transliterate(value);
    setFormData(prev => ({ ...prev, keyword: value, cyrillic_keyword: cyrillicValue }));
  }

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.keyword.trim()) {
      setError('Заполните ключевое слово')
      return
    }
    setIsSubmitting(true)
    try {
      const result = await createKeyword({
        keyword: formData.keyword.trim(),
        cyrillic_keyword: userSettings.enable_bilingual_keywords ? formData.cyrillic_keyword.trim() : null,
        category_id: formData.category_id
      })
      if (result.error) {
        setError(result.error)
        setToast({ message: result.error, type: 'error' })
      } else {
        setToast({ message: 'Ключевое слово успешно добавлено', type: 'success' })
        setIsAddModalOpen(false)
        setFormData({ keyword: '', cyrillic_keyword: '', category_id: category.id })
        onKeywordChange?.()
      }
    } catch (err) {
      console.error("Failed to add keyword:", err);
      setError("Произошла непредвиденная ошибка.");
      setToast({ message: "Произошла непредвиденная ошибка.", type: 'error' });
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingKeyword || !formData.keyword.trim()) {
      setError('Заполните ключевое слово')
      return
    }
    setIsSubmitting(true)
    try {
      const result = await updateKeyword(editingKeyword.id, {
        keyword: formData.keyword.trim(),
        cyrillic_keyword: userSettings.enable_bilingual_keywords ? formData.cyrillic_keyword.trim() : null,
        category_id: formData.category_id
      })
      if (result.error) {
        setError(result.error)
        setToast({ message: result.error, type: 'error' })
      } else {
        setToast({ message: 'Ключевое слово успешно обновлено', type: 'success' })
        setIsEditModalOpen(false)
        setEditingKeyword(null)
        onKeywordChange?.()
      }
    } catch (err) {
      console.error("Failed to edit keyword:", err);
      setError("Произошла непредвиденная ошибка.");
      setToast({ message: "Произошла непредвиденная ошибка.", type: 'error' });
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRequest = (keywordId: string) => {
    setDeletingKeywordId(keywordId);
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingKeywordId) return;
    setIsSubmitting(true);
    try {
      const result = await deleteKeyword(deletingKeywordId);
      if (result.error) {
        setError(result.error);
        setToast({ message: result.error, type: 'error' });
      } else {
        setToast({ message: 'Ключевое слово успешно удалено', type: 'success' });
        onKeywordChange?.();
      }
    } catch (err) {
      console.error("Failed to delete keyword:", err);
      setError("Произошла непредвиденная ошибка.");
      setToast({ message: "Произошла непредвиденная ошибка.", type: 'error' });
    } finally {
      setIsSubmitting(false);
      setIsConfirmingDelete(false);
      setDeletingKeywordId(null);
    }
  };

  const openEditModal = (keyword: CategoryKeyword) => {
    setEditingKeyword(keyword)
    setFormData({
      keyword: keyword.keyword,
      cyrillic_keyword: keyword.cyrillic_keyword || '',
      category_id: keyword.category_id || category.id
    })
    setIsEditModalOpen(true)
  }

  const renderAddEditModals = () => (
    <>
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Добавить ключевое слово">
        <form onSubmit={handleAddKeyword} className="space-y-4">
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">Ключевое слово (латиница) *</label>
            <Input id="keyword" type="text" value={formData.keyword} onChange={(e) => handleLatinInputChange(e.target.value)} placeholder="naprimer: taxi" required />
          </div>
          {userSettings.enable_bilingual_keywords && (
            <div>
              <label htmlFor="cyrillic_keyword" className="block text-sm font-medium text-gray-700 mb-1">Ключевое слово (кириллица)</label>
              <Input id="cyrillic_keyword" type="text" value={formData.cyrillic_keyword} onChange={(e) => setFormData({ ...formData, cyrillic_keyword: e.target.value })} placeholder="например: такси" />
              <p className="text-xs text-gray-500 mt-1">Автоматически транслитерировано. Можно изменить.</p>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Отмена</Button>
            <Button type="submit" isLoading={isSubmitting}>{isSubmitting ? 'Добавление...' : 'Добавить'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Редактировать ключевое слово">
        <form onSubmit={handleEditKeyword} className="space-y-4">
          <div>
            <label htmlFor="edit-keyword" className="block text-sm font-medium text-gray-700 mb-1">Ключевое слово (латиница) *</label>
            <Input id="edit-keyword" type="text" value={formData.keyword} onChange={(e) => handleLatinInputChange(e.target.value)} required />
          </div>
          {userSettings.enable_bilingual_keywords && (
            <div>
              <label htmlFor="edit-cyrillic_keyword" className="block text-sm font-medium text-gray-700 mb-1">Ключевое слово (кириллица)</label>
              <Input id="edit-cyrillic_keyword" type="text" value={formData.cyrillic_keyword} onChange={(e) => setFormData({ ...formData, cyrillic_keyword: e.target.value })} />
            </div>
          )}
           <div>
            <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
            <SearchableSelect options={categories.map(c => ({ value: c.id, label: c.name, color: c.color || undefined }))} value={formData.category_id} onChange={(v) => setFormData({ ...formData, category_id: v })} required />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Отмена</Button>
            <Button type="submit" isLoading={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ключевые слова: ${category.name}`} size="lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Управляйте ключевыми словами для автоматической категоризации.</p>
          <Button onClick={() => { setFormData({ keyword: '', cyrillic_keyword: '', category_id: category.id }); setIsAddModalOpen(true); }} disabled={isSubmitting}>
            Добавить ключевое слово
          </Button>
        </div>

        {error && <ErrorMessage error={error} onDismiss={() => setError(null)} showDismiss />}

        {keywords.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">У этой категории пока нет ключевых слов</div>
            <p className="text-sm text-gray-400 mt-2">Добавьте слова для автоматической категоризации расходов.</p>
          </Card>
        ) : (
          <div className="grid gap-4 max-h-96 overflow-y-auto p-1">
            {keywords.map((keyword) => (
              <Card key={keyword.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {userSettings.enable_bilingual_keywords && keyword.cyrillic_keyword ? (
                          <>
                            {keyword.cyrillic_keyword}
                            <span className="text-gray-500 font-normal ml-1">({keyword.keyword})</span>
                          </>
                        ) : (
                          keyword.keyword
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Создано: {formatDateLocaleRu(keyword.created_at || '')}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(keyword)} disabled={isSubmitting}>Изменить</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteRequest(keyword.id)} disabled={isSubmitting} className="text-red-600 hover:text-red-700 hover:bg-red-50">Удалить</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {renderAddEditModals()}

        <ConfirmationModal 
          isOpen={isConfirmingDelete}
          onClose={() => setIsConfirmingDelete(false)}
          onConfirm={handleConfirmDelete}
          title="Удалить ключевое слово?"
          message="Это действие нельзя отменить."
          isLoading={isSubmitting}
        />

        {toast && <SimpleToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </Modal>
  )
}
