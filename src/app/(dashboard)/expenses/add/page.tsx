'use client'

import { ExpenseForm } from '@/components/expense-input/ExpenseForm'

export default function AddExpensePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Добавить расход</h1>
      <ExpenseForm />
    </div>
  )
}
