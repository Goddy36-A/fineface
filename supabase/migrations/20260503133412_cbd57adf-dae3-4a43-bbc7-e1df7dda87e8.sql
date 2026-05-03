
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  department TEXT,
  position TEXT,
  photo_url TEXT,
  face_descriptor JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.attendance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN ('check_in','check_out')),
  confidence NUMERIC(5,4),
  recognized_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendance_employee ON public.attendance_logs(employee_id);
CREATE INDEX idx_attendance_time ON public.attendance_logs(recognized_at DESC);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Module 1 prototype: open access. Auth/roles will be added in a later module.
CREATE POLICY "Public read employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Public insert employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Public delete employees" ON public.employees FOR DELETE USING (true);

CREATE POLICY "Public read attendance" ON public.attendance_logs FOR SELECT USING (true);
CREATE POLICY "Public insert attendance" ON public.attendance_logs FOR INSERT WITH CHECK (true);

-- Storage bucket for employee photos
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-photos','employee-photos', true);

CREATE POLICY "Public read employee photos" ON storage.objects FOR SELECT USING (bucket_id = 'employee-photos');
CREATE POLICY "Public upload employee photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'employee-photos');
CREATE POLICY "Public update employee photos" ON storage.objects FOR UPDATE USING (bucket_id = 'employee-photos');
