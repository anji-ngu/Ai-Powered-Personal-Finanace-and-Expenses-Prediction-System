
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors({
  origin: 'http://localhost:5173'
}))

app.use(express.json())

// Expense database structure
const expenseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
})

const Expense = mongoose.model('Expense', expenseSchema)

// Check whether the backend is running
app.get('/', (req, res) => {
  res.json({
    message: 'FinanceFlow Express Backend is running'
  })
})

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 })
    res.json(expenses)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch expenses' })
  }
})

// Add a new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { name, amount, category, date } = req.body

    if (
      !name ||
      !category ||
      !date ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        error: 'Please provide valid expense details'
      })
    }

    const expense = await Expense.create({
      name,
      amount: Number(amount),
      category,
      date
    })

    res.status(201).json(expense)
  } catch (error) {
    res.status(500).json({ error: 'Could not save expense' })
  }
})

// Delete an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid expense ID' })
    }

    const expense = await Expense.findByIdAndDelete(req.params.id)

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    res.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Could not delete expense' })
  }
})

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5001

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully')

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`)
    })
  })
  .catch(error => {
  console.error('MongoDB connection failed:', error)
  process.exit(1)
})