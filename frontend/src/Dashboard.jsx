import { useEffect, useState } from "react";
import axios from "axios";
import './dashboard.css';

const API_URL = "http://localhost:5001/api";

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [balance, setBalance] = useState(0);

  const [buySymbol, setBuySymbol] = useState("");
  const [buyShares, setBuyShares] = useState("");
  const [buyPrice, setBuyPrice] = useState("");

  const [sellSymbol, setSellSymbol] = useState("");
  const [sellShares, setSellShares] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  const user_id = 1;

  const fetchInfo = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/info?user_id=${user_id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setPortfolio(data.portfolio);
      setBalance(data.balance);
    } catch (error) {
      console.error("Error fetching info:", error);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const handleBuyStock = async (e) => {
    e.preventDefault();
    const stockData = {
      user_id: user_id,
      symbol: buySymbol,
      shares: parseInt(buyShares),
      price: parseFloat(buyPrice),
    };
    try {
      const response = await fetch("http://localhost:5001/api/buy_stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stockData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Stock purchased successfully!");
        setBuySymbol("");
        setBuyShares("");
        setBuyPrice("");
        fetchInfo();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error buying stock:", error);
    }
  };

  const handleSellStock = async (e) => {
    e.preventDefault();
    const stockData = {
      user_id: user_id,
      symbol: sellSymbol,
      shares: parseInt(sellShares),
      price: parseFloat(sellPrice),
    };

    try {
      const stockInPortfolio = portfolio.find(
        (stock) => stock.symbol === sellSymbol
      );

      if (stockInPortfolio && stockInPortfolio.shares >= stockData.shares) {
        const response = await fetch("http://localhost:5001/api/sell_stock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(stockData),
        });

        const data = await response.json();
        console.log("Response:", data);

        if (response.ok) {
          alert("Stock sold successfully!");
          setSellSymbol("");
          setSellShares("");
          setSellPrice("");
          fetchInfo();
        } else {
          alert(`Error: ${data.error}`);
        }
      } else {
        alert("You don't have enough shares to sell!");
        setSellSymbol("");
        setSellShares("");
        setSellPrice("");
      }
    } catch (error) {
      console.error("Error selling stock:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Your Portfolio</h1>
      <p className="text-lg font-semibold mt-2">Balance: ${balance}</p>
      {portfolio.length > 0 ? (
        <ul>
          {portfolio.map((stock, index) => (
            <li key={index} className="border-b py-2">
              {stock.symbol} - {stock.shares} shares - ${stock.price}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No stocks in your portfolio.</p>
      )}
      <h2 className="text-xl font-bold mt-4">Buy Stocks</h2>
      <form onSubmit={handleBuyStock} className="flex flex-col space-y-2">
        <input
          type="text"
          placeholder="Stock Symbol (e.g., AAPL)"
          value={buySymbol}
          onChange={(e) => setBuySymbol(e.target.value.toUpperCase())}
          required
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Shares"
          value={buyShares}
          onChange={(e) => setBuyShares(e.target.value)}
          required
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Price per Share"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          required
          className="p-2 border rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700">
          Buy Stock
        </button>
      </form>
      <h2 className="text-xl font-bold mt-4">Sell Stocks</h2>
      <form onSubmit={handleSellStock} className="flex flex-col space-y-2">
        <input
          type="text"
          placeholder="Stock Symbol (e.g., AAPL)"
          value={sellSymbol}
          onChange={(e) => setSellSymbol(e.target.value.toUpperCase())}
          required
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Shares"
          value={sellShares}
          onChange={(e) => setSellShares(e.target.value)}
          required
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Price per Share"
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
          required
          className="p-2 border rounded"
        />
        <button type="submit" className="bg-red-500 text-white p-2 rounded hover:bg-red-700">
          Sell Stock
        </button>
      </form>
    </div>
  );
};

export default Dashboard;