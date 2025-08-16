import Link from 'next/link'

interface PageHeaderProps {
  title: string
  description?: string
  backLink?: {
    href: string
    label: string
  }
  actions?: React.ReactNode
}

export function PageHeader({ title, description, backLink, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {/* Кнопка возврата */}
      {backLink && (
        <div className="mb-6">
          <Link
            href={backLink.href}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 hover:text-indigo-700 transition-all duration-200 group hover:shadow-md"
          >
            <svg className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {backLink.label}
          </Link>
        </div>
      )}

      {/* Заголовок и действия */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}