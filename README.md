# 🍳 Popular Kitchen PWA

A premium, mobile-first e-commerce progressive web app for kitchenware, built with React, Vite, Tailwind CSS, Firebase, and Cloudinary.

## Features
- **PWA Ready:** Installable, offline fallback, cache-first strategies.
- **Dynamic Theming:** Deep navy & off-white aesthetics.
- **Admin Panel:** Built-in hidden dashboard to manage products, calculate discounts automatically, and process orders.
- **Cart System:** Persistent cart securely saved to localStorage.
- **Invoice Generation:** Automatic order PDF invoice generation for customers natively in the browser using `jsPDF`.
- **Image Optimization:** Integrated Cloudinary for rapid image delivery and resizing on the fly.

## Prerequisites
- Node.js (v18+)
- Firebase Account
- Cloudinary Account

## Setup Instructions

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd "popular kitchen"
npm install
```

### 2. Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Firestore Database** and **Authentication (Email/Password)**.
3. Replace the configuration object in `src/firebase/config.js` with your own details.
4. **Firestore Security Rules**: Set the Firestore rules as follows:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /products/{document=**} {
         allow read: if true;
         allow write: if request.auth != null; // Admin-only logic should be added here
       }
       match /orders/{document=**} {
         allow read, write: if true; // Modify to restrict based on your final auth structure
       }
       match /users/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

### 3. Creating the Admin User
1. By default, the admin login supports a hardcoded fallback (`admin` / `admin` password inside `AuthContext.jsx`) for immediate testing.
2. For production, create a standard user in the Firebase Auth console.
3. Manually create a document in the `users` Firestore collection with that user's UID as the document ID containing `{ role: "admin" }`.

### 4. Cloudinary Setup
1. Create an account at Cloudinary.
2. In Settings > Upload, create an **unsigned upload preset** named `popular_kitchen`.
3. In `src/cloudinary/upload.js`, ensure `CLOUD_NAME` matches your actual cloud name (`dxonu07sc`).

## Available Commands

### Run Locally
Starts the Vite development server:
```bash
npm run dev
```

### Build for Production
Compiles the application, building the client code and service workers:
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Deployment
This app can be deployed easily to modern edge platforms like Vercel or Firebase Hosting. 
- Ensure that the build command `npm run build` is set.
- Ensure the publish directory is `dist`.
