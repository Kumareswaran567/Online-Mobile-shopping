
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.post('/', async (req, res) => {
    try {
        const { mobile, customer, cardNumber, totalAmount } = req.body;


        if (!mobile || !customer || !cardNumber || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: mobile, customer, cardNumber, and totalAmount are required'
            });
        }


        if (!customer.name || !customer.email) {
            return res.status(400).json({
                success: false,
                message: 'Customer name and email are required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customer.email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

 
        const cleanCardNumber = cardNumber.replace(/\s/g, '');
        if (!/^\d{16}$/.test(cleanCardNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Card number must be exactly 16 digits'
            });
        }


        const orderData = {
            mobile,
            customer,
            cardNumber: cleanCardNumber,
            totalAmount
        };
        console.log("Before create");
        const order = await Order.create(orderData);
        console.log("After create");

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            orderId: order.order_id,
            id: order.id,
            status: order.status,
            order: {
                id: order.id,
                orderId: order.order_id,
                customer: {
                    name: order.customer_name,
                    email: order.customer_email
                },
                mobile: {
                    brand: order.mobile_brand,
                    model: order.mobile_model,
                    price: order.mobile_price
                },
                totalAmount: order.total_amount,
                status: order.status,
                createdAt: order.created_at
            }
        });

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process order. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
