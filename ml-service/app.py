
from flask import Flask, request, jsonify
from flask_cors import CORS

from train_model import predict_next_month

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "FinanceFlow ML Service is running"
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)

        if not data or "monthly_expenses" not in data:
            return jsonify({
                "error": "Please provide monthly_expenses"
            }), 400

        result = predict_next_month(data["monthly_expenses"])

        return jsonify({
            "success": True,
            "prediction": result
        })

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "An unexpected error occurred"
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
