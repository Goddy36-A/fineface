# FineFace

A facial-recognition attendance system for organisations. Admins enroll employees with a photo, and staff are recognised through the camera and logged as checked in or out.

## Features

- **Enroll:** capture an employee's face and store their face descriptors
- **Recognize:** live camera matching (Euclidean distance, threshold 0.5) with a 15-second cooldown to prevent double logs
- **Check-in and check-out** modes
- **Attendance log** with per-employee history
- **Employee and user management**, with admin and user roles
- **Authentication:** email/password, Google sign-in, password reset
- Protected routes, so only signed-in users reach the dashboard

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Face recognition | `@vladmandic/face-api` (in the browser) |
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| Charts | Recharts |
| Tests | Vitest |

## Getting started

```bash
git clone https://github.com/Goddy36-A/fineface.git
cd fineface
npm install
```

Create a `.env` file with your Supabase project details:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Then apply the SQL files in `supabase/migrations/` to your Supabase project and run:

```bash
npm run dev
```

Google sign-in on localhost needs extra setup, described in [GOOGLE_AUTH_LOCALHOST.md](GOOGLE_AUTH_LOCALHOST.md).

## Database

Tables: `employees`, `attendance_logs`, `profiles`, `user_roles` (role enum: `admin`, `user`).

## Privacy

Face descriptors are biometric data. Only enroll people who have consented, and keep your Supabase policies restrictive.

## Author

**Ainebyoona Godfrey**, Uganda. [GitHub](https://github.com/Goddy36-A)
