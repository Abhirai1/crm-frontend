# CRM Frontend (React + Tailwind)

Vite + React + Tailwind starter with signup/login wired to the backend.

## Dev
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

## API base
By default, the app calls `http://localhost:3000/api`. To change:
- Set `VITE_API_BASE` env: `VITE_API_BASE=https://your-host/api`
- Or edit `API_BASE` in `src/App.jsx`.

## Build
```bash
npm run build
npm run preview
```

## Features
- Signup: name, email, phone, role, password.
- Login: stores `employeeId`, `name`, `role` in `localStorage`.
- Tailwind styling for simple, clean UI.
