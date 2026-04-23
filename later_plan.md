# Future Implementation Plan: Secondary Database & PowerBI Dashboard

## Goal Description
Maximize application performance and speed by utilizing **two completely separate Firebase Projects**. 
1. **Old Project (`popularkitchen-ca37c`)**: Will exclusively handle storefront operations like Products, Categories, adding to cart, and user profiles. 
2. **New Project (`popularkitchen-dc794`)**: Will exclusively handle Orders (saving/fetching), the "My Orders" page, Admin Order Management, and Super Admin Analytics. 

We will also build a dynamic, mobile-responsive "PowerBI-style" analytics dashboard for the Super Admin, alongside top-selling products and top customer metrics with manual refresh capabilities.

## Proposed Changes

### Setup and Configuration (Two Firebase Apps)
#### [MODIFY] src/firebase/config.js
- Initialize the primary Firebase app (`popularkitchen-ca37c`) using the existing `.env` variables for products.
- Initialize a **secondary Firebase app** (`popularkitchen-dc794`) using a new set of `.env` variables.
- Export `db` (from the primary app) and `adminDb` (from the secondary app).

### Data Splitting Strategy (Orders vs Products)
#### [MODIFY] src/firebase/orders.js
- **All Order Operations**: Update all order functions to connect to `adminDb` (the new project).
- **Consequence**: When users browse the store or admins add new products, the queries hit the **old database**, keeping it extremely fast. When a user checks out, views "My Orders", or admins manage orders, the queries hit the **new database**, completely dividing the load.

### Super Admin Dashboard Enhancements
#### [NEW] src/components/admin/PowerBIDashboard.jsx
- Build a premium, interactive charting dashboard using the `recharts` library.
- **Mobile Responsive**: Ensure charts scale perfectly on mobile devices.
- **Customizable**: Allow admins to configure up to 5 graphs (Line, Bar, Pie charts) for metrics like pending, confirmed, delivered, and cancelled orders.
- **Persistence**: Save, Delete, and Recreate the dashboard layout (stored in the `adminDb` of the new project).
- Implement sleek skeleton loading animations.

#### [NEW] src/components/admin/TopMetrics.jsx
- Create a component to calculate and render:
  - **Top 10 Most Sold Products**: Displaying total quantity sold and total amount generated.
  - **Top Customers**: Displaying name, phone, email, and total purchase amount (filtered to users with at least 1 purchase).
- **Refresh Capability**: Add a manual "Refresh" icon button to auto-calculate the latest metrics on demand from the new database.
- **Mobile Responsive**: Use CSS Grid/Flexbox to ensure the tables and lists collapse elegantly on mobile screens.

#### [MODIFY] src/pages/admin/Dashboard.jsx
- Integrate `PowerBIDashboard` and `TopMetrics` into the Super Admin view.
- Ensure the entire layout is 100% mobile-friendly with rich aesthetics.

### Dependencies
- Run `npm install recharts` for highly customizable, dynamic graph visualizations.

## Environment Variables for Netlify
Since we are now using two Firebase projects, you will need to add these **NEW** variables to your Netlify environment:
- `VITE_SECOND_FIREBASE_API_KEY` (AIzaSyCVbnb3y7UBvf1K4fUf_woYd-5yyOLUKRc)
- `VITE_SECOND_FIREBASE_AUTH_DOMAIN` (popularkitchen-dc794.firebaseapp.com)
- `VITE_SECOND_FIREBASE_PROJECT_ID` (popularkitchen-dc794)
- `VITE_SECOND_FIREBASE_STORAGE_BUCKET` (popularkitchen-dc794.firebasestorage.app)
- `VITE_SECOND_FIREBASE_MESSAGING_SENDER_ID` (206085979031)
- `VITE_SECOND_FIREBASE_APP_ID` (1:206085979031:web:5bb7a18a9d355c686de2d2)
- `VITE_SECOND_FIREBASE_MEASUREMENT_ID` (G-55LCCBY82W)

## Database Rules (Firestore) for `popularkitchen-dc794`
For the new database, you will need to set these rules in your Firebase Console:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone authenticated can create an order, but only their own.
    // NOTE: Because admin roles are in the old database, we will check admin status
    // on the client-side, but for raw database rules, we must allow basic read/write 
    // to authenticated users for now, or use Firebase Custom Claims.
    
    match /orders/{document=**} {
      allow read, write: if request.auth != null; 
    }
    match /admin_configs/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Verification Plan
1. Ensure `firebase/config.js` successfully connects to both projects.
2. Verify adding/reading products hits the old project.
3. Verify placing an order saves to the new project.
4. Test the Super Admin PowerBI dashboard creation and the Top Metrics auto-calculation on both Desktop and Mobile views.
