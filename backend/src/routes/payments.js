const express = require('express');
const { body } = require('express-validator');
const { db } = require('../config/db');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

router.use(requireAuth);

router.post('/', [
    body('order_id').isInt().withMessage('Order ID is required'),
    body('method').isIn(['card', 'wallet']).withMessage('Method must be card or wallet')
], validate, (req, res, next) => {
    try {
        const { order_id, method } = req.body;
        
        const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
        
        if (!order) {
            const err = new Error('Order not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        if (order.status !== 'pending') {
            const err = new Error('Only pending orders can be paid');
            err.name = 'ConflictError';
            throw err;
        }
        
        const existingPayment = db.prepare('SELECT id FROM payments WHERE order_id = ? AND status = "success"').get(order_id);
        if (existingPayment) {
            const err = new Error('Order is already paid');
            err.name = 'ConflictError';
            throw err;
        }
        
        // Mock payment logic: 90% success
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
            const mockTxId = `TXN-${crypto.randomUUID()}`;
            
            const paymentTx = db.transaction(() => {
                const result = db.prepare(`
                    INSERT INTO payments (order_id, amount, currency, method, status, mock_transaction_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(order.id, order.total_price, 'USD', method, 'success', mockTxId);
                
                db.prepare('UPDATE orders SET status = "paid" WHERE id = ?').run(order.id);
                
                return result.lastInsertRowid;
            });
            
            const paymentId = paymentTx();
            const receipt = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
            
            res.json({ success: true, data: receipt, message: 'Payment successful' });
        } else {
            db.prepare(`
                INSERT INTO payments (order_id, amount, currency, method, status)
                VALUES (?, ?, ?, ?, ?)
            `).run(order.id, order.total_price, 'USD', method, 'failed');
            
            return res.status(402).json({ success: false, message: 'Payment declined. Please try again.' });
        }
    } catch (err) {
        next(err);
    }
});

router.get('/:order_id', (req, res, next) => {
    try {
        const order = db.prepare('SELECT id FROM orders WHERE id = ? AND user_id = ?').get(req.params.order_id, req.user.id);
        if (!order) {
            const err = new Error('Order not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        const payments = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC').all(order.id);
        res.json({ success: true, data: payments });
    } catch (err) {
        next(err);
    }
});

router.post('/:id/refund', (req, res, next) => {
    try {
        const payment = db.prepare(`
            SELECT p.*, o.user_id 
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            WHERE p.id = ? AND o.user_id = ?
        `).get(req.params.id, req.user.id);
        
        if (!payment) {
            const err = new Error('Payment not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        if (payment.status !== 'success') {
            const err = new Error('Only successful payments can be refunded');
            err.name = 'ConflictError';
            throw err;
        }
        
        const refundTx = db.transaction(() => {
            db.prepare('UPDATE payments SET status = "refunded" WHERE id = ?').run(payment.id);
            db.prepare('UPDATE orders SET status = "pending" WHERE id = ?').run(payment.order_id);
        });
        
        refundTx();
        res.json({ success: true, message: 'Payment refunded' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
