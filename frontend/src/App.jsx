
import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid
} from 'recharts'
import './App.css'

function getToday() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function App() {
  const [income] = useState(50000)

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('expenses')
    return saved ? JSON.parse(saved) : []
  })

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [expenseDate, setExpenseDate] = useState(getToday())

  const [prediction, setPrediction] = useState(null)
  const [predictionError, setPredictionError] = useState('')
  const [loadingPrediction, setLoadingPrediction] = useState(false)

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses))
  }, [expenses])

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount), 0
  )

  const balance = income - totalExpenses

  function addExpense(e) {
    e.preventDefault()

    if (!name.trim() || Number(amount) <= 0 || !expenseDate) {
      alert('Please enter valid expense details')
      return
    }

    const newExpense = {
      id: Date.now(),
      name: name.trim(),
      amount: Number(amount),
      category,
      date: expenseDate
    }

    setExpenses([...expenses, newExpense])
    setName('')
    setAmount('')
    setPrediction(null)
    setPredictionError('')
  }

  function deleteExpense(id) {
    setExpenses(expenses.filter(expense => expense.id !== id))
    setPrediction(null)
  }

  // Build monthly expense totals from dated transactions.
  const monthTotals = {}

  expenses.forEach(expense => {
    if (!expense.date) return

    const month = expense.date.slice(0, 7)

    monthTotals[month] =
      (monthTotals[month] || 0) + Number(expense.amount)
  })

  // Include months with zero spending between the first and last month.
  const monthKeys = Object.keys(monthTotals).sort()
  const monthlyExpenses = []

  if (monthKeys.length > 0) {
    const [startYear, startMonth] = monthKeys[0].split('-').map(Number)
    const [endYear, endMonth] = monthKeys[monthKeys.length - 1]
      .split('-').map(Number)

    let current = new Date(startYear, startMonth - 1, 1)
    const end = new Date(endYear, endMonth - 1, 1)

    while (current <= end) {
      const key = `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(2, '0')}`

      monthlyExpenses.push(monthTotals[key] || 0)
      current.setMonth(current.getMonth() + 1)
    }
  }

  async function predictExpenses() {
    setPrediction(null)
    setPredictionError('')

    if (monthlyExpenses.length < 3) {
      setPredictionError(
        'Add expenses across at least 3 different months before predicting.'
      )
      return
    }

    setLoadingPrediction(true)

    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monthly_expenses: monthlyExpenses
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Prediction failed')
      }

      setPrediction(result.prediction)
    } catch (error) {
      setPredictionError(
        'Could not connect to the Python ML service. Make sure app.py is running.'
      )
    } finally {
      setLoadingPrediction(false)
    }
  }

  const categoryData = Object.values(
    expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = {
          name: expense.category,
          amount: 0
        }
      }

      acc[expense.category].amount += Number(expense.amount)
      return acc
    }, {})
  )

  const COLORS = [
    '#2563eb', '#16a34a', '#f59e0b',
    '#9333ea', '#ef4444'
  ]

  return (
    <div className="dashboard">

      <header className="header">
        <div>
          <h1>FinanceFlow</h1>
          <p>Personal Finance & Expense Prediction System</p>
        </div>
        <span className="status">Dashboard</span>
      </header>

      <section className="cards">
        <div className="card">
          <h3>Total Income</h3>
          <h2>₹{income.toLocaleString('en-IN')}</h2>
        </div>

        <div className="card">
          <h3>Total Expenses</h3>
          <h2>₹{totalExpenses.toLocaleString('en-IN')}</h2>
        </div>

        <div className="card">
          <h3>Remaining Balance</h3>
          <h2>₹{balance.toLocaleString('en-IN')}</h2>
        </div>
      </section>

      <section className="panel">
        <h2>Add New Expense</h2>

        <form onSubmit={addExpense} className="expense-form">
          <input
            type="text"
            placeholder="Expense name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount (₹)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Education</option>
            <option>Entertainment</option>
            <option>Health</option>
            <option>Other</option>
          </select>

          <input
            type="date"
            value={expenseDate}
            onChange={e => setExpenseDate(e.target.value)}
            required
          />

          <button type="submit">Add Expense</button>
        </form>
      </section>

      <section className="panel">
        <h2>Recent Transactions</h2>

        {expenses.length === 0 ? (
          <p className="empty">No expenses added yet.</p>
        ) : (
          expenses.map(expense => (
            <div className="transaction" key={expense.id}>
              <div>
                <strong>{expense.name}</strong>
                <p>
                  {expense.category}
                  {expense.date ? ` • ${expense.date}` : ' • Date not recorded'}
                </p>
              </div>

              <div className="transaction-right">
                <strong>
                  ₹{Number(expense.amount).toLocaleString('en-IN')}
                </strong>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => deleteExpense(expense.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="analytics">
        <div className="panel">
          <h2>Expense Distribution</h2>

          {categoryData.length > 0 ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={value => `₹${value}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty">Add expenses to view analytics.</p>
          )}
        </div>

        <div className="panel">
          <h2>Category-wise Spending</h2>

          {categoryData.length > 0 ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={value => `₹${value}`} />
                  <Bar dataKey="amount" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty">No spending data available.</p>
          )}
        </div>
      </section>

      <section className="panel prediction">
        <h2>AI Expense Prediction</h2>

        <p>
          Predict your next month's expenses using your monthly spending history.
        </p>

        <p className="history-note">
          Monthly records available: {monthlyExpenses.length}
          {' '} | At least 3 months are required.
        </p>

        <button
          type="button"
          className="predict-btn"
          onClick={predictExpenses}
          disabled={loadingPrediction}
        >
          {loadingPrediction ? 'Predicting...' : 'Predict Next Month'}
        </button>

        {predictionError && (
          <p className="prediction-error">{predictionError}</p>
        )}

        {prediction && (
          <div className="prediction-result">
            <h3>Predicted Next Month's Expenses</h3>

            <h2>
              ₹{prediction.predicted_expense.toLocaleString('en-IN')}
            </h2>

            <p>
              Average monthly expenses: ₹
              {prediction.average_expense.toLocaleString('en-IN')}
            </p>

            <p>
              Spending trend: <strong>{prediction.trend}</strong>
            </p>
          </div>
        )}
      </section>

      <footer>
        FinanceFlow | Personal Finance Analytics
      </footer>

    </div>
  )
}

export default App
