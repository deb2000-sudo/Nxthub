<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Nxthub - Influencer Marketing Campaign Management Platform

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

A modern React + TypeScript application for managing influencer marketing campaigns with role-based access control, campaign tracking, and influencer management.

## 🚀 Quick Start

**Prerequisites:** Node.js 18+ and npm

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   For local development with mock data, set `VITE_USE_MOCK_DATA=true` in `.env.local`

3. **Run the app:**
   ```bash
   npm run dev
   ```
   Visit: `http://localhost:3000`

4. **Login with test credentials:**
   - Marketing Manager: `marketing@nxthub.com`
   - Sales Manager: `sales@nxthub.com`
   - Executive: `exec@nxthub.com`

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 5 minutes
- **[Complete Setup Guide](./SETUP.md)** - Comprehensive documentation including:
  - Local development setup
  - Firebase integration (dev & prod databases)
  - GitHub branch strategy (main/master)
  - CI/CD configuration
  - Deployment guides

## 🏗️ Project Structure

```
nxthub/
├── components/          # Reusable React components
├── config/             # Firebase configuration
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # Data services (Firebase/localStorage)
├── types.ts            # TypeScript type definitions
└── constants.ts        # Mock data and constants
```

## 🔥 Features

- ✅ Role-based access control (Managers & Executives)
- ✅ Campaign management with status tracking
- ✅ Influencer database with filtering
- ✅ Department-based data segregation
- ✅ Firebase integration (optional)
- ✅ LocalStorage fallback for development
- ✅ Modern UI with dark theme

## 🌿 Branch Strategy

- **`main`** - Development branch
- **`master`** - Production branch

See [SETUP.md](./SETUP.md) for detailed branch workflow and CI/CD setup.

## 📦 Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Firebase** - Backend (optional)
- **React Router** - Navigation
- **Lucide React** - Icons

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📝 License

Private project - All rights reserved
