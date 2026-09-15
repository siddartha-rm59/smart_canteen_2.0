import { useEffect, useRef, useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_URL;

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";

function Waiter({ user, onLogout }) {
    console.log("NEW WAITER FILE LOADED");
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [totalItemsOpen, setTotalItemsOpen] = useState(false);
  const totalItems = {};
  const [searchTerm, setSearchTerm] = useState("");
  const [qrOrder, setQrOrder] = useState(null);
const scannerRef = useRef(null);

  const newOrderCount = orders.filter(
  (order) => order.status === "paid"
).length;

orders.forEach((order) => {
  order.items?.forEach((item) => {
    if (totalItems[item.name]) {
      totalItems[item.name] += Number(item.quantity);
    } else {
      totalItems[item.name] = Number(item.quantity);
    }
  });
});
const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/waiter/orders`
      );

      const data = await response.json();

      console.log("WAITER API RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load orders"
        );
      }

      setOrders(data.orders || []);
    } catch (err) {
      console.error("Waiter error:", err);
      setError(err.message || "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }
async function loadHistory() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/waiter/order-history`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load order history"
      );
    }

    setHistory(data.orders || []);
  } catch (err) {
    console.error("History error:", err);
  }
}
useEffect(() => {
  loadOrders();
  loadHistory();

  const interval = setInterval(() => {
    loadOrders();
  }, 5000);

  return () => clearInterval(interval);
}, []);
  async function updateStatus(orderId, status) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/waiter/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update order"
        );
      }

      await loadOrders();
      if (status === "completed") {
        await loadHistory();
      }
    } catch (err) {
      alert(err.message);
    }
  }
 

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "auto",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "16px",
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
         <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  }}
>
  <div>
    <h2 style={{ margin: 0,
  color: "#2563eb",
     }}>
      Kishkinda University
    </h2>

    <p
      style={{
        position:"absolute",
        left:"50%",
        top:"30px",
        transform:"translateX(-50%)",
        margin:0,
        color: "#08060f",
        fontSize: "50px",
        fontWeight: "600",
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      Food Court
    </p>
  </div>

 
</div>
     
        <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
  }}
>
    <button
      style={{
        width: "45px",
        position:"relative",
        height: "45px",
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "10px",
        fontSize: "20px",
        cursor: "pointer",
      }}
    >
      <span
  style={{
    position: "absolute",
    top: "-5px",
    right: "-5px",
    background: "red",
    color: "white",
    borderRadius: "50%",
    minWidth: "20px",
    height: "20px",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  }}
>
  {newOrderCount}
</span>
      🔔
    </button>
    

          <button
            onClick={onLogout}
            style={{
              padding: "10px 18px",
              background: "#222",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
        </div>

        {/* ORDERS */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "16px",
          }}
        >

     <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",

    position: "sticky",
    top: "90px",
    zIndex: 999,
    background: "white",
    paddingTop: "10px",
    paddingBottom: "10px",
  }}
>
            <div>
              
              <div
  style={{
   
    display: "flex",
    justifyContent: "center",
    padding: "15px 0",
    background: "white",
  }}
>
  <input
    type="text"
    placeholder="Search your orders..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    style={{
      width: "420px",
      padding: "14px 18px",
      border: "1px solid #ccc",
      borderRadius: "10px",
      fontSize: "16px",
      outline: "none",
      background: "white",
    }}
  />
</div>
              
 
              <div
  style={{
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  }}
>
  <button
    onClick={() => {
      setTotalItemsOpen(false);
      setHistoryOpen(false);
    }}
    style={{
      padding: "10px 20px",
      background:
        !totalItemsOpen && !historyOpen
          ? "#222"
          : "white",
      color:
        !totalItemsOpen && !historyOpen
          ? "white"
          : "#222",
      border: "1px solid #ddd",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    Orders
  </button>

  <button
    onClick={() => {
      setTotalItemsOpen(true);
      setHistoryOpen(false);
    }}
    style={{
      padding: "10px 20px",
      background: totalItemsOpen
        ? "#222"
        : "white",
      color: totalItemsOpen
        ? "white"
        : "#222",
      border: "1px solid #ddd",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    Total Items
  </button>

  <button
    onClick={() => {
      setTotalItemsOpen(false);
      setHistoryOpen(true);
      loadHistory();
    }}
    style={{
      padding: "10px 20px",
      background: historyOpen
        ? "#222"
        : "white",
      color: historyOpen
        ? "white"
        : "#222",
      border: "1px solid #ddd",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    Order History
  </button>
</div>
 

 

 
   
             
            </div>

            <button
              onClick={loadOrders}
              style={{
                padding: "10px 16px",
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>
          

{totalItemsOpen ? (
            <div
              style={{
                marginTop: "25px",
                display: "grid",
                gap: "12px",
              }}
            >
              <h1 style={{ margin: 0 }}>Total Items</h1>

              <p style={{ color: "#777" }}>
                Total food quantity from the current orders
              </p>

              {Object.keys(totalItems).length === 0 ? (
                <p style={{ color: "#777" }}>
                  No items available.
                </p>
              ) : (
                Object.entries(totalItems).map(([name, quantity]) => (
                  <div
                    key={name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "18px",
                      background: "#f7f7f7",
                      borderRadius: "10px",
                      border: "1px solid #eee",
                    }}
                  >
                    <strong>{name}</strong>
                    <strong>{quantity}</strong>
                  </div>
                ))
              )}
            </div>
          ) : historyOpen ? (
            <div
              style={{
                marginTop: "25px",
                display: "grid",
                gap: "15px",
              }}
            >
              <h1 style={{ margin: 0 }}>Order History</h1>

              <p style={{ color: "#777" }}>
                Completed orders from the last 7 days
              </p>

              {history.length === 0 ? (
                <p style={{ color: "#777" }}>
                  No completed orders in the last 7 days.
                </p>
              ) : (
                history.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      padding: "20px",
                      background: "#f7f7f7",
                      border: "1px solid #ddd",
                      borderRadius: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0 }}>
                          Order #{order.id}
                        </h3>

                        <p style={{ margin: "8px 0" }}>
                          Student:{" "}
                          <strong>{order.student_name}</strong>
                        </p>

                        <p
                          style={{
                            margin: 0,
                            color: "#777",
                          }}
                        >
                          {new Date(
                            order.created_at
                          ).toLocaleString()}
                        </p>
                      </div>

                      <strong>
                        ₹{Number(order.total_amount).toFixed(2)}
                      </strong>
                    </div>

                    <div style={{ marginTop: "15px" }}>
                      {order.items?.map((item, index) => (
                        <p
                          key={index}
                          style={{ margin: "6px 0" }}
                        >
                          {item.name} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {loading && <p>Loading orders...</p>}
          {error && (
            <div
              style={{
                padding: "15px",
                background: "#ffe5e5",
                color: "#b00020",
                borderRadius: "8px",
              }}
            >
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            orders.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px",
                  color: "#777",
                }}
              >
                <div style={{ fontSize: "45px" }}>
                  🍽️
                </div>

                <h3>No orders</h3>

                <p>
                  New orders will appear here.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            orders.length > 0 && (

              <div
                style={{
                  display: "grid",
                  gap: "20px",
                }}
              >

                {orders
  .filter((order) => {
    const search = searchTerm.toLowerCase();

    return (
      String(order.id).includes(search) ||
      order.student_name?.toLowerCase().includes(search) ||
      order.student_email?.toLowerCase().includes(search) ||
      order.items?.some((item) =>
        item.name?.toLowerCase().includes(search)
      )
    );
  })
  .map((order) => (

                  <div
                    key={order.id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "14px",
                      padding: "20px",
                      background: "white",
                    }}
                  >

                    {/* ORDER HEADER */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >

                      <div>

                        <h2 style={{ margin: 0 }}>
                          Order #{order.id}
                        </h2>

                        <p style={{ margin: "8px 0" }}>
                          Student:{" "}
                          <strong>
                            {order.student_name}
                          </strong>
                        </p>

                        <p
                          style={{
                            margin: 0,
                            color: "#777",
                          }}
                        >
                          {order.student_email}
                        </p>
                        <p
  style={{
    margin: "5px 0 0",
    color: "#999",
    fontSize: "13px",
  }}
>
  Ordered:{" "}
  {new Date(order.created_at).toLocaleString()}
</p>

                      </div>

                      <div
                        style={{
                          textAlign: "right",
                        }}
                      >

                        <h3 style={{ margin: 0 }}>
                          ₹
                          {Number(
                            order.total_amount
                          ).toFixed(2)}
                        </h3>

                        <p
  style={{
    margin: "8px 0 0",
    fontWeight: "bold",
    color:
      order.status === "paid"
        ? "#d97706"
        : "#16803c",
  }}
>
  {order.status === "paid"
    ? "NEW ORDER"
    : "PREPARING"}
</p>

                      </div>

                    </div>

                    {/* ========================= */}
                    {/* FOOD ITEMS - IMPORTANT     */}
                    {/* ========================= */}

                    <div
                      style={{
                        marginTop: "20px",
                        border: "2px solid #222",
                        borderRadius: "12px",
                        padding: "18px",
                        background: "#fafafa",
                      }}
                    >

                      <h3
                        style={{
                          margin: "0 0 15px",
                        }}
                      >
                        🍽️ ORDERED FOOD
                      </h3>

                      <p
                        style={{
                          margin: "0 0 15px",
                          color: "#666",
                          fontSize: "14px",
                        }}
                      >
                        Number of food items:{" "}
                        {Array.isArray(order.items)
                          ? order.items.length
                          : 0}
                      </p>

                      {Array.isArray(order.items) &&
                      order.items.length > 0 ? (

                        <div>

                          {order.items.map(
                            (item, index) => (

                              <div
                                key={
                                  item.food_item_id ||
                                  index
                                }
                                style={{
                                  display: "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems: "center",
                                  padding: "15px 10px",
                                  borderBottom:
                                    index <
                                    order.items.length - 1
                                      ? "1px solid #ddd"
                                      : "none",
                                }}
                              >

                                <div>

                                  <div
                                    style={{
                                      fontSize: "19px",
                                      fontWeight: "700",
                                    }}
                                  >
                                    {item.name}
                                  </div>

                                  <div
                                    style={{
                                      marginTop: "5px",
                                      color: "#555",
                                    }}
                                  >
                                    Quantity:{" "}
                                    <strong>
                                      {item.quantity}
                                    </strong>
                                  </div>

                                </div>

                                <div
                                  style={{
                                    textAlign: "right",
                                  }}
                                >

                                  <div
                                    style={{
                                      color: "#555",
                                    }}
                                  >
                                    ₹
                                    {Number(
                                      item.price
                                    ).toFixed(2)}{" "}
                                    ×{" "}
                                    {item.quantity}
                                  </div>

                                  <strong
                                    style={{
                                      fontSize: "18px",
                                    }}
                                  >
                                    ₹
                                    {(
                                      Number(
                                        item.price
                                      ) *
                                      Number(
                                        item.quantity
                                      )
                                    ).toFixed(2)}
                                  </strong>

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      ) : (

                        <div
                          style={{
                            padding: "20px",
                            background: "#ffe5e5",
                            color: "#b00020",
                            borderRadius: "8px",
                          }}
                        >
                          ❌ React received no food items
                          for this order.
                        </div>

                      )}

                    </div>

                    {/* STATUS BUTTON */}

                    <div
                      style={{
                        marginTop: "20px",
                      }}
                    >

                      {order.status === "paid" && (

                        <button
                          onClick={() =>
                            updateStatus(
                              order.id,
                              "preparing"
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "13px",
                            background: "#222",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Start Preparing
                        </button>

                      )}

                      {order.status === "preparing" && (

                        <button
                         onClick={async () => {
  await updateStatus(order.id, "ready");
}}
                          style={{
                            width: "100%",
                            padding: "13px",
                            background: "#16803c",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Food Ready
                        </button>

                      )}

                     {order.status === "ready" && (
  <button
    onClick={() =>
      updateStatus(order.id, "completed")
    }
    style={{
      width: "100%",
      padding: "13px",
      background: "#16803c",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    ✓ Complete Order
  </button>
)}

                    </div>

                  </div>

                ))}

              </div>

            )}
</>
          )}

<div
  id="qr-reader-overlay"
  style={{
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.7)",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <div
    style={{
      width: "350px",
      maxWidth: "90vw",
      background: "white",
      padding: "20px",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    }}
  >
    <div
      id="qr-reader"
      style={{
        width: "100%",
      }}
    />

    <button
      onClick={async () => {
        try {
          if (scannerRef.current) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
            scannerRef.current = null;
          }
        } catch (error) {
          console.error("Scanner close error:", error);
        }

        document.getElementById("qr-reader-overlay").style.display = "none";
      }}
      style={{
        marginTop: "10px",
        width: "100%",
        padding: "10px",
        border: "none",
        borderRadius: "8px",
        background: "#222",
        color: "white",
        cursor: "pointer",
      }}
    >
      Close Scanner
    </button>
  </div>
</div>



{qrOrder && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 4000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: "400px",
        maxWidth: "90%",
        background: "white",
        borderRadius: "18px",
        padding: "25px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <h2>Verify Order</h2>

      <p>
        <strong>Student:</strong> {qrOrder.student_name}
      </p>

      <p>
        <strong>Email:</strong> {qrOrder.student_email}
      </p>

      <hr />

      <h3>Ordered Items</h3>

      {qrOrder.items?.map((item) => (
        <div
          key={item.food_item_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <span>
            {item.name} × {item.quantity}
          </span>

          <span>₹{Number(item.price) * item.quantity}</span>
        </div>
      ))}

      <hr />

      <h3>Total: ₹{qrOrder.total_amount}</h3>

      <button
  onClick={async () => {
    await updateStatus(qrOrder.id, "completed");
    setQrOrder(null);
  }}
  style={{
    width: "100%",
    padding: "12px",
    marginTop: "15px",
    border: "none",
    borderRadius: "8px",
    background: "#16a34a",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  ✓ Confirm & Complete Order
</button>

      <button
        onClick={() => setQrOrder(null)}
        style={{
          width: "100%",
          marginTop: "15px",
          padding: "12px",
          border: "none",
          borderRadius: "10px",
          background: "#5b16d9",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  </div>
)}


          {/* FIXED SCANNER BAR */}
<div
  style={{
    position: "fixed",
    bottom: "15px",
    left: "225px",
    right: "225px",
    height: "75px",
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "20px",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
  }}
>
  <button
  onClick={async () => {
document.getElementById("qr-reader-overlay").style.display = "flex";
  const scanner = new Html5Qrcode("qr-reader");
scannerRef.current = scanner;

try {
  const cameras = await Html5Qrcode.getCameras();

  if (!cameras || cameras.length === 0) {
    throw new Error("No camera found");
  }

  console.log("AVAILABLE CAMERAS:", cameras);

  const cameraId = cameras[0].id;

  await scanner.start(
    cameraId,
    {
      fps: 10,
      qrbox: 300,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
    },
       

async (decodedText) => {
  console.log("QR DETECTED:", decodedText);

  try {
    const qrData = JSON.parse(decodedText);

    console.log("QR DATA:", qrData);

    const response = await fetch(
      `${API_BASE_URL}/api/qr/scan`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(qrData),
      }
    );

    const data = await response.json();

    console.log("QR API RESPONSE:", data);

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to scan QR code"
      );
    }

    await scanner.stop();

    scannerRef.current = null;

    document.getElementById("qr-reader-overlay").style.display = "none";

    setQrOrder(data.order);

  } catch (error) {
    console.error("QR scan error:", error);
    alert(error.message);
  }
},

(errorMessage) => {
  console.log("QR SCAN TRY:", errorMessage);
}        

);
    } catch (error) {
      console.error("Scanner error:", error);
      alert("Unable to open camera. Please allow camera permission.");
    }
  }}
  style={{
    width: "80px",
    height: "80px",
    background: "#5b16d9",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontSize: "40px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  ▦
</button>
</div>



        </div>
      </div>
    </div>
  );
}

export default Waiter;