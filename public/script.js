document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const historyContainer = document.getElementById('history');
    const incomeForm = document.getElementById('incomeForm');
    const expenseForm = document.getElementById('expenseForm');
    const incomeAmount = document.getElementById('money-plus');
    const expenseAmount = document.getElementById('money-minus');

    function updateHistory(transactions) {
        historyContainer.innerHTML = '';
        transactions.forEach(transaction => {
            const item = document.createElement('li');
            item.classList.add('transaction');
            item.classList.add(transaction.type === 'income' ? 'plus' : 'minus');
            item.innerHTML = `<span>${transaction.description}</span><span>${transaction.amount.toFixed(2)}</span>`;
            historyContainer.appendChild(item);
        });
    }

    function updateBalance(transactions) {
        const balance = transactions.reduce((total, transaction) => {
            return total + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
        }, 0);
        const income = transactions.filter(transaction => transaction.type === 'income')
            .reduce((total, transaction) => total + transaction.amount, 0);
        const expenses = transactions.filter(transaction => transaction.type === 'expense')
            .reduce((total, transaction) => total + transaction.amount, 0);

        document.getElementById('balance').textContent = `Balance: ₹${balance.toFixed(2)}`;
        incomeAmount.textContent = `+₹${income.toFixed(2)}`;
        expenseAmount.textContent = `-₹${expenses.toFixed(2)}`;

        if (balance === 0) {
            alert('Warning: Your balance is now zero.');
        }
    }

    fetch('/api/transactions')
        .then(response => response.json())
        .then(transactions => {
            updateHistory(transactions);
            updateBalance(transactions);
        })
        .catch(error => console.error('Error:', error));

    incomeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const description = e.target.elements.description.value;
        const amount = parseFloat(e.target.elements.amount.value);
        addTransaction(description, amount, 'income');
        e.target.reset(); 
    });

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const description = e.target.elements.description.value;
        const amount = parseFloat(e.target.elements.amount.value);
        addTransaction(description, amount, 'expense');
        e.target.reset(); 
    });

    function addTransaction(description, amount, type) {
        const transaction = { description, amount, type };
        socket.emit('newTransaction', transaction);
    }

    socket.on('newTransaction', (transaction) => {
        console.log('New transaction:', transaction);
        fetch('/api/transactions')
            .then(response => response.json())
            .then(transactions => {
                updateHistory(transactions);
                updateBalance(transactions);
            })
            .catch(error => console.error('Error:', error));
    });
});
