CREATE UNIQUE INDEX IF NOT EXISTS attendance_logs_unique_per_day
ON public.attendance_logs (employee_id, log_type, ((recognized_at AT TIME ZONE 'UTC')::date));