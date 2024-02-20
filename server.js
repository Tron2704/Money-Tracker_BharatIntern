const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const db = require('./config/db');
const Transaction = require('./models/transaction');
const transactionRoutes = require('./routes/transactions');

// Connection
mongoose.connect(db.url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/transactions', transactionRoutes);

io.on('connection', (socket) => {
    console.log('Client connected');

    // calculate balance
    async function calculateBalance() {
        try {
            const transactions = await Transaction.find();
            const balance = transactions.reduce((total, transaction) => {
                return total + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
            }, 0);
            return balance;
        } catch (err) {
            console.error('Error calculating balance:', err);
            return 0;
        }
    }

    // emit balance update
    async function emitBalanceUpdate() {
        const balance = await calculateBalance();
        socket.emit('balanceUpdate', balance);
    }

    // 'newTransaction' event from client
    socket.on('newTransaction', async (transaction) => {
        try {
            if (transaction.type === 'expense') {
                const balance = await calculateBalance();
                if (balance === 0) {
                    socket.emit('balanceAlert', 'Cannot add expense. Balance is already 0.');
                    return;
                }
            }

            // Add the new transaction to the database
            const newTransaction = new Transaction(transaction);
            await newTransaction.save();

            // Emit 'newTransaction' event to all clients
            io.emit('newTransaction', newTransaction);

            // Emit balance update to all clients
            emitBalanceUpdate();
        } catch (err) {
            console.error('Error adding new transaction:', err);
        }
    });

    // Emit initial balance to client on connection
    emitBalanceUpdate();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
