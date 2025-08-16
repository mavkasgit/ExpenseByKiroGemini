import { KeywordManagement } from '@/components/keywords/KeywordManagement'
import { StickyPageHeaderWrapper } from '@/components/layout/StickyPageHeaderWrapper'

export default function KeywordsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StickyPageHeaderWrapper 
        title="Управление ключевыми словами"
        description="Настройте автоматическую категоризацию расходов"
      />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <KeywordManagement />
      </div>
    </div>
  )
}