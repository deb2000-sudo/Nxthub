# Nxthub - Complete Setup Guide

## Project Overview

Nxthub is a React + TypeScript application built with Vite for managing influencer marketing campaigns. It features role-based access control (Managers and Executives), campaign management, influencer tracking, and messaging capabilities.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Firebase Integration](#firebase-integration)
3. [Environment Configuration](#environment-configuration)
4. [GitHub Branch Strategy](#github-branch-strategy)
5. [Deployment](#deployment)

---

## Local Development Setup

### Prerequisites

- **Node.js**: Version 18.x or higher (recommended: 20.x LTS)
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For version control

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd nxthub
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React 19.2.0
- React Router DOM 7.9.6
- TypeScript 5.8.2
- Vite 6.2.0
- Firebase SDK (after integration)

### Step 3: Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. For local development, you can use mock data (localStorage) or Firebase:
   - **Mock Mode**: Set `VITE_USE_MOCK_DATA=true` in `.env.local`
   - **Firebase Mode**: Configure Firebase credentials (see Firebase Integration section)

### Step 4: Run the Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`

### Step 5: Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

### Step 6: Preview Production Build

```bash
npm run preview
```

---

## Firebase Integration

### Step 1: Create Firebase Projects

You need **two separate Firebase projects**:
1. **Development Project**: For testing and development
2. **Production Project**: For live/production environment

#### Create Development Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it: `nxthub-dev` (or your preferred name)
4. Disable Google Analytics (optional for dev)
5. Click "Create project"

#### Create Production Firebase Project

1. Repeat the process
2. Name it: `nxthub-prod` (or your preferred name)
3. Enable Google Analytics (recommended for production)
4. Click "Create project"

### Step 2: Enable Firebase Services

For each project (dev and prod), enable the following:

#### Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (we'll configure security rules later)
4. Choose a location (preferably close to your users)
5. Click "Enable"

#### Authentication

1. Go to **Build** → **Authentication**
2. Click "Get started"
3. Enable **Email/Password** provider
4. (Optional) Enable other providers as needed

### Step 3: Get Firebase Configuration

For each project:

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the **Web icon** (`</>`)
4. Register app with nickname: `nxthub-web`
5. Copy the Firebase configuration object

You'll get something like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "nxthub-dev.firebaseapp.com",
  projectId: "nxthub-dev",
  storageBucket: "nxthub-dev.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 4: Configure Environment Variables

#### Development Environment (`.env.local`)

```env
# Environment
VITE_ENV=development

# Firebase Development Configuration
VITE_FIREBASE_API_KEY=AIza...dev
VITE_FIREBASE_AUTH_DOMAIN=nxthub-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nxthub-dev
VITE_FIREBASE_STORAGE_BUCKET=nxthub-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Data Source (set to false to use Firebase)
VITE_USE_MOCK_DATA=false
```

#### Production Environment (`.env.production`)

```env
# Environment
VITE_ENV=production

# Firebase Production Configuration
VITE_FIREBASE_API_KEY=AIza...prod
VITE_FIREBASE_AUTH_DOMAIN=nxthub-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nxthub-prod
VITE_FIREBASE_STORAGE_BUCKET=nxthub-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321
VITE_FIREBASE_APP_ID=1:987654321:web:xyz789

# Data Source (always false for production)
VITE_USE_MOCK_DATA=false
```

### Step 5: Install Firebase SDK

```bash
npm install firebase
```

### Step 6: Firestore Security Rules

#### Development Rules (`firestore.rules.dev`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Influencers collection
    match /influencers/{influencerId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    // Campaigns collection
    match /campaigns/{campaignId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
  }
}
```

#### Production Rules (`firestore.rules.prod`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - stricter rules
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.auth.uid == userId &&
                      request.resource.data.email == request.auth.token.email;
    }
    
    // Influencers collection
    match /influencers/{influencerId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                              (resource.data.createdBy == request.auth.token.email ||
                               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'executive');
    }
    
    // Campaigns collection
    match /campaigns/{campaignId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && 
                       (resource.data.department == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.department ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'executive');
    }
  }
}
```

Deploy rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules --project nxthub-dev
firebase deploy --only firestore:rules --project nxthub-prod
```

---

## Environment Configuration

### Environment Files Structure

```
nxthub/
├── .env.example          # Template file (committed to git)
├── .env.local            # Local development (gitignored)
├── .env.development      # Development environment (gitignored)
├── .env.production       # Production environment (gitignored)
└── .env                  # Default (gitignored)
```

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ENV` | Current environment | `development`, `production` |
| `VITE_USE_MOCK_DATA` | Use localStorage instead of Firebase | `true`, `false` |
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `nxthub-dev.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `nxthub-dev` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `nxthub-dev.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123456789:web:abc123` |

---

## GitHub Branch Strategy

### Branch Naming Convention

- **`main`**: Development branch (default)
- **`master`**: Production branch

### Initial Setup

#### Step 1: Rename Default Branch to `main`

```bash
# If your default branch is 'master', rename it to 'main'
git branch -m master main
git push origin -u main
```

#### Step 2: Create Production Branch

```bash
# Create master branch from main
git checkout -b master
git push origin master

# Set master as production branch
git checkout main
```

#### Step 3: Configure Branch Protection

In GitHub repository settings:

1. Go to **Settings** → **Branches**
2. Add branch protection rule for `master`:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators
   - ✅ Restrict who can push (optional)

3. Add branch protection rule for `main`:
   - ✅ Require pull request reviews (optional)
   - ✅ Allow force pushes (for development flexibility)

### Workflow

#### Development Workflow

1. **Create feature branch from `main`**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and create Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```
   - Create PR targeting `main` branch

4. **After review, merge to `main`**

#### Production Deployment Workflow

1. **Merge `main` to `master`** (when ready for production):
   ```bash
   git checkout master
   git pull origin master
   git merge main
   git push origin master
   ```

2. **Tag the release**:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

### CI/CD Integration (Recommended)

#### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - main
      - master

jobs:
  deploy-dev:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
        env:
          VITE_ENV: development
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY_DEV }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN_DEV }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID_DEV }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET_DEV }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID_DEV }}
          VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID_DEV }}
          VITE_USE_MOCK_DATA: false
      # Add deployment steps here (e.g., Firebase Hosting)

  deploy-prod:
    if: github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
        env:
          VITE_ENV: production
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY_PROD }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN_PROD }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID_PROD }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET_PROD }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID_PROD }}
          VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID_PROD }}
          VITE_USE_MOCK_DATA: false
      # Add deployment steps here (e.g., Firebase Hosting)
```

#### GitHub Secrets Configuration

Add the following secrets in **Settings** → **Secrets and variables** → **Actions**:

**Development Secrets:**
- `FIREBASE_API_KEY_DEV`
- `FIREBASE_AUTH_DOMAIN_DEV`
- `FIREBASE_PROJECT_ID_DEV`
- `FIREBASE_STORAGE_BUCKET_DEV`
- `FIREBASE_MESSAGING_SENDER_ID_DEV`
- `FIREBASE_APP_ID_DEV`

**Production Secrets:**
- `FIREBASE_API_KEY_PROD`
- `FIREBASE_AUTH_DOMAIN_PROD`
- `FIREBASE_PROJECT_ID_PROD`
- `FIREBASE_STORAGE_BUCKET_PROD`
- `FIREBASE_MESSAGING_SENDER_ID_PROD`
- `FIREBASE_APP_ID_PROD`

---

## Deployment

### Firebase Hosting Setup

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Public directory: `dist`
   - Single-page app: `Yes`
   - Set up automatic builds: `No` (we'll use GitHub Actions)

4. **Deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting --project nxthub-dev  # For development
   firebase deploy --only hosting --project nxthub-prod # For production
   ```

---

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**:
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   # Or change port in vite.config.ts
   ```

2. **Firebase connection errors**:
   - Verify environment variables are set correctly
   - Check Firebase project settings
   - Ensure Firestore is enabled

3. **Build errors**:
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## Best Practices

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use environment variables** - Never hardcode API keys
3. **Test locally first** - Always test changes before pushing
4. **Use meaningful commit messages** - Follow conventional commits
5. **Create feature branches** - Never commit directly to `main` or `master`
6. **Review before merging** - Always use pull requests
7. **Tag releases** - Tag production releases with version numbers

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

## Support

For issues or questions, please create an issue in the repository or contact the development team.


