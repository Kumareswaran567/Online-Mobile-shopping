// Return Model - Database operations for return & refund management
const { query } = require('../database');

class Return {
    /**
     * Create a new return request
     * @param {Object} returnData
     * @returns {Promise<Object>} Created return record
     */
    static async create(returnData) {
        const { orderId, reason, refundAmount } = returnData;

        const returnId = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const insertQuery = `
            INSERT INTO returns (
                return_id,
                order_id,
                reason,
                refund_amount,
                return_status,
                refund_status,
                request_date
            ) VALUES ($1, $2, $3, $4, 'pending', 'pending', CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [returnId, orderId, reason, refundAmount || 0];
        const result = await query(insertQuery, values);
        return result.rows[0];
    }

    /**
     * Find return by order_id
     * @param {string} orderId
     * @returns {Promise<Object|null>}
     */
    static async findByOrderId(orderId) {
        const result = await query(
            `SELECT r.*, o.customer_name, o.customer_email, o.mobile_brand, o.mobile_model,
                    o.total_amount, o.created_at AS purchase_date
             FROM returns r
             JOIN orders o ON o.order_id = r.order_id
             WHERE r.order_id = $1`,
            [orderId]
        );
        return result.rows[0] || null;
    }

    /**
     * Find return by return_id
     * @param {string} returnId
     * @returns {Promise<Object|null>}
     */
    static async findByReturnId(returnId) {
        const result = await query(
            `SELECT r.*, o.customer_name, o.customer_email, o.mobile_brand, o.mobile_model,
                    o.total_amount, o.created_at AS purchase_date, o.order_id
             FROM returns r
             JOIN orders o ON o.order_id = r.order_id
             WHERE r.return_id = $1`,
            [returnId]
        );
        return result.rows[0] || null;
    }

    /**
     * Get all return requests (admin)
     * @param {number} limit
     * @param {number} offset
     * @returns {Promise<Array>}
     */
    static async findAll(limit = 100, offset = 0) {
        const result = await query(
            `SELECT r.*, o.customer_name, o.customer_email, o.mobile_brand, o.mobile_model,
                    o.total_amount, o.created_at AS purchase_date, o.delivery_status
             FROM returns r
             JOIN orders o ON o.order_id = r.order_id
             ORDER BY r.request_date DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }

    /**
     * Filter returns by status (admin)
     * @param {string} status
     * @returns {Promise<Array>}
     */
    static async findByStatus(status) {
        const result = await query(
            `SELECT r.*, o.customer_name, o.customer_email, o.mobile_brand, o.mobile_model,
                    o.total_amount, o.created_at AS purchase_date
             FROM returns r
             JOIN orders o ON o.order_id = r.order_id
             WHERE r.return_status = $1
             ORDER BY r.request_date DESC`,
            [status]
        );
        return result.rows;
    }

    /**
     * Admin: approve or reject a return
     * @param {string} returnId
     * @param {string} status  'approved' | 'rejected'
     * @param {string} adminNotes
     * @returns {Promise<Object>}
     */
    static async updateStatus(returnId, status, adminNotes = '') {
        const result = await query(
            `UPDATE returns
             SET return_status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
             WHERE return_id = $3
             RETURNING *`,
            [status, adminNotes, returnId]
        );
        return result.rows[0];
    }

    /**
     * Admin: mark refund as completed
     * @param {string} returnId
     * @param {number} refundAmount
     * @returns {Promise<Object>}
     */
    static async processRefund(returnId, refundAmount) {
        const result = await query(
            `UPDATE returns
             SET refund_status = 'completed',
                 refund_amount = $1,
                 refund_date = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE return_id = $2
             RETURNING *`,
            [refundAmount, returnId]
        );
        return result.rows[0];
    }

    /**
     * Count returns grouped by status (admin stats)
     * @returns {Promise<Object>}
     */
    static async getStats() {
        const result = await query(`
            SELECT
                COUNT(*) FILTER (WHERE return_status = 'pending')   AS pending,
                COUNT(*) FILTER (WHERE return_status = 'approved')  AS approved,
                COUNT(*) FILTER (WHERE return_status = 'rejected')  AS rejected,
                COUNT(*) FILTER (WHERE refund_status = 'completed') AS refund_completed,
                COUNT(*)                                             AS total
            FROM returns
        `);
        return result.rows[0];
    }
}

module.exports = Return;
