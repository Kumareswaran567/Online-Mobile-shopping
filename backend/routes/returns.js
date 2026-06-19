// Returns Routes — customer + admin APIs
const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
const Order  = require('../models/Order');

// ─────────────────────────────────────────────
// CUSTOMER APIS
// ─────────────────────────────────────────────

/**
 * POST /api/returns/check-eligibility
 * Body: { orderId }
 * Checks: order exists, delivered, within 15 days, no existing return
 */
router.post('/check-eligibility', async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });

        const order = await Order.findByOrderId(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // 15-day window check
        const purchase = new Date(order.created_at);
        const now      = new Date();
        const diffDays = Math.floor((now - purchase) / (1000 * 60 * 60 * 24));
        const withinWindow = diffDays <= 15;

        // Delivery check
        const isDelivered = order.delivery_status === 'delivered';

        // Existing return check
        const existingReturn = await Return.findByOrderId(orderId);
        const hasReturn = !!existingReturn;

        const eligible = withinWindow && isDelivered && !hasReturn;

        return res.json({
            success: true,
            eligible,
            reasons: {
                withinWindow,
                isDelivered,
                hasReturn,
                daysElapsed: diffDays,
                daysRemaining: Math.max(0, 15 - diffDays)
            },
            existingReturn: existingReturn || null,
            order: {
                orderId: order.order_id,
                customerName: order.customer_name,
                customerEmail: order.customer_email,
                product: `${order.mobile_brand} ${order.mobile_model}`,
                totalAmount: order.total_amount,
                purchaseDate: order.created_at,
                status: order.status,
                deliveryStatus: order.delivery_status
            }
        });

    } catch (err) {
        console.error('check-eligibility error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

/**
 * POST /api/returns/verify-identity
 * Body: { orderId, name, email }
 * Verifies that the supplied name+email match the stored order record.
 */
router.post('/verify-identity', async (req, res) => {
    try {
        const { orderId, name, email } = req.body;
        if (!orderId || !name || !email)
            return res.status(400).json({ success: false, message: 'orderId, name, and email are required' });

        const order = await Order.findByOrderId(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const nameMatch  = order.customer_name.trim().toLowerCase()  === name.trim().toLowerCase();
        const emailMatch = order.customer_email.trim().toLowerCase() === email.trim().toLowerCase();

        if (!nameMatch || !emailMatch) {
            return res.status(403).json({
                success: false,
                verified: false,
                message: 'Name or email does not match purchase records. Access denied.'
            });
        }

        res.json({ success: true, verified: true, message: 'Identity verified successfully' });

    } catch (err) {
        console.error('verify-identity error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

/**
 * POST /api/returns/request
 * Body: { orderId, name, email, reason }
 * Creates the return request after re-verifying identity + eligibility.
 */
router.post('/request', async (req, res) => {
    try {
        const { orderId, name, email, reason } = req.body;

        if (!orderId || !name || !email || !reason)
            return res.status(400).json({ success: false, message: 'orderId, name, email, and reason are required' });

        const validReasons = [
            'Product not satisfied',
            'Hardware issue',
            'Software issue',
            'Wrong product received',
            'Other reasons'
        ];
        if (!validReasons.includes(reason))
            return res.status(400).json({ success: false, message: 'Invalid return reason' });

        const order = await Order.findByOrderId(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // Re-verify identity
        const nameMatch  = order.customer_name.trim().toLowerCase()  === name.trim().toLowerCase();
        const emailMatch = order.customer_email.trim().toLowerCase() === email.trim().toLowerCase();
        if (!nameMatch || !emailMatch)
            return res.status(403).json({ success: false, message: 'Identity verification failed' });

        // Re-check eligibility
        const purchase  = new Date(order.created_at);
        const diffDays  = Math.floor((new Date() - purchase) / (1000 * 60 * 60 * 24));
        if (diffDays > 15)
            return res.status(400).json({ success: false, message: 'Return period of 15 days has expired' });

        if (order.delivery_status !== 'delivered')
            return res.status(400).json({ success: false, message: 'Order has not been delivered yet' });

        // One return per order
        const existingReturn = await Return.findByOrderId(orderId);
        if (existingReturn)
            return res.status(400).json({ success: false, message: 'A return request already exists for this order' });

        // Create return & update order status
        const returnRecord = await Return.create({ orderId, reason, refundAmount: order.total_amount });
        await Order.updateStatus(orderId, 'return_requested');

        res.status(201).json({
            success: true,
            message: 'Return request submitted successfully',
            return: {
                returnId:     returnRecord.return_id,
                orderId:      returnRecord.order_id,
                reason:       returnRecord.reason,
                returnStatus: returnRecord.return_status,
                refundStatus: returnRecord.refund_status,
                requestDate:  returnRecord.request_date
            }
        });

    } catch (err) {
        console.error('return request error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

/**
 * GET /api/returns/order/:orderId
 * Get return + refund status for a specific order (customer-facing)
 */
router.get('/order/:orderId', async (req, res) => {
    try {
        const returnRecord = await Return.findByOrderId(req.params.orderId);
        if (!returnRecord)
            return res.status(404).json({ success: false, message: 'No return request found for this order' });

        res.json({ success: true, return: returnRecord });

    } catch (err) {
        console.error('get return error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// CUSTOMER — look up orders by email + name
// ─────────────────────────────────────────────

/**
 * POST /api/returns/my-orders
 * Body: { email, name }
 * Returns orders for that customer (identity verified)
 */
router.post('/my-orders', async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email || !name)
            return res.status(400).json({ success: false, message: 'email and name are required' });

        const orders = await Order.findByEmail(email.trim().toLowerCase());

        // Filter by name match (case-insensitive)
        const matched = orders.filter(o =>
            o.customer_name.trim().toLowerCase() === name.trim().toLowerCase()
        );

        if (matched.length === 0)
            return res.status(404).json({ success: false, message: 'No orders found for this name and email combination' });

        // For each order, check return eligibility and attach return record if any
        const ordersWithReturn = await Promise.all(matched.map(async (order) => {
            const purchase  = new Date(order.created_at);
            const diffDays  = Math.floor((new Date() - purchase) / (1000 * 60 * 60 * 24));
            const returnRec = await Return.findByOrderId(order.order_id);

            return {
                id:            order.id,
                orderId:       order.order_id,
                product:       `${order.mobile_brand} ${order.mobile_model}`,
                mobileBrand:   order.mobile_brand,
                mobileModel:   order.mobile_model,
                totalAmount:   order.total_amount,
                status:        order.status,
                deliveryStatus: order.delivery_status,
                purchaseDate:  order.created_at,
                daysElapsed:   diffDays,
                returnEligible: diffDays <= 15 && order.delivery_status === 'delivered' && !returnRec,
                returnExpired:  diffDays > 15,
                returnRecord:  returnRec || null
            };
        }));

        res.json({ success: true, count: ordersWithReturn.length, orders: ordersWithReturn });

    } catch (err) {
        console.error('my-orders error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// ADMIN APIS
// ─────────────────────────────────────────────

/**
 * GET /api/returns
 * Admin: all return requests (optional ?status=pending|approved|rejected)
 */
router.get('/', async (req, res) => {
    try {
        const { status, limit = 100, offset = 0 } = req.query;
        const returns = status
            ? await Return.findByStatus(status)
            : await Return.findAll(parseInt(limit), parseInt(offset));

        const stats = await Return.getStats();

        res.json({ success: true, count: returns.length, stats, returns });

    } catch (err) {
        console.error('admin get returns error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

/**
 * PUT /api/returns/:returnId/approve
 * Admin: approve a return request
 */
router.put('/:returnId/approve', async (req, res) => {
    try {
        const { returnId } = req.params;
        const { adminNotes = '' } = req.body;

        const returnRec = await Return.findByReturnId(returnId);
        if (!returnRec) return res.status(404).json({ success: false, message: 'Return request not found' });
        if (returnRec.return_status !== 'pending')
            return res.status(400).json({ success: false, message: 'Return is not in pending state' });

        const updated = await Return.updateStatus(returnId, 'approved', adminNotes);
        await Order.updateStatus(returnRec.order_id, 'return_approved');

        res.json({ success: true, message: 'Return approved successfully', return: updated });

    } catch (err) {
        console.error('approve return error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

/**
 * PUT /api/returns/:returnId/reject
 * Admin: reject a return request
 */
router.put('/:returnId/reject', async (req, res) => {
    try {
        const { returnId } = req.params;
        const { adminNotes = '' } = req.body;

        const returnRec = await Return.findByReturnId(returnId);
        if (!returnRec) return res.status(404).json({ success: false, message: 'Return request not found' });
        if (returnRec.return_status !== 'pending')
            return res.status(400).json({ success: false, message: 'Return is not in pending state' });

        const updated = await Return.updateStatus(returnId, 'rejected', adminNotes);
        await Order.updateStatus(returnRec.order_id, 'return_rejected');

        res.json({ success: true, message: 'Return rejected', return: updated });

    } catch (err) {
        console.error('reject return error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

/**
 * PUT /api/returns/:returnId/refund
 * Admin: mark refund as completed after mobile is received
 */
router.put('/:returnId/refund', async (req, res) => {
    try {
        const { returnId } = req.params;
        const { refundAmount } = req.body;

        const returnRec = await Return.findByReturnId(returnId);
        if (!returnRec) return res.status(404).json({ success: false, message: 'Return request not found' });
        if (returnRec.return_status !== 'approved')
            return res.status(400).json({ success: false, message: 'Return must be approved before processing refund' });
        if (returnRec.refund_status === 'completed')
            return res.status(400).json({ success: false, message: 'Refund already processed' });

        const amount  = refundAmount || returnRec.total_amount;
        const updated = await Return.processRefund(returnId, amount);
        await Order.updateStatus(returnRec.order_id, 'refund_completed');

        res.json({ success: true, message: 'Refund processed successfully', return: updated });

    } catch (err) {
        console.error('process refund error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;
