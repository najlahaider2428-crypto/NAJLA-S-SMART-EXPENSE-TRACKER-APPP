// Get all necessary elements from the DOM
const form = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const totalIncomeEl = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");
const balanceEl = document.getElementById("balance");
const exportBtn = document.getElementById("exportBtn");

// Initialize transactions array from localStorage or an empty array if nothing is stored
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// Add event listener for form submission
form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get values from form inputs
  const amount = +document.getElementById("amount").value;
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;
  const notes = document.getElementById("notes").value;

  // Create a new transaction object
  const transaction = {
    id: Date.now(), // Unique ID using a timestamp
    amount,
    type,
    category,
    date,
    notes
  };

  // Add the new transaction to the array and save to localStorage
  transactions.push(transaction);
  saveTransactions();
  form.reset(); // Clear the form inputs
  renderTransactions(); // Re-render the transactions list and charts
});

// Function to save transactions to localStorage
function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Function to render transactions list and update balances
function renderTransactions() {
  // Clear the current list to avoid duplicates
  transactionList.innerHTML = "";
  let income = 0;
  let expense = 0;

  // Loop through each transaction
  transactions.forEach((t) => {
    // Create a new list item for the transaction
    const li = document.createElement("li");
    li.classList.add("flex", "items-center", "justify-between", "p-4", "rounded-lg", "shadow-sm", "bg-gray-50", "transaction-list-item");
    li.classList.add(t.type); // Add class for income/expense styling

    // Construct the inner HTML with transaction details and a delete button
    li.innerHTML = `
      <div class="flex-1 break-words">
        <span class="font-bold">${t.date}</span> - 
        <span class="font-semibold text-gray-800">${t.category}</span>: 
        <span class="font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">${t.amount} ₹</span>
        <span class="text-sm text-gray-500 ml-2">(${t.notes})</span>
      </div>
      <button class="delete-btn text-gray-400 hover:text-red-600 transition-colors ml-4" data-id="${t.id}">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;

    // Append the new list item to the transaction list
    transactionList.appendChild(li);

    // Calculate total income and expense
    if (t.type === "income") {
      income += t.amount;
    } else {
      expense += t.amount;
    }
  });

  // Update the balance overview section
  totalIncomeEl.innerText = income;
  totalExpenseEl.innerText = expense;
  balanceEl.innerText = income - expense;

  // Update the charts
  updateCharts();
}

// Add event listener to the transaction list for the delete button
transactionList.addEventListener("click", (e) => {
  // Check if the clicked element or its parent is the delete button
  if (e.target.closest(".delete-btn")) {
    const idToDelete = parseInt(e.target.closest(".delete-btn").dataset.id);
    transactions = transactions.filter(t => t.id !== idToDelete);
    saveTransactions();
    renderTransactions();
  }
});

// Variables to hold the chart instances
let expenseChart, incomeExpenseChart;

// Function to update and render the charts
function updateCharts() {
  const categoryTotals = {};
  let totalIncome = 0;
  let totalExpense = 0;

  // Aggregate data for the charts
  transactions.forEach((t) => {
    if (t.type === "expense") {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      totalExpense += t.amount;
    } else {
      totalIncome += t.amount;
    }
  });

  // Destroy existing chart instances to prevent duplicates
  if (expenseChart) expenseChart.destroy();
  if (incomeExpenseChart) incomeExpenseChart.destroy();

  // Get canvas contexts for the charts
  const ctx1 = document.getElementById("expenseChart").getContext("2d");
  expenseChart = new Chart(ctx1, {
    type: "pie",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: ["#F97316", "#3B82F6", "#FACC15", "#2DD4BF", "#A855F7", "#EC4899"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Expenses by Category'
        }
      }
    }
  });

  const ctx2 = document.getElementById("incomeExpenseChart").getContext("2d");
  incomeExpenseChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: ["Income", "Expense"],
      datasets: [{
        label: "Amount",
        data: [totalIncome, totalExpense],
        backgroundColor: ["#10B981", "#EF4444"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'Income vs. Expense'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Export CSV functionality
exportBtn.addEventListener("click", () => {
  let csv = "Date,Type,Category,Amount,Notes\n";
  transactions.forEach(t => {
    // Simple sanitization for notes field to handle commas
    const sanitizedNotes = `"${t.notes.replace(/"/g, '""')}"`;
    csv += `${t.date},${t.type},${t.category},${t.amount},${sanitizedNotes}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expense_report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Initial render of transactions and charts when the page loads
window.onload = function() {
  renderTransactions();
};
