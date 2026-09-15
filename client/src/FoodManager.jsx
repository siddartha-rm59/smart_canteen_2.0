import { useEffect, useState } from "react";
import "./FoodManager.css";
const API_BASE_URL = import.meta.env.VITE_API_URL;

function FoodManager({ user, onLogout }) {
  const [food, setFood] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddFood, setShowAddFood] = useState(false);

  const [editingFood, setEditingFood] = useState(null);
  const [managerSection, setManagerSection] = useState("home");

  const [salesData, setSalesData] = useState(null);
const [salesLoading, setSalesLoading] = useState(false);
const [salesError, setSalesError] = useState("");

const [demandData, setDemandData] = useState([]);
const [demandLoading, setDemandLoading] = useState(false);
const [demandError, setDemandError] = useState("");


const [graphData, setGraphData] = useState([]);
const [graphLoading, setGraphLoading] = useState(false);
const [graphError, setGraphError] = useState("");

const [stockAlerts, setStockAlerts] = useState([]);
const [stockLoading, setStockLoading] = useState(false);
const [stockError, setStockError] = useState("");


async function loadStockAlerts() {
  try {
    setStockLoading(true);
    setStockError("");

    const response = await fetch(
      `${API_BASE_URL}/api/manager/stock-alerts`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load stock alerts"
      );
    }

    setStockAlerts(data.alerts || []);
  } catch (error) {
    console.error("Stock alerts error:", error);
    setStockError("Unable to load stock alerts.");
  } finally {
    setStockLoading(false);
  }
}


  const [newFood, setNewFood] = useState({
  name: "",
  description: "",
  price: "",
  category: "",
  stock_quantity: "",
  image_url: "",
});

  async function loadFood() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/food`
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        console.error("Server returned:", text);
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load food"
        );
      }

      setFood(data.food || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load food items.");
    } finally {
      setLoading(false);
    }
  }


async function loadSalesData() {
  try {
    setSalesLoading(true);
    setSalesError("");

    const response = await fetch(
      `${API_BASE_URL}/api/manager/sales`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load sales data"
      );
    }

    setSalesData(data);
  } catch (error) {
    console.error("Sales dashboard error:", error);
    setSalesError("Unable to load sales data.");
  } finally {
    setSalesLoading(false);
  }
}

async function loadDemandData() {
  try {
    setDemandLoading(true);
    setDemandError("");

    const response = await fetch(
      `${API_BASE_URL}/api/manager/demand`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load demand data"
      );
    }

    setDemandData(data.demand || []);
  } catch (error) {
    console.error("Demand analysis error:", error);
    setDemandError("Unable to load demand data.");
  } finally {
    setDemandLoading(false);
  }
}


async function loadGraphData() {
  try {
    setGraphLoading(true);
    setGraphError("");

    const response = await fetch(
      `${API_BASE_URL}/api/manager/graphs`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load graph data"
      );
    }

    setGraphData(data.graphs || []);
  } catch (error) {
    console.error("Graphs error:", error);
    setGraphError("Unable to load graph data.");
  } finally {
    setGraphLoading(false);
  }
}


  async function updateAvailability(item) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/manager/food/${item.id}/availability`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            available: !item.available,
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        console.error("Server returned:", text);
        throw new Error(
          "Backend returned an HTML error page. Check the server terminal."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update availability"
        );
      }

      await loadFood();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

 useEffect(() => {
  loadFood();
}, []);


useEffect(() => {
  if (managerSection === "sales") {
    loadSalesData();
  }

  if (managerSection === "demand") {
    loadDemandData();
  }

  if (managerSection === "graphs") {
    loadGraphData();
  }
if (managerSection === "alerts") {
    loadStockAlerts();
  }

}, [managerSection]);


  return (
    <div className="manager-page">

      <header className="manager-header">
        <div>
          <h1>Kishkinda University</h1>
        </div>

        <button
          onClick={onLogout}
          className="manager-logout"
        >
          Logout
        </button>
      </header>

      <main className="manager-content">

        <section className="manager-welcome">

          <h2>
            {user?.name || "Food Manager"}
          </h2>

          <span>
            Manage Food, Stock and Orders.
          </span>
        </section>


{managerSection === "home" && (
  <section className="manager-menu">

    <h2>FOOD MANAGEMENT</h2>

    <button onClick={() => setManagerSection("add")}>
      ADD FOOD ITEM
    </button>

    <button onClick={() => setManagerSection("view")}>
      VIEW FOOD ITEMS
    </button>

    <button onClick={() => setManagerSection("edit")}>
      EDIT FOOD ITEM
    </button>

    <button onClick={() => setManagerSection("delete")}>
      DELETE FOOD ITEM
    </button>

    

    <h2>SALES & ANALYSIS</h2>

    <button onClick={() => setManagerSection("sales")}>
      SALES DASHBOARD
    </button>

    <button onClick={() => setManagerSection("demand")}>
      DEMAND ANALYSIS
    </button>

    <button onClick={() => setManagerSection("graphs")}>
      GRAPHS
    </button>

    <h2>INVENTORY</h2>

    <button onClick={() => setManagerSection("alerts")}>
      STOCK ALERTS
    </button>

  </section>
)}



{managerSection === "add" && (
  <div className="manager-add-food-form">
    <h3>Add New Food</h3>

    <input
  type="text"
  placeholder="Food name"
  value={newFood.name}
  onChange={(e) =>
    setNewFood({
      ...newFood,
      name: e.target.value,
    })
  }
/>


    <input
      type="text"
      placeholder="Description"
      value={newFood.description}
      onChange={(e) =>
        setNewFood({
          ...newFood,
          description: e.target.value,
        })
      }
    />

    <input
      type="number"
      placeholder="Price"
      value={newFood.price}
      onChange={(e) =>
        setNewFood({
          ...newFood,
          price: e.target.value,
        })
      }
    />

    <select
  value={newFood.category}
  onChange={(e) =>
    setNewFood({
      ...newFood,
      category: e.target.value,
    })
  }
>
  <option value="" disabled>
    Select Category
  </option>
  <option value="Tiffens">Tiffens</option>
  <option value="Rice Items">Rice Items</option>
  <option value="Snacks">Snacks</option>
  <option value="Beverages">Beverages</option>
</select>

    <input
      type="number"
      placeholder="Stock quantity"
      value={newFood.stock_quantity}
      onChange={(e) =>
        setNewFood({
          ...newFood,
          stock_quantity: e.target.value,
        })
      }
    />

    <input
      type="text"
      placeholder="Image URL"
      value={newFood.image_url}
      onChange={(e) =>
        setNewFood({
          ...newFood,
          image_url: e.target.value,
        })
      }
    />

<button
  onClick={async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/manager/food`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newFood),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to add food"
        );
      }

      alert("Food item added successfully");

      setNewFood({
        name: "",
        description: "",
        price: "",
        category: "",
        stock_quantity: "",
        image_url: "",
      });

      setManagerSection("home");
      await loadFood();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }}
>
  Add Food
</button>

   <button
  onClick={() => setManagerSection("home")}
>
  ← Back
</button>
  </div>
)}


{managerSection === "edit" && !editingFood && (
  <section className="manager-section">

    <button onClick={() => setManagerSection("home")}>
      ← Back
    </button>

    <div className="manager-section-header">
      <div>
        <h2>Edit Food Item</h2>
        <p>Select a food item to edit.</p>
      </div>
    </div>

    <div className="manager-food-list">
      {food.map((item) => (
        <div
          className="manager-food-card"
          key={item.id}
        >
          <div className="manager-food-info">
            <h3>{item.name}</h3>

            <p>
              {item.description || "No description"}
            </p>

            <strong>
              ₹{Number(item.price).toFixed(2)}
            </strong>
          </div>

          <div className="manager-food-status">
            <span>
              Stock: {item.stock_quantity}
            </span>

            <button
              onClick={() => setEditingFood(item)}
            >
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>

  </section>
)}



{editingFood && (




  <div className="manager-add-food-form">
    <h3>Edit Food</h3>


<label>Food Name</label>
    <input
      type="text"
      placeholder="Food name"
      value={editingFood.name}
      onChange={(e) =>
        setEditingFood({
          ...editingFood,
          name: e.target.value,
        })
      }
    />

    <label>Description</label>
    <input
      type="text"
      placeholder="Description"
      value={editingFood.description || ""}
      onChange={(e) =>
        setEditingFood({
          ...editingFood,
          description: e.target.value,
        })
      }
    />
<label>Price</label>
    <input
      type="number"
      placeholder="Price"
      value={editingFood.price}
      onChange={(e) =>
        setEditingFood({
          ...editingFood,
          price: e.target.value,
        })
      }
    />


    <label>Category</label>
<select
  value={editingFood.category || ""}
  onChange={(e) =>
    setEditingFood({
      ...editingFood,
      category: e.target.value,
    })
  }
>
  <option value="" disabled>
    Select Category
  </option>
  <option value="Tiffens">Tiffens</option>
  <option value="Rice Items">Rice Items</option>
  <option value="Snacks">Snacks</option>
  <option value="Beverages">Beverages</option>
</select>

    <label>Stock Quantity</label>
    <input
      type="number"
      placeholder="Stock quantity"
      value={editingFood.stock_quantity}
      onChange={(e) =>
        setEditingFood({
          ...editingFood,
          stock_quantity: e.target.value,
        })
      }
    />

    <label>Image URL</label>
    <input
      type="text"
      placeholder="Image URL"
      value={editingFood.image_url || ""}
      onChange={(e) =>
        setEditingFood({
          ...editingFood,
          image_url: e.target.value,
        })
      }
    />

<button
  onClick={async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/manager/food/${editingFood.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingFood),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update food"
        );
      }

      alert("Food item updated successfully");

      setEditingFood(null);
      await loadFood();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }}
>
  Save Changes
</button>


    <button
      onClick={() => setEditingFood(null)}
    >
      Cancel
    </button>
  </div>
)}


{managerSection === "delete" && (
  <section className="manager-section">

    <button onClick={() => setManagerSection("home")}>
      ← Back
    </button>

    <div className="manager-section-header">
      <div>
        <h2>Delete Food Item</h2>
        <p>Select a food item to permanently delete it.</p>
      </div>
    </div>

    <div className="manager-food-list">
      {food.map((item) => (
        <div
          className="manager-food-card"
          key={item.id}
        >
          <div className="manager-food-info">
            <h3>{item.name}</h3>

            <p>
              {item.description || "No description"}
            </p>

            <strong>
              ₹{Number(item.price).toFixed(2)}
            </strong>
          </div>

          <div className="manager-food-status">
            <span>
              Stock: {item.stock_quantity}
            </span>

            <button
              onClick={async () => {
                const confirmed = window.confirm(
                  `Are you sure you want to permanently delete "${item.name}"?`
                );

                if (!confirmed) return;

                try {
                  const response = await fetch(
                    `${API_BASE_URL}/api/manager/food/${item.id}`,
                    {
                      method: "DELETE",
                    }
                  );

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(
                      data.message || "Unable to delete food"
                    );
                  }

                  alert("Food item deleted successfully");

                  await loadFood();

                } catch (error) {
                  console.error(error);
                  alert(error.message);
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>

  </section>
)}


{managerSection === "sales" && (
  <section className="manager-section">

    <button onClick={() => setManagerSection("home")}>
      ← Back
    </button>

    <div className="manager-section-header">
      <div>
        <h2>Sales Dashboard</h2>
        <p>View completed order sales and performance.</p>
      </div>
    </div>

    {salesLoading && (
      <div className="manager-status">
        Loading sales data...
      </div>
    )}

    {salesError && (
      <div className="manager-status error">
        {salesError}
      </div>
    )}

    {!salesLoading && !salesError && salesData && (
      <>
        <div className="manager-sales-summary">

          <div className="manager-sales-card">
            <span>Monthly Revenue</span>
            <strong>
              ₹{Number(salesData.summary.total_sales).toFixed(2)}
            </strong>
          </div>

          <div className="manager-sales-card">
            <span>Today's Total Orders</span>
            <strong>
              {salesData.summary.total_orders}
            </strong>
          </div>

          <div className="manager-sales-card">
            <span>Today's Total Items Sold</span>
            <strong>
              {salesData.summary.total_items}
            </strong>
          </div>

<div className="manager-sales-card">
  <span>Today's Revenue</span>
  <strong>
    ₹{Number(salesData.summary.todays_revenue).toFixed(2)}
  </strong>
</div>

        </div>

        <div className="manager-sales-table">
          <h3>Today's Food Sales</h3>

          {salesData.foodSales.length === 0 ? (
            <p>No completed sales yet.</p>
          ) : (
            salesData.foodSales.map((item) => (
              <div
                key={item.name}
                className="manager-sales-row"
              >
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.quantity_sold} items sold
                  </span>
                </div>

                <strong>
                  ₹{Number(item.sales).toFixed(2)}
                </strong>
              </div>
            ))
          )}
        </div>
      </>
    )}

  </section>
)}

{managerSection === "demand" && (
  <section className="manager-section">

    <button onClick={() => setManagerSection("home")}>
      ← Back
    </button>

    <div className="manager-section-header">
      <div>
        <h2>Demand Analysis</h2>
        <p>Analyze food demand based on completed orders this month.</p>
      </div>
    </div>

    {demandLoading && (
      <div className="manager-status">
        Loading demand data...
      </div>
    )}

    {demandError && (
      <div className="manager-status error">
        {demandError}
      </div>
    )}

    {!demandLoading && !demandError && (
      <div className="manager-food-list">

        {demandData.length === 0 ? (
          <div className="manager-status">
            No demand data available.
          </div>
        ) : (
          demandData.map((item) => (
            <div
              className="manager-food-card"
              key={item.id}
            >
              <div className="manager-food-info">
                <h3>{item.name}</h3>

                <p>
                  Category: {item.category}
                </p>

                <strong>
                  {item.quantity_sold} items sold
                </strong>
              </div>

              <div className="manager-food-status">
                <span>
                  Demand: {item.demand_level}
                </span>
              </div>
            </div>
          ))
        )}

      </div>
    )}

  </section>
)}


{managerSection === "graphs" && (
  <section className="manager-section">

    <button onClick={() => setManagerSection("home")}>
      ← Back
    </button>

    <div className="manager-section-header">
      <div>
        <h2>Graphs</h2>
        <p>Monthly food sales performance.</p>
      </div>
    </div>

    {graphLoading && (
      <div className="manager-status">
        Loading graph data...
      </div>
    )}

    {graphError && (
      <div className="manager-status error">
        {graphError}
      </div>
    )}

    {!graphLoading && !graphError && graphData.length > 0 && (
      <div className="manager-graph">

        <h3>Food Items Sold This Month</h3>

        <div className="manager-bar-chart">
          {graphData.map((item) => {
            const maxValue = Math.max(
              ...graphData.map(
                (food) => Number(food.quantity_sold)
              ),
              1
            );

            const height =
              (Number(item.quantity_sold) / maxValue) * 100;

            return (
              <div
                key={item.id}
                className="manager-bar-item"
              >
                <div className="manager-bar-value">
                  {item.quantity_sold}
                </div>

                <div className="manager-bar-wrapper">
                  <div
                    className="manager-bar"
                    style={{
                      height: `${height}%`,
                    }}
                  ></div>
                </div>

                <span className="manager-bar-label">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    )}

    {!graphLoading &&
      !graphError &&
      graphData.length === 0 && (
        <div className="manager-status">
          No sales data available for this month.
        </div>
      )}

  </section>
)}

{managerSection === "alerts" && (
  <section className="manager-section">

    <button onClick={() => setManagerSection("home")}>
      ← Back
    </button>

    <div className="manager-section-header">
      <div>
        <h2>Stock Alerts</h2>
        <p>Monitor food items that need restocking.</p>
      </div>
    </div>

    {stockLoading && (
      <div className="manager-status">
        Checking stock levels...
      </div>
    )}

    {stockError && (
      <div className="manager-status error">
        {stockError}
      </div>
    )}

    {!stockLoading &&
      !stockError &&
      stockAlerts.length === 0 && (
        <div className="manager-status">
          ✓ All food items have sufficient stock.
        </div>
      )}

    {!stockLoading &&
      !stockError &&
      stockAlerts.length > 0 && (
        <div className="manager-food-list">

          {stockAlerts.map((item) => (
            <div
              className="manager-food-card"
              key={item.id}
            >

              <div className="manager-food-info">
                <h3>{item.name}</h3>

                <p>
                  Category: {item.category}
                </p>

                <strong>
                  Current Stock: {item.stock_quantity}
                </strong>
              </div>

              <div className="manager-food-status">

                <span
                  className={
                    item.alert_level === "Out of Stock"
                      ? "unavailable"
                      : "available"
                  }
                >
                  {item.alert_level}
                </span>

                <button
                  onClick={() => {
                    setEditingFood(item);
                    setManagerSection("edit");
                  }}
                >
                  Restock / Edit
                </button>

              </div>

            </div>
          ))}

        </div>
      )}

  </section>
)}


{managerSection === "view" && (
  <section className="manager-section">

    <button
  onClick={() => setManagerSection("home")}
>
  ← Back
</button>
          <div className="manager-section-header">
            <div>
              <h2>Food Items</h2>

              <p>
                View and manage today's food menu.
              </p>
            </div>

           
            




          </div>









          {loading && (
            <div className="manager-status">
              Loading food items...
            </div>
          )}

          {error && (
            <div className="manager-status error">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            food.length === 0 && (
              <div className="manager-status">
                No food items found.
              </div>
            )}

          {!loading &&
            !error &&
            food.length > 0 && (
              <div className="manager-food-list">

                {food.map((item) => (
                  <div
                    className="manager-food-card"
                    key={item.id}
                  >

                    <div className="manager-food-info">

                      <h3>{item.name}</h3>

                      <p>
                        {item.description ||
                          "No description"}
                      </p>

                      <strong>
                        ₹{Number(item.price).toFixed(2)}
                      </strong>

                    </div>

                    <div className="manager-food-status">

                      <span
                        className={
                          item.available
                            ? "available"
                            : "unavailable"
                        }
                      >
                        {item.available
                          ? "Available"
                          : "Not Available"}
                      </span>

                      <span>
                        Stock: {item.stock_quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateAvailability(item)
                        }
                      >
                        {item.available
                          ? "Make Unavailable"
                          : "Make Available"}
                      </button>
                     

                    </div>

                  </div>
                ))}

              </div>
            )}

        </section>
)}
      </main>

    </div>
  );
}

export default FoodManager;