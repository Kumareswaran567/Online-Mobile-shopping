// Order Model - Database operations for orders
const { query } = require('../database');

class Order {
    /**
     * Create a new order
     * @param {Object} orderData - Order data
     * @returns {Promise<Object>} Created order
     */
    static async create(orderData) {
        const {
            mobile,
            customer,
            cardNumber,
            totalAmount
        } = orderData;

        // Generate unique order ID
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        // Get last 4 digits of card for security
        const cardLast4 = cardNumber ? cardNumber.slice(-4) : null;

        const insertQuery = `
            INSERT INTO orders (
                order_id,
                customer_name,
                customer_email,
                card_number_last4,
                mobile_id,
                mobile_brand,
                mobile_model,
                mobile_price,
                total_amount,
                status,
                delivery_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const values = [
            orderId,
            customer.name,
            customer.email,
            cardLast4,
            mobile?.id || null,
            mobile?.brand || null,
            mobile?.model || null,
            mobile?.price || null,
            totalAmount,
            'completed',
            'delivered'   // default: simulates same-day delivery for demo
        ];

        const result = await query(insertQuery, values);
        return result.rows[0];
    }

    /**
     * Get order by order ID
     * @param {string} orderId - Order ID
     * @returns {Promise<Object|null>} Order or null if not found
     */
    static async findByOrderId(orderId) {
        const selectQuery = `
            SELECT * FROM orders
            WHERE order_id = $1
        `;
        
        const result = await query(selectQuery, [orderId]);
        return result.rows[0] || null;
    }

    /**
     * Get all orders
     * @param {number} limit - Limit number of results
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Array>} Array of orders
     */
    static async findAll(limit = 100, offset = 0) {
        const selectQuery = `
            SELECT * FROM orders
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;
        
        const result = await query(selectQuery, [limit, offset]);
        return result.rows;
    }

    /**
     * Get orders by customer email (legacy — kept for orders route)
     * @param {string} email - Customer email
     * @returns {Promise<Array>} Array of orders
     */
    static async findByEmailLegacy(email) {
        const selectQuery = `
            SELECT * FROM orders
            WHERE customer_email = $1
            ORDER BY created_at DESC
        `;
        
        const result = await query(selectQuery, [email]);
        return result.rows;
    }

    /**
     * Update order status
     * Supported statuses: completed | return_requested | return_approved |
     *                      return_rejected | refund_completed
     * @param {string} orderId - Order ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Updated order
     */
    static async updateStatus(orderId, status) {
        const updateQuery = `
            UPDATE orders
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE order_id = $2
            RETURNING *
        `;
        
        const result = await query(updateQuery, [status, orderId]);
        return result.rows[0];
    }

    /**
     * Update delivery status of an order
     * @param {string} orderId
     * @param {string} deliveryStatus  'pending' | 'shipped' | 'delivered'
     * @returns {Promise<Object>} Updated order
     */
    static async updateDeliveryStatus(orderId, deliveryStatus) {
        const result = await query(
            `UPDATE orders
             SET delivery_status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE order_id = $2
             RETURNING *`,
            [deliveryStatus, orderId]
        );
        return result.rows[0];
    }

    /**
     * Find orders by customer email (case-insensitive)
     * @param {string} email
     * @returns {Promise<Array>}
     */
    static async findByEmail(email) {
        const result = await query(
            `SELECT * FROM orders
             WHERE LOWER(customer_email) = LOWER($1)
             ORDER BY created_at DESC`,
            [email]
        );
        return result.rows;
    }
}

module.exports = Order;
