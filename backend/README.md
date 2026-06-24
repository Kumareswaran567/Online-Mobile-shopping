# MobileHub Backend API

Backend server for MobileHub e-commerce platform using Node.js, Express, and PostgreSQL.
🌐 Website link:
https://online-mobile-shopping-2.onrender.com

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database:**
   - Create a new PostgreSQL database:
     ```sql
     CREATE DATABASE mobilehub_db;
     ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and update the database credentials:
     ```env
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=mobilehub_db
     DB_USER=postgres
     DB_PASSWORD=your_password_here
     PORT=3000
     FRONTEND_URL=http://localhost:5500
     ```

4. **Set up database tables:**
   ```bash
   npm run setup-db
   ```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Health Check
- **GET** `/health` - Check server and database status

### Checkout
- **POST** `/api/checkout` - Create a new order
  - Request body: See `BACKEND_SETUP.md` in parent directory
  - Returns: Order details with order ID

### Orders
- **GET** `/api/orders` - Get all orders (with pagination)
  - Query params: `limit` (default: 100), `offset` (default: 0)
- **GET** `/api/orders/:orderId` - Get order by order ID
- **GET** `/api/orders/customer/:email` - Get orders by customer email

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    card_number_last4 VARCHAR(4),
    mobile_id INTEGER,
    mobile_brand VARCHAR(100),
    mobile_model VARCHAR(100),
    mobile_price DECIMAL(10, 2),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
backend/
├── server.js              # Main server file
├── database.js            # PostgreSQL connection
├── setup-database.js      # Database setup script
├── package.json           # Dependencies
├── .env.example           # Environment variables template
├── models/
│   └── Order.js          # Order model/database operations
└── routes/
    ├── checkout.js        # Checkout routes
    └── orders.js          # Order routes
```

## Testing

Test the API using curl or Postman:

```bash
# Health check
curl http://localhost:3000/health

# Create order
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": {
      "id": 1,
      "brand": "Samsung",
      "model": "Galaxy S25 Ultra",
      "price": 127900
    },
    "customer": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "cardNumber": "1234567890123456",
    "totalAmount": 127900
  }'

# Get order
curl http://localhost:3000/api/orders/ORD-1234567890-ABC123
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using the port

### CORS Errors
- Update `FRONTEND_URL` in `.env` to match your frontend URL
- Or set to `*` for development (not recommended for production)

## Security Notes

- Never commit `.env` file to version control
- Use environment variables for sensitive data
- In production, use proper authentication and authorization
- Consider using HTTPS
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs
