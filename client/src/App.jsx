import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { load } from "@cashfreepayments/cashfree-js";
import "./App.css";
import Waiter from"./waiter";
import Auth from "./Auth";
import FoodManager from "./FoodManager";
const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("foodCourtUser");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [profileOpen, setProfileOpen] = useState(false);

  const [food, setFood] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [stockMessage, setStockMessage] = useState("");

  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [studentOrders, setStudentOrders] = useState([]);
  const [scannedOrders, setScannedOrders] = useState([]);

  const categories = [
    "All",
    "Tiffens",
    "Rice Items",
    "Snacks",
    "Beverages"
  ];

  
useEffect(() => {
  if (user) {
    loadFood();
    loadStudentOrders();

    const interval = setInterval(() => {
      loadStudentOrders();
    }, 5000);

    return () => clearInterval(interval);
  }
}, [user]);


  async function loadFood() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/food`
      );

      if (!response.ok) {
        throw new Error("Unable to load food");
      }

      const data = await response.json();

      setFood(data.food || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load today's menu.");
    } finally {
      setLoading(false);
    }
  }
async function loadStudentOrders() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/orders/student/${user.id}`
    );

    const data = await response.json();

    if (response.ok) {
      setStudentOrders(data.orders || []);

      setScannedOrders(
  (data.orders || [])
    .filter((order) => order.qr_scanned)
    .map((order) => order.id)
);
    }
  } catch (error) {
    console.error("Unable to load student orders:", error);
  }
}
  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setProfileOpen(false);
    setLoading(true);
    setError("");
  }

  function handleLogout() {
    localStorage.removeItem("foodCourtUser");

    setUser(null);
    setProfileOpen(false);
    setCart([]);
    setCartOpen(false);
    setBillOpen(false);
  }

  const filteredFood = useMemo(() => {
    if (activeCategory === "All") {
      return food;
    }

    return food.filter(
      (item) =>
        item.category?.toLowerCase() ===
        activeCategory.toLowerCase()
    );
  }, [food, activeCategory]);

  function getCartItem(id) {
    return cart.find((item) => item.id === id);
  }

  function addToCart(item) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existing) {
        return currentCart.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [
        ...currentCart,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  }

  function increaseQuantity(id) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  }

  function decreaseQuantity(id) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  function openBill() {
    if (cart.length === 0) {
      return;
    }

    setCartOpen(false);
    setOrderMessage("");
    setBillOpen(true);
  }

  function getFoodIcon(category) {
    const value = category?.toLowerCase();

    if (value === "tiffens") {
      return "🥞";
    }

    if (value === "rice items") {
      return "🍚";
    }

    if (value === "snacks") {
      return "🥟";
    }

    return "🍽️";
  }

  // Show login/signup when student is not logged in
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }
 if (user.role === "waiter") {
  return (
    <Waiter
      user={user}
      onLogout={handleLogout}
    />
  );
}
  if (user.role === "food_manager") {
  return (
    <FoodManager
      user={user}
      onLogout={handleLogout}
    />
  );
}

  return (
    <div className="app">

{stockMessage && (
  <div className="stock-popup">
    <button
      className="stock-popup-close"
      onClick={() => setStockMessage("")}
    >
      ×
    </button>

    <div className="stock-popup-title">
      Low Stock
    </div>

    <div className="stock-popup-message">
      {stockMessage}
    </div>
  </div>
)}


      {/* HEADER */}

      <header className="college-header">

        <div className="college-brand">

          <div className="college-logo">
            KU
          </div>

          <div>
            <h1>Kishkinda  University</h1>
          </div>

        </div>

        <div className="header-actions">

          {/* PROFILE */}

          <div className="profile-container">

            <button
              className="profile-button"
              onClick={() =>
                setProfileOpen(!profileOpen)
              }
            >
              <span className="profile-icon">
                {user.name
                  ? user.name
                      .charAt(0)
                      .toUpperCase()
                  : "S"}
              </span>

              <span className="profile-name">
                {user.name}
              </span>

              <span className="profile-arrow">
                {profileOpen ? "▲" : "▼"}
              </span>
            </button>

            {profileOpen && (

              <div className="profile-menu">

                <div className="profile-info">

                  <div className="profile-large-icon">
                    {user.name
                      ? user.name
                          .charAt(0)
                          .toUpperCase()
                      : "S"}
                  </div>

                  <div>
                    <strong>
                      {user.name}
                    </strong>

                    <span>
                      {user.email}
                    </span>
                  </div>

                </div>

                <div className="profile-divider"></div>

                <button
                  className="logout-button"
                  onClick={handleLogout}
                >
                  <span>↪</span>
                  Logout
                </button>

              </div>

            )}

          </div>

          {/* CART */}

          <button
            className="view-cart-button"
            onClick={() => setCartOpen(true)}
          >
            <span className="cart-icon">
              🛒
            </span>

            <span className="cart-text">
              Cart
            </span>

            {cartCount > 0 && (
              <span className="cart-count">
                {cartCount}
              </span>
            )}
          </button>

        </div>

      </header>

      <main>

        {/* WELCOME */}

        <section className="welcome">

          <div className="welcome-content">

            <p className="welcome-label">
              Food Court
            </p>

            <h2>
              Good food.
              <br />
              Good mood.
            </h2>

            <p className="welcome-description">
              Freshly prepared favourites, made
              for your day at the Food Court.
            </p>

          </div>

        </section>


        {/* READY ORDER QR */}
{studentOrders
.filter(
  (order) =>
    ["ready", "completed"].includes(order.status) &&
    !scannedOrders.includes(order.id)
)
.map((order) => (
    <section
      key={order.id}
      style={{
        margin: "25px",
        padding: "25px",
        background: "white",
        borderRadius: "16px",
        textAlign: "center",
      }}
    >
      <h2>🍽️ Your Food is Ready!</h2>

      <p>
        Order #{order.id}
      </p>

      <QRCodeSVG
        value={JSON.stringify({
          order_id: order.id,
        })}
        size={320}
      />

      <p style={{ color: "#777" }}>
        Show this QR code to the waiter when collecting your food.
      </p>
    </section>
  ))}





        {/* MENU */}

        <section className="menu-section">

          <div className="menu-heading">

            <div>
              <h2>Today's Menu</h2>

              <p>
                Choose your favourites from the available
                food items below.
              </p>
            </div>

            {cartCount > 0 && (
              <button
                className="heading-order-button"
                onClick={openBill}
              >
                Place Order
              </button>
            )}

          </div>

          {/* CATEGORIES */}

          <div className="category-tabs">

            {categories.map((category) => (

              <button
                key={category}
                className={
                  activeCategory === category
                    ? "category-tab active"
                    : "category-tab"
                }
                onClick={() =>
                  setActiveCategory(category)
                }
              >
                {category}
              </button>

            ))}

          </div>

          {/* LOADING */}

          {loading && (
            <div className="status-box">
              <div className="loading-spinner"></div>
              <p>Loading today's menu...</p>
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="status-box error">

              <p>{error}</p>

              <button
                onClick={() => {
                  setLoading(true);
                  setError("");
                  loadFood();
                }}
              >
                Try Again
              </button>

            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            filteredFood.length === 0 && (

              <div className="status-box">

                <div className="empty-food-icon">
                  🍽️
                </div>

                <h3>
                  No food available
                </h3>

                <p>
                  There are no items available
                  in this category right now.
                </p>

              </div>

            )}

          {/* FOOD */}

          {!loading &&
            !error &&
            filteredFood.length > 0 && (

              <div className="food-grid">

                {filteredFood.map((item) => {

                  const cartItem =
                    getCartItem(item.id);

                  const quantity =
                    cartItem?.quantity || 0;

                  return (



                    
                    <article
                      className="food-card"
                      key={item.id}
                    >

                      <div className="food-image-placeholder">

  {item.image_url ? (
    <img
      src={item.image_url}
      alt={item.name}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  ) : (
    <span>
      {getFoodIcon(item.category)}
    </span>
  )}

</div>
                      <div className="food-card-content">

                        <div className="food-card-top">

                          <span className="food-category">
                            {item.category}
                          </span>

                        </div>

                        <h3>
                          {item.name}
                        </h3>

                        <p className="food-description">
                          {item.description ||
                            "Freshly prepared at the Food Court."}
                        </p>

                        <div className="food-bottom">

                          <strong className="food-price">
                            ₹
                            {Number(
                              item.price
                            ).toFixed(2)}
                          </strong>

                          {!item.available ? (

  <button
    className="add-button"
    disabled
  >
    Not Available
  </button>

) : quantity === 0 ? (

  <button
    className="add-button"
   onClick={() => {
  if (Number(item.stock_quantity) <= 0) {
    setStockMessage(
      `${item.name} is currently out of stock. Please try another food item.`
    );
    return;
  }

  addToCart(item);
}}
  >
    Add
  </button>

) : (
                            <div className="quantity-control">

                              <button
                                onClick={() =>
                                  decreaseQuantity(
                                    item.id
                                  )
                                }
                              >
                                −
                              </button>

                              <span>
                                {quantity}
                              </span>

                              <button
  className="quantity-button"
  onClick={() => {
    if (quantity >= Number(item.stock_quantity)) {
      setStockMessage(
        `Sorry, only ${item.stock_quantity} ${item.name} available. You cannot order more than the available stock. Please try another food item.`
      );
      return;
    }

    increaseQuantity(item.id);
  }}
>
  +
</button>

                            </div>

                          )}

                        </div>

                      </div>

                    </article>

                  );

                })}

              </div>

            )}

        </section>

      </main>

      {/* BOTTOM CART BAR */}

      {cartCount > 0 && (

        <div className="bottom-cart">

          <div className="bottom-cart-info">

            <span className="bottom-cart-items">
              {cartCount}{" "}
              {cartCount === 1
                ? "item"
                : "items"}
            </span>

            <strong>
              ₹{cartTotal.toFixed(2)}
            </strong>

          </div>

          <div className="bottom-cart-actions">

            <button
              className="bottom-view-button"
              onClick={() =>
                setCartOpen(true)
              }
            >
              View Cart
            </button>

            <button
              className="bottom-place-button"
              onClick={openBill}
            >
              Place Order →
            </button>

          </div>

        </div>

      )}

      {/* CART MODAL */}

      {cartOpen && (

        <div
          className="modal-overlay"
          onClick={() =>
            setCartOpen(false)
          }
        >

          <div
            className="modal cart-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <span className="modal-label">
                  YOUR ORDER
                </span>

                <h2>
                  Cart
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setCartOpen(false)
                }
              >
                ×
              </button>

            </div>

            {cart.length === 0 ? (

              <div className="empty-cart">

                <div>
                  🛒
                </div>

                <h3>
                  Your cart is empty
                </h3>

                <p>
                  Add something from today's
                  menu to get started.
                </p>

              </div>

            ) : (

              <>

                <div className="cart-list">

                  {cart.map((item) => (

                    <div
                      className="cart-item"
                      key={item.id}
                    >

                      <div className="cart-item-icon">
                        {getFoodIcon(
                          item.category
                        )}
                      </div>

                      <div className="cart-item-details">

                        <h3>
                          {item.name}
                        </h3>

                        <p>
                          ₹
                          {Number(
                            item.price
                          ).toFixed(2)}
                          {" "}each
                        </p>

                        <button
                          className="remove-button"
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>

                      <div className="cart-quantity">

                        <button
                          onClick={() =>
                            decreaseQuantity(
                              item.id
                            )
                          }
                        >
                          −
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            increaseQuantity(
                              item.id
                            )
                          }
                        >
                          +
                        </button>

                      </div>

                      <strong className="cart-item-total">
                        ₹
                        {(
                          Number(item.price) *
                          item.quantity
                        ).toFixed(2)}
                      </strong>

                    </div>

                  ))}

                </div>

                <div className="cart-total">

                  <span>
                    Total
                  </span>

                  <strong>
                    ₹{cartTotal.toFixed(2)}
                  </strong>

                </div>

                <button
                  className="full-proceed-button"
                  onClick={openBill}
                >
                  Place Order →
                </button>

              </>

            )}

          </div>

        </div>

      )}

      {/* BILL MODAL */}

      {billOpen && (

        <div className="modal-overlay">

          <div className="modal bill-modal">

            <div className="modal-header">

              <div>

                <span className="modal-label">
                  ORDER SUMMARY
                </span>

                <h2>
                  Your Bill
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setBillOpen(false)
                }
              >
                ×
              </button>

            </div>

            <div className="bill-list">

              {cart.map((item) => (

                <div
                  className="bill-item"
                  key={item.id}
                >

                  <span>
                    {item.name}
                    {" × "}
                    {item.quantity}
                  </span>

                  <strong>
                    ₹
                    {(
                      Number(item.price) *
                      item.quantity
                    ).toFixed(2)}
                  </strong>

                </div>

              ))}

            </div>

            <div className="bill-total">

              <span>
                Total Amount
              </span>

              <strong>
                ₹{cartTotal.toFixed(2)}
              </strong>

            </div>
            <button
  className="full-proceed-button"
  disabled={orderLoading}
  onClick={async () => {
    if (cart.length === 0) {
      return;
    }
let createdOrderId = null;
let cashfreeOrderId = null;
    try {
      setOrderLoading(true);
      setOrderMessage("");

      // STEP 1: Create order
      const orderResponse = await fetch(
        `${API_BASE_URL}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            items: cart.map((item) => ({
              food_item_id: item.id,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message || "Unable to create order"
        );
      }
createdOrderId = orderData.order_id;


     // STEP 2: Create Cashfree payment order
const cashfreeResponse = await fetch(
  `${API_BASE_URL}/api/cashfree/create-order`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: orderData.order_id,
    }),
  }
);

const cashfreeData = await cashfreeResponse.json();

if (!cashfreeResponse.ok) {
  throw new Error(
    cashfreeData.message || "Unable to start Cashfree payment"
  );
}
cashfreeOrderId = cashfreeData.cashfree_order_id;

// STEP 3: Open Cashfree checkout
const cashfree = await load({
  mode: "sandbox",
});

const checkoutResult = await cashfree.checkout({
  paymentSessionId: cashfreeData.payment_session_id,
  redirectTarget: "_modal",
});

if (checkoutResult?.error) {
  throw new Error(
    checkoutResult.error.message || "Cashfree payment failed"
  );
}


// STEP 4: Verify payment
const verifyResponse = await fetch(
  `${API_BASE_URL}/api/cashfree/verify-payment`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: orderData.order_id,
      cashfree_order_id: cashfreeData.cashfree_order_id,
    }),
  }
);

const verifyData = await verifyResponse.json();

if (!verifyResponse.ok) {
  throw new Error(
    verifyData.message || "Payment was not completed"
  );
}


      // STEP 5: Success
      setOrderMessage(
        `Payment successful! Order #${orderData.order_id} has been sent to the waiter.`
      );

      setCart([]);
setBillOpen(false);
      await loadFood();

   } catch (error) {
  console.error("Order/payment error:", error);

  if (createdOrderId) {
    try {
      await fetch(
        `${API_BASE_URL}/api/cashfree/cancel-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: createdOrderId,
            cashfree_order_id: cashfreeOrderId,
          }),
        }
      );
    } catch (cancelError) {
      console.error(
        "Unable to cancel payment order:",
        cancelError
      );
    }
  }

  setOrderMessage(
    error.message || "Unable to complete order"
  );

} finally {
      setOrderLoading(false);
    }
  }}
>
  {orderLoading
    ? "Processing..."
    : "Pay & Place Order →"}
</button>


            {orderMessage ?(
            <p className="payment-note">
              {orderMessage}
              </p>
            ):null
           
            }

          </div>

        </div>

      )}

    </div>
  );
}

export default App;