# Quick Start Guide - Nxthub

## 🚀 Quick Setup (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment

Create `.env.local` file:
```bash
cp .env.example .env.local
```

For **local development with mock data** (no Firebase needed):
```env
VITE_ENV=development
VITE_USE_MOCK_DATA=true
```

### 3. Run Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

### 4. Login Credentials (Mock Data)

- **Marketing Manager**: `marketing@nxthub.com`
- **Sales Manager**: `sales@nxthub.com`
- **Executive**: `exec@nxthub.com`

---

## 🔥 Firebase Setup (Optional)

If you want to use Firebase instead of localStorage:

### Step 1: Create Firebase Projects
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create two projects:
   - `nxthub-dev` (for development)
   - `nxthub-prod` (for production)

### Step 2: Enable Services
For each project:
- Enable **Firestore Database** (start in test mode)
- Enable **Authentication** (Email/Password)

### Step 3: Get Configuration
1. Project Settings → Your apps → Web app
2. Copy the config values

### Step 4: Update `.env.local`
```env
VITE_ENV=development
VITE_USE_MOCK_DATA=false

VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Step 5: Restart Dev Server
```bash
npm run dev
```

---

## 📦 Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

---

## 🌿 GitHub Branch Setup

### Initial Setup
```bash
# Rename default branch to main (if needed)
git branch -m master main
git push origin -u main

# Create production branch
git checkout -b master
git push origin master
git checkout main
```

### Workflow
- **`main`** → Development branch
- **`master`** → Production branch

### Deploy to Production
```bash
git checkout master
git merge main
git push origin master
```

---

## 📚 Full Documentation

See [SETUP.md](./SETUP.md) for complete documentation including:
- Detailed Firebase setup
- Environment configuration
- GitHub Actions CI/CD
- Deployment guides
- Troubleshooting

---

## 🆘 Troubleshooting

**Port 3000 in use?**
```bash
lsof -ti:3000 | xargs kill -9
```

**Firebase errors?**
- Check environment variables are set correctly
- Verify Firestore is enabled in Firebase Console
- Check browser console for specific errors

**Build errors?**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created
- [ ] Dev server running (`npm run dev`)
- [ ] Can login with test credentials
- [ ] (Optional) Firebase configured
- [ ] (Optional) GitHub branches set up

---

**Need help?** Check [SETUP.md](./SETUP.md) for detailed instructions.

