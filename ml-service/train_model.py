
from sklearn.linear_model import LinearRegression
import numpy as np


def predict_next_month(monthly_expenses):
    """
    Train a Linear Regression model using monthly expense history
    and predict the next month's expenses.
    """

    if not isinstance(monthly_expenses, list):
        raise ValueError("monthly_expenses must be a list")

    if len(monthly_expenses) < 3:
        raise ValueError("At least 3 months of expense data are required")

    if any(
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not np.isfinite(value)
        or value < 0
        for value in monthly_expenses
    ):
        raise ValueError("Expenses must be valid non-negative numbers")

    # Month numbers: 1, 2, 3, ...
    X = np.arange(1, len(monthly_expenses) + 1).reshape(-1, 1)

    # Actual monthly expenses
    y = np.array(monthly_expenses, dtype=float)

    # Train the ML model
    model = LinearRegression()
    model.fit(X, y)

    # Predict the next month
    next_month = np.array([[len(monthly_expenses) + 1]])
    prediction = model.predict(next_month)[0]

    # Expenses cannot be negative
    prediction = max(0, prediction)

    return {
        "predicted_expense": round(float(prediction), 2),
        "average_expense": round(float(np.mean(y)), 2),
        "trend": (
            "increasing"
            if model.coef_[0] > 0
            else "decreasing"
            if model.coef_[0] < 0
            else "stable"
        )
    }


if __name__ == "__main__":
    # Demo data for testing only — not your personal expenses.
    demo_expenses = [12000, 13500, 14000, 15500, 16000, 17500]

    result = predict_next_month(demo_expenses)

    print("Demo ML Prediction:")
    print(result)
