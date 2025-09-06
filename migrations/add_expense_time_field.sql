-- Add expense_time field to expenses table
-- This field will store the time component from bank statements (e.g., "12:02")

ALTER TABLE expenses 
ADD COLUMN expense_time TIME NULL;

-- Add comment to explain the field
COMMENT ON COLUMN expenses.expense_time IS 'Time component extracted from bank statements (HH:MM format)';

-- Create index for potential time-based queries
CREATE INDEX idx_expenses_expense_time ON expenses(expense_time) WHERE expense_time IS NOT NULL;