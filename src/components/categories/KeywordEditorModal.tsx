'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button, Input, Card, Modal, ErrorMessage } from '@/components/ui'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { SimpleToast } from '@/components/ui/Toast'
import {
  createKeyword,
  updateKeyword,
  deleteKeyword
} from '@/lib/actions/keywords'
import { createKeywordSynonym, deleteKeywordSynonym } from '@/lib/actions/synonyms'
import { UserSettings } from '@/lib/actions/settings'
import { formatDateLocaleRu } from '@/lib/utils/dateUtils'
import type { CategoryKeywordWithSynonyms, Category, KeywordSynonym } from '@/types'

interface KeywordEditorModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category
  categories: Category[]
  keywords: CategoryKeywordWithSynonyms[]
  userSettings: UserSettings
  onKeywordChange?: () => void
}

export function KeywordEditorModal({ isOpen, onClose, category, categories, keywords, userSettings, onKeywordChange }: KeywordEditorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deletingKeywordId, setDeletingKeywordId] = useState<string | null>(null)
  const [synonymInputs, setSynonymInputs] = useState<Record<string, string>>({})
  const [synonymSaving, setSynonymSaving] = useState<Record<string, boolean>>({})
  const [synonymDeleting, setSynonymDeleting] = useState<Record<string, boolean>>({})
  const [synonymErrors, setSynonymErrors] = useState<Record<string, string | null>>({})
  const keywordInputRef = useRef<HTMLInputElement>(null);
  const [optimisticKeywords, setOptimisticKeywords] = useState(keywords);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditText, setInlineEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    keyword: '',
    category_id: category.id
  })

  useEffect(() => {
    setOptimisticKeywords(keywords);
  }, [keywords]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        keywordInputRef.current?.focus();
      }, 100);
    } else {
      setInlineEditingId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const initialInputs: Record<string, string> = {}
    keywords.forEach(keyword => {
      initialInputs[keyword.id] = ''
    })
    setSynonymInputs(initialInputs)
  }, [keywords])

  const filteredKeywords = useMemo(() => {
    if (!searchQuery) {
      return optimisticKeywords;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return optimisticKeywords.filter(keyword => {
      const keywordMatch = keyword.keyword.toLowerCase().includes(lowercasedQuery);
      const synonymMatch = keyword.keyword_synonyms?.some(synonym => 
        synonym.synonym.toLowerCase().includes(lowercasedQuery)
      );
      return keywordMatch || synonymMatch;
    });
  }, [searchQuery, optimisticKeywords]);

  const handleSynonymInputChange = useCallback((keywordId: string, value: string) => {
    setSynonymInputs(prev => ({ ...prev, [keywordId]: value }))
  }, [])

  const handleAddSynonym = useCallback(async (keywordId: string) => {
    const synonymValue = (synonymInputs[keywordId] || '').trim();
    if (synonymValue.length < 2) {
      setSynonymErrors(prev => ({ ...prev, [keywordId]: 'Синоним должен содержать не менее 2 символов' }));
      return;
    }

    const tempSynonymId = `temp-synonym-${Date.now()}`;
    const newSynonym: KeywordSynonym = {
      id: tempSynonymId,
      synonym: synonymValue,
      keyword_id: keywordId,
      user_id: '', // Will be set by server
      created_at: new Date().toISOString(),
    };

    setOptimisticKeywords(prevKeywords =>
      prevKeywords.map(kw => {
        if (kw.id === keywordId) {
          return {
            ...kw,
            keyword_synonyms: [...(kw.keyword_synonyms || []), newSynonym],
          };
        }
        return kw;
      })
    );
    setSynonymInputs(prev => ({ ...prev, [keywordId]: '' }));
    setSynonymErrors(prev => ({ ...prev, [keywordId]: null }));

    try {
      const result = await createKeywordSynonym({ keyword_id: keywordId, synonym: synonymValue });
      if (result.error) {
        setToast({ message: result.error, type: 'error' });
        setOptimisticKeywords(prevKeywords =>
          prevKeywords.map(kw => {
            if (kw.id === keywordId) {
              return {
                ...kw,
                keyword_synonyms: (kw.keyword_synonyms || []).filter(s => s.id !== tempSynonymId),
              };
            }
            return kw;
          })
        );
      } else {
        onKeywordChange?.();
      }
    } catch (err) {
      console.error('Failed to add synonym', err);
      setToast({ message: 'Не удалось добавить синоним', type: 'error' });
      setOptimisticKeywords(prevKeywords =>
        prevKeywords.map(kw => {
          if (kw.id === keywordId) {
            return {
              ...kw,
              keyword_synonyms: (kw.keyword_synonyms || []).filter(s => s.id !== tempSynonymId),
            };
          }
          return kw;
        })
      );
    }
  }, [onKeywordChange, synonymInputs]);

  const handleDeleteSynonym = useCallback(async (keywordId: string, synonymId: string) => {
    setSynonymDeleting(prev => ({ ...prev, [synonymId]: true }))
    try {
      const result = await deleteKeywordSynonym({ id: synonymId, keyword_id: keywordId })
      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else {
        setToast({ message: 'Синоним удален', type: 'success' })
        onKeywordChange?.()
      }
    } catch (err) {
      console.error('Failed to delete synonym', err)
      setToast({ message: 'Не удалось удалить синоним', type: 'error' })
    } finally {
      setSynonymDeleting(prev => ({ ...prev, [synonymId]: false }))
    }
  }, [onKeywordChange])

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKeyword = formData.keyword.trim();
    if (!trimmedKeyword) {
      setError('Заполните ключевое слово');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const newKeyword: CategoryKeywordWithSynonyms = {
      id: tempId,
      keyword: trimmedKeyword,
      category_id: formData.category_id,
      created_at: new Date().toISOString(),
      user_id: '', 
      keyword_synonyms: [],
    };

    setOptimisticKeywords(prev => [newKeyword, ...prev]);
    setFormData({ keyword: '', category_id: category.id });

    try {
      const result = await createKeyword({
        keyword: trimmedKeyword,
        category_id: formData.category_id
      });

      if (result.error) {
        setError(result.error);
        setToast({ message: result.error, type: 'error' });
        setOptimisticKeywords(prev => prev.filter(k => k.id !== tempId));
      } else {
        setToast({ message: 'Ключевое слово успешно добавлено', type: 'success' });
        onKeywordChange?.();
      }
    } catch (err) {
      console.error("Failed to add keyword:", err);
      const errorMessage = "Произошла непредвиденная ошибка.";
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      setOptimisticKeywords(prev => prev.filter(k => k.id !== tempId));
    }
  }

  const handleUpdateKeyword = async (keywordId: string, newText: string) => {
    const trimmedText = newText.trim();
    const originalKeyword = optimisticKeywords.find(k => k.id === keywordId);
    
    setInlineEditingId(null);

    if (!trimmedText || !originalKeyword || originalKeyword.keyword === trimmedText) {
      return;
    }

    setOptimisticKeywords(prev => prev.map(k => k.id === keywordId ? { ...k, keyword: trimmedText } : k));

    const result = await updateKeyword(keywordId, { keyword: trimmedText });

    if (result.error) {
      setToast({ message: result.error, type: 'error' });
      setOptimisticKeywords(prev => prev.map(k => k.id === keywordId ? originalKeyword : k));
    } else {
      setToast({ message: 'Ключевое слово обновлено', type: 'success' });
      onKeywordChange?.();
    }
  };

  const handleDeleteRequest = (keywordId: string) => {
    setDeletingKeywordId(keywordId);
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingKeywordId) return;
    
    const keywordToDelete = optimisticKeywords.find(k => k.id === deletingKeywordId);
    if (!keywordToDelete) return;

    setOptimisticKeywords(prev => prev.filter(k => k.id !== deletingKeywordId));
    setIsConfirmingDelete(false);

    const result = await deleteKeyword(deletingKeywordId);

    if (result.error) {
      setError(result.error);
      setToast({ message: result.error, type: 'error' });
      setOptimisticKeywords(prev => [...prev, keywordToDelete].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
    } else {
      setToast({ message: 'Ключевое слово успешно удалено', type: 'success' });
      onKeywordChange?.();
    }
    setDeletingKeywordId(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ключевые слова: ${category.name}`} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 px-4">Управляйте ключевыми словами для автоматической категоризации.</p>

        <form onSubmit={handleAddKeyword} className="flex items-center gap-2 p-4 border-y border-gray-200">
          <Input 
            ref={keywordInputRef}
            value={formData.keyword} 
            onChange={(e) => setFormData({ ...formData, keyword: e.target.value })} 
            placeholder="Новое ключевое слово..." 
            autoComplete="new-password"
            required 
          />
          <Button type="submit">
            Добавить
          </Button>
        </form>

        <div className="px-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по словам и синонимам..."
            autoComplete="new-password"
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
          />
        </div>

        {error && <div className="px-4"><ErrorMessage error={error} onDismiss={() => setError(null)} showDismiss /></div>}

        <div className="px-4">
          {filteredKeywords.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">{searchQuery ? 'Ничего не найдено' : 'У этой категории пока нет ключевых слов'}</div>
              <p className="text-sm text-gray-400 mt-2">{searchQuery ? 'Попробуйте другой запрос' : 'Добавьте слова для автоматической категоризации расходов.'}</p>
            </Card>
          ) : (
            <div className="grid gap-4 max-h-96 overflow-y-auto p-1 -mx-1">
              {filteredKeywords.map((keyword) => (
                <Card key={keyword.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-1/3">
                      {inlineEditingId === keyword.id ? (
                        <Input
                          value={inlineEditText}
                          onChange={(e) => setInlineEditText(e.target.value)}
                          onBlur={() => handleUpdateKeyword(keyword.id, inlineEditText)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleUpdateKeyword(keyword.id, inlineEditText);
                            }
                            if (e.key === 'Escape') {
                              setInlineEditingId(null);
                            }
                          }}
                          autoComplete="new-password"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 truncate"
                          title={keyword.keyword}
                          onClick={() => {
                            if (keyword.id.toString().startsWith('temp-')) return;
                            setInlineEditingId(keyword.id);
                            setInlineEditText(keyword.keyword);
                          }}
                        >
                          {keyword.keyword}
                        </span>
                      )}
                    </div>

                    <Input
                      className="flex-grow"
                      value={synonymInputs[keyword.id] || ''}
                      onChange={(e) => handleSynonymInputChange(keyword.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddSynonym(keyword.id); }
                      }}
                      placeholder="Добавьте синоним"
                      autoComplete="new-password"
                      disabled={!!synonymSaving[keyword.id]}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddSynonym(keyword.id)}
                      isLoading={!!synonymSaving[keyword.id]}
                      disabled={(synonymInputs[keyword.id] || '').trim().length < 2 || !!synonymSaving[keyword.id]}
                      className="shrink-0"
                    >
                      Добавить
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteRequest(keyword.id)} 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                    >
                      Удалить
                    </Button>
                  </div>

                  <div className="pl-2">
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex flex-wrap gap-2">
                        {keyword.keyword_synonyms && keyword.keyword_synonyms.length > 0 ? (
                          keyword.keyword_synonyms.map((synonym) => (
                            <span
                              key={synonym.id}
                              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                            >
                              {synonym.synonym}
                              <button
                                type="button"
                                onClick={() => handleDeleteSynonym(keyword.id, synonym.id)}
                                className="text-gray-400 hover:text-red-600 focus:outline-none"
                                disabled={!!synonymDeleting[synonym.id]}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <div />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 shrink-0">
                        Создано: {formatDateLocaleRu(keyword.created_at || '')}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

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