import { useEffect, useState } from "react";
import axios from "axios";
import './dashboard.css';

const API_URL = "http://localhost:5001/api";

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [balance, setBalance] = useState(0);

  const [buySymbol, setBuySymbol] = useState("");
  const [buyShares, setBuyShares] = useState("");

  const [sellSymbol, setSellSymbol] = useState("");
  const [sellShares, setSellShares] = useState("");

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
    const interval = setInterval(fetchInfo, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleBuyStock = async (e) => {
    e.preventDefault();
    const stockData = {
      user_id: user_id,
      symbol: buySymbol,
      shares: parseInt(buyShares),
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
          fetchInfo();
        } else {
          alert(`Error: ${data.error}`);
        }
      } else {
        alert("You don't have enough shares to sell!");
        setSellSymbol("");
        setSellShares("");
      }
    } catch (error) {
      console.error("Error selling stock:", error);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6 p-6 min-h-screen text-gray-200 h-screen item-stretch">
      {/* Portfolio */}
      <div className="col-span-2 flex flex-col h-full justify-center">
        <div className="w-full border border-gray-700 p-6 rounded-lg">
          <h1 className="text-3xl font-bold text-center mb-4">Your Portfolio</h1>
          <p className="text-xl font-semibold text-center mb-4">Balance: ${balance}</p>
          {portfolio.length > 0 ? (
            <ul>
              {portfolio.map((stock, index) => (
                <li key={index} className="border-b border-gray-700 py-3 text-center">
                  {stock.symbol} - {stock.shares} shares - ${stock.price}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">No stocks in your portfolio.</p>
          )}
        </div>
      </div>

      {/* Buy and Sell Forms */}
      <div className="flex flex-col gap-6">
        {/* Buy Form */}
        <div className="border border-gray-700 p-6 rounded-lg flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Buy Stocks</h2>
          <form onSubmit={handleBuyStock} className="flex flex-col space-y-2">
            <input
              type="text"
              placeholder="Stock Symbol (e.g., AAPL)"
              value={buySymbol}
              onChange={(e) => setBuySymbol(e.target.value.toUpperCase())}
              required
              className="border border-gray-700 p-2 rounded w-full bg-gray-800 text-white mb-2"
            />
            <input
              type="number"
              placeholder="Shares"
              value={buyShares}
              onChange={(e) => setBuyShares(e.target.value)}
              required
              className="border border-gray-700 p-2 rounded w-full bg-gray-800 text-white mb-2"
            />
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded w-full hover:bg-green-600">
              Buy Stock
            </button>
          </form>
        </div>

        {/* Sell Form */}
        <div className="border border-gray-700 p-6 rounded-lg flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Sell Stocks</h2>
          <form onSubmit={handleSellStock} className="flex flex-col space-y-2">
            <input
              type="text"
              placeholder="Stock Symbol (e.g., AAPL)"
              value={sellSymbol}
              onChange={(e) => setSellSymbol(e.target.value.toUpperCase())}
              required
              className="border border-gray-700 p-2 rounded w-full bg-gray-800 text-white mb-2"
            />
            <input
              type="number"
              placeholder="Shares"
              value={sellShares}
              onChange={(e) => setSellShares(e.target.value)}
              required
              className="border border-gray-700 p-2 rounded w-full bg-gray-800 text-white mb-2"
            />
            <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded w-full hover:bg-red-600">
              Sell Stock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;