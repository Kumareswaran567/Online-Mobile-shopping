# E-commerce Application for mobile Shopping

MobileHub is a full-stack e-commerce web application focused on purchasing mobile devices, complete with a robust order tracking and return/refund management system. 
🌐 Website link: 
https://online-mobile-shopping-2.onrender.com

The project uses a unified Node.js/Express server that serves both the frontend static files and the backend API on a single port (`4000`), automatically launching your browser upon startup.

## ✨ Features

### Customer Features
- **Browse & Purchase**: View available mobile devices and complete a checkout process (simulated payment).
- **Order Tracking**: Look up order history securely using your name and email.
- **Return System**:
  - Request a return within a **15-day window** after delivery.
  - Interactive 3-step wizard for submitting return requests.
  - Track the live timeline of the return request (Pending Review → Approved → Refund Completed).
  - Verification checks prevent unauthorized returns or double-requests.

### Admin Features
- **Admin Dashboard**: Centralized dashboard to view metrics and manage return requests.
- **Filter & Search**: Quickly find returns by status, customer name, email, or order ID.
- **Workflow Management**:
  - Approve or Reject pending return requests with optional notes.
  - Mark refunds as completed once returned devices are received.
  - Real-time status updates reflected instantly on the customer's tracking page.

## 🛠️ Technology Stack
- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism design, custom animations), Vanilla JavaScript.
- **Backend**: Node.js, Express.js (REST APIs).
- **Database**: PostgreSQL (with `pg` driver).

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL running locally

### 1. Database Setup
1. Open PostgreSQL and create a database (default name: `mobilehub_db`).
2. Update the database credentials in the backend `.env` file if necessary.
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=mobilehub_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   PORT=4000
   ```
3. Run the setup script to create the necessary tables (`orders` and `returns`):
   ```bash
   cd backend
   node setup-database.js
   ```

### 2. Running the Application
The frontend and backend run together seamlessly from a single command.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   # or
   node server.js
   ```
   *The server will start on `http://localhost:4000` and automatically open your default browser (Chrome preferred).*

## 🗺️ Navigation Map

Once the server is running, you can access the following pages:

| Page | URL | Description |
|---|---|---|
| **Shop/Home** | `http://localhost:4000` | Browse mobiles and checkout. |
| **My Orders** | `http://localhost:4000/orders.html` | Lookup your orders. |
| **Return Flow** | `http://localhost:4000/return-request.html` | Initiate a return (requires Order ID). |
| **Refund Tracking**| `http://localhost:4000/refund-status.html` | Track return timeline (requires Order ID). |
| **Admin Panel** | `http://localhost:4000/admin.html` | Manage all returns and refunds. |

## 📁 Project Structure

```text
Mobile/
├── front end/               # Static frontend files
│   ├── index.html           # Storefront homepage
│   ├── check.html           # Checkout page
│   ├── success.html         # Payment success page
│   ├── orders.html          # My Orders lookup
│   ├── return-request.html  # Return submission wizard
│   ├── refund-status.html   # Live return tracking timeline
│   ├── admin.html           # Admin dashboard
│   ├── config.js            # Frontend API configuration
│   └── style.css            # Global styles
│
├── backend/                 # Node.js backend
│   ├── server.js            # Express server (Serves API + Frontend)
│   ├── database.js          # PostgreSQL connection pool
│   ├── setup-database.js    # DB initialization script
│   ├── models/
│   │   ├── Order.js         # Order database operations
│   │   └── Return.js        # Return & Refund operations
│   ├── routes/
│   │   ├── checkout.js      # Order creation API
│   │   ├── orders.js        # Order lookup APIs
│   │   └── returns.js       # Return workflow APIs
│   └── .env                 # Environment variables
```
