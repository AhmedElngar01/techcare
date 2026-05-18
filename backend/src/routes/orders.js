const express = require('express');
const { body } = require('express-validator');
const { db } = require('../config/db');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res, next) => {
    try {
        const orders = db.prepare(`
            SELECT o.*, p.name as part_name, p.image_url as part_image 
            FROM orders o
            JOIN parts p ON o.part_id = p.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `).all(req.user.id);
        
        res.json({ success: true, data: orders });
    } catch (err) {
        next(err);
    }
});

router.post('/', [
    body('part_id').isInt().withMessage('Part ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('shipping_address').trim().escape().notEmpty().withMessage('Shipping address is required'),
    body('delivery_option').isIn(['standard', 'express']).withMessage('Delivery option must be standard or express')
], validate, (req, res, next) => {
    try {
        const { part_id, quantity, shipping_address, delivery_option } = req.body;
        
        const part = db.prepare('SELECT price, stock FROM parts WHERE id = ?').get(part_id);
        if (!part) {
            const err = new Error('Part not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        if (part.stock < quantity) {
            const err = new Error('Insufficient stock');
            err.name = 'ConflictError';
            throw err;
        }
        
        const totalPrice = part.price * quantity;
        const shopifyOrderId = `MOCK-${crypto.randomUUID()}`;
        
        const insertTx = db.transaction(() => {
            const result = db.prepare(`
                INSERT INTO orders (user_id, part_id, quantity, total_price, shipping_address, delivery_option, shopify_order_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(req.user.id, part_id, quantity, totalPrice, shipping_address, delivery_option, shopifyOrderId);
            
            db.prepare('UPDATE parts SET stock = stock - ? WHERE id = ?').run(quantity, part_id);
            
            return result.lastInsertRowid;
        });
        
        const orderId = insertTx();
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        
        res.json({ success: true, data: order, message: 'Order created successfully' });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', (req, res, next) => {
    try {
        const order = db.prepare(`
            SELECT o.*, p.name as part_name, p.image_url as part_image, p.price as part_price 
            FROM orders o
            JOIN parts p ON o.part_id = p.id
            WHERE o.id = ? AND o.user_id = ?
        `).get(req.params.id, req.user.id);
        
        if (!order) {
            const err = new Error('Order not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(order.id);
        order.payment = payment || null;
        
        res.json({ success: true, data: order });
    } catch (err) {
        next(err);
    }
});

router.patch('/:id/cancel', (req, res, next) => {
    try {
        const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        
        if (!order) {
            const err = new Error('Order not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        if (order.status !== 'pending') {
            const err = new Error('Only pending orders can be cancelled');
            err.name = 'ConflictError';
            throw err;
        }
        
        const cancelTx = db.transaction(() => {
            db.prepare('UPDATE orders SET status = "cancelled" WHERE id = ?').run(order.id);
            db.prepare('UPDATE parts SET stock = stock + ? WHERE id = ?').run(order.quantity, order.part_id);
        });
        
        cancelTx();
        
        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
