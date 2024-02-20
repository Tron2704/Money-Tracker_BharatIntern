const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const { io } = require('../server'); 


router.get('/', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.json(transactions);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


router.post('/', async (req, res) => {
    const { description, amount, type } = req.body;

    try {
        const newTransaction = new Transaction({
            description,
            amount,
            type
        });

        await newTransaction.save();

        io.emit('newTransaction', newTransaction);

        res.json(newTransaction);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
