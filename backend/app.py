from flask import Flask, jsonify, request
import mysql.connector
from flask_cors import CORS
import os
from dotenv import load_dotenv
import yfinance as yf
import threading
import time

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})

load_dotenv()

db_host = os.getenv("DB_HOST")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_name = os.getenv("DB_NAME")


def get_db_connection():
    connection = mysql.connector.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        database=db_name
    )
    return connection

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "API is working!"})

@app.route('/api/info', methods=['GET'])
def get_info():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("SELECT symbol, shares, price FROM portfolio WHERE user_id = %s", (user_id,))
        portfolio = cursor.fetchall()

        cursor.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()

        db.close()

        if not user_data:
            return jsonify({"error": "User not found"}), 404

        balance = user_data["balance"]

        print({"balance": balance, "portfolio": portfolio})

        return jsonify({"balance": balance, "portfolio": portfolio})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/buy_stock', methods=['POST'])
def buy_stock():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415

    data = request.get_json()
    user_id = data.get("user_id")
    symbol = data.get("symbol")
    shares = data.get("shares")

    if not user_id or not symbol or not shares:
        return jsonify({"error": "Missing required parameters"}), 400

    stock_price = fetch_stock_price(symbol)

    if stock_price is None:
        return jsonify({"error": "Invalid stock symbol or stock not found"}), 400

    total_cost = shares * stock_price

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # Get user's current balance
        cursor.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()

        if not user_data:
            return jsonify({"error": "User not found"}), 404

        balance = user_data["balance"]

        # Check if user has enough balance
        if balance < total_cost:
            return jsonify({"error": "Insufficient balance"}), 400

        # Subtract price from balance
        new_balance = balance - total_cost
        cursor.execute("UPDATE users SET balance = %s WHERE id = %s", (new_balance, user_id))

        # Check if the stock already exists in the user's portfolio
        cursor.execute("SELECT shares FROM portfolio WHERE user_id = %s AND symbol = %s", (user_id, symbol))
        existing_stock = cursor.fetchone()

        if existing_stock:
            # If stock exists, update the shares
            new_shares = existing_stock["shares"] + shares
            cursor.execute("UPDATE portfolio SET shares = %s, price = %s WHERE user_id = %s AND symbol = %s",
                           (new_shares, stock_price, user_id, symbol))
        else:
            # If stock doesn't exist, insert a new row
            cursor.execute("INSERT INTO portfolio (user_id, symbol, shares, price) VALUES (%s, %s, %s, %s)",
                           (user_id, symbol, shares, stock_price))

        # Add transaction history
        cursor.execute("INSERT INTO transactions (user_id, symbol, shares, price, type) VALUES (%s, %s, %s, %s, 'BUY')",
                       (user_id, symbol, shares, stock_price))

        db.commit()
        db.close()

        return jsonify({"message": "Stock purchased successfully", "new_balance": new_balance})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sell_stock', methods=['POST'])
def sell_stock():
    data = request.get_json()
    user_id = data.get('user_id')
    symbol = data.get('symbol')
    shares = data.get('shares')

    if not user_id or not symbol or not shares:
        return jsonify({"error": "All fields are required"}), 400

    stock_price = fetch_stock_price(symbol)

    if stock_price is None:
        return jsonify({"error": "Invalid stock symbol or stock not found"}), 400

    total_sale = shares * stock_price

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # Check if user has enough shares
        cursor.execute("SELECT shares FROM portfolio WHERE user_id = %s AND symbol = %s", (user_id, symbol))
        stock = cursor.fetchone()

        if not stock or stock['shares'] < shares:
            return jsonify({"error": "Not enough shares to sell"}), 400

        # Update portfolio by reducing shares
        cursor.execute("""
            UPDATE portfolio
            SET shares = shares - %s
            WHERE user_id = %s AND symbol = %s
        """, (shares, user_id, symbol))

        cursor.execute("""
            DELETE FROM portfolio WHERE user_id = %s AND symbol = %s AND shares = 0
        """, (user_id, symbol))

        # Update user balance by adding the sale amount
        cursor.execute("UPDATE users SET balance = balance + %s WHERE id = %s", (total_sale, user_id))

        # Add transaction history
        cursor.execute("INSERT INTO transactions (user_id, symbol, shares, price, type) VALUES (%s, %s, %s, %s, 'SELL')",
                       (user_id, symbol, shares, stock_price))

        # Commit the transaction
        db.commit()
        db.close()

        return jsonify({"message": "Stock sold successfully!"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def fetch_stock_price(symbol):
    try:
        stock = yf.Ticker(symbol)
        stock_price = stock.history(period="1d")["Close"].iloc[-1]  # Get the latest closing price
        return round(stock_price, 2)
    except Exception as e:
        print(f"Error fetching stock price for {symbol}: {e}")
        return None

def update_stock_prices():
    while True:
        try:
            db = get_db_connection()
            cursor = db.cursor(dictionary=True)

            cursor.execute("SELECT DISTINCT symbol FROM portfolio")
            stocks = cursor.fetchall()

            for stock in stocks:
                symbol = stock["symbol"]
                latest_price = fetch_stock_price(symbol)

                if latest_price:
                    cursor.execute(
                        "UPDATE portfolio SET price = %s WHERE symbol = %s",
                        (latest_price, symbol)
                    )
                    db.commit()
                    print(f"Updated {symbol}: ${latest_price}")

            cursor.close()
            db.close()

        except Exception as e:
            print(f"Error updating stock prices: {e}")

        time.sleep(5)

threading.Thread(target=update_stock_prices, daemon=True).start()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)