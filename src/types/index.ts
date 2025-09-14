export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {

      categories: {
        Row: {
          color: string | null
          created_at: string | null
          category_group_id: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          category_group_id?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          category_group_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      category_keywords: {
        Row: {
          category_id: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          keyword: string
          cyrillic_keyword: string | null
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          keyword: string
          cyrillic_keyword?: string | null
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          keyword?: string
          cyrillic_keyword?: string | null
          user_id?: string | null
        }
      }
      expenses: {
        Row: {
          amount: number
          auto_categorized: boolean | null
          batch_id: string | null
          category_id: string | null
          city: string | null
          created_at: string | null
          description: string | null
          expense_date: string
          expense_time: string | null
          id: string
          input_method: string | null
          matched_keywords: string[] | null
          notes: string | null
          original_data: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          auto_categorized?: boolean | null
          batch_id?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          expense_date?: string
          expense_time?: string | null
          id?: string
          input_method?: string | null
          matched_keywords?: string[] | null
          notes?: string | null
          original_data?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          auto_categorized?: boolean | null
          batch_id?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          expense_date?: string
          expense_time?: string | null
          id?: string
          input_method?: string | null
          matched_keywords?: string[] | null
          notes?: string | null
          original_data?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
      }
      category_groups: {
        Row: {
          id: string
          name: string
          icon: string | null
          color: string | null
          description: string | null
          sort_order: number | null
          user_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          color?: string | null
          description?: string | null
          sort_order?: number | null
          user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          color?: string | null
          description?: string | null
          sort_order?: number | null
          user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      unrecognized_keywords: {
        Row: {
          first_seen: string | null
          frequency: number | null
          id: string
          keyword: string
          last_seen: string | null
          user_id: string | null
        }
        Insert: {
          first_seen?: string | null
          frequency?: number | null
          id?: string
          keyword: string
          last_seen?: string | null
          user_id?: string | null
        }
        Update: {
          first_seen?: string | null
          frequency?: number | null
          id?: string
          keyword?: string
          last_seen?: string | null
          user_id?: string | null
        }
      }
    }
  }
}

// Application types
export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryGroup = Database['public']['Tables']['category_groups']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']

export type CategoryKeyword = Database['public']['Tables']['category_keywords']['Row']
export type UnrecognizedKeyword = Database['public']['Tables']['unrecognized_keywords']['Row']

export type ExpenseWithCategory = Expense & {
  category: Category | null
}

export type CategoryWithKeywords = Category & {
  keywords: CategoryKeyword[]
}

// Form types
export type CreateExpenseData = {
  amount: number
  description: string // Обязательно для категоризации
  notes?: string // Необязательное примечание
  category_id?: string // Необязательно - система сама определит
  expense_date: string
  expense_time?: string | null // Время транзакции (HH:MM)
  input_method?: 'single' | 'bulk_table'
  batch_id?: string
}

export type CreateCategoryData = {
  name: string
  color?: string
  icon?: string
  category_group_id?: string | null
}

// Bulk input types
export type BulkExpenseRow = {
  amount: number
  description?: string
  category_id: string
  expense_date: string
  tempId?: string // для отслеживания в UI
}



// Типы для парсинга файлов (используется в bulk input)
export type ParsedBankData = {
  headers: string[]
  rows: string[][]
  totalRows: number
  selectedTableIndex?: number
  availableTables?: Array<{
    index: number
    description: string
    rowCount: number
    columnCount: number
    hasHeaders: boolean
    preview: string[][]
  }>
}

export type ExpenseInputMethod = 'single' | 'bulk_table'

// Column mapping types
export interface ColumnMapping {
  sourceIndex: number
  targetField: 'amount' | 'description' | 'expense_date' | 'expense_time' | 'notes' | 'skip'
  enabled: boolean
  preview: string
}

export type BulkImportResult = {
  success: number
  failed: number
  uncategorized: number
  errors: Array<{
    row: number
    message: string
  }>
}

// Auto-categorization types
export type KeywordMatch = {
  keyword: string
  category_id: string
}

export type CategorizationResult = {
  category_id: string | null
  matched_keywords: string[]
  auto_categorized: boolean
}

export type UncategorizedExpenseWithKeywords = Expense & {
  suggested_keywords: string[]
  potential_categories: Array<{
    category: Category
    confidence: number
    matched_keywords: string[]
  }>
}

// Keyword management types
export type CreateKeywordData = {
  keyword: string
  cyrillic_keyword?: string | null
  category_id: string
}

export type UpdateKeywordData = {
  keyword?: string
  cyrillic_keyword?: string | null
  category_id?: string
}

export type AssignKeywordData = {
  keyword: string
  category_id: string
}