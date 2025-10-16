-- Migration: Add approver_id column to leave_requests table
-- This column is used for the initial approver assignment before review

DO $$
BEGIN
  -- Add approver_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'approver_id'
  ) THEN
    ALTER TABLE leave_requests
      ADD COLUMN approver_id UUID REFERENCES users(id);
  END IF;

  -- Add index for approver_id lookups
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_approver_id'
  ) THEN
    CREATE INDEX idx_leave_requests_approver_id ON leave_requests(approver_id);
  END IF;
END $$;
