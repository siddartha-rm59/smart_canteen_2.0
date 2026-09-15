require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const axios = require("axios");


const pool = require("./db");
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_VERSION = "2025-01-01";
const CASHFREE_API_URL = "https://sandbox.cashfree.com/pg";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Smart Canteen 2.0 backend is running!"
  });
});

// Test MySQL connection
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS connected");

    res.json({
      message: "MySQL connection successful!",
      result: rows
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      message: "MySQL connection failed",
      error: error.message
    });
  }
});


app.post("/api/manager/food", async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock_quantity,
      image_url,
    } = req.body;

    if (!name || !price || !category || stock_quantity === "") {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const available = Number(stock_quantity) > 0;

    await pool.query(
      `
      INSERT INTO food_items
      (name, description, price, category, available, stock_quantity, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        description || "",
        Number(price),
        category,
        available,
        Number(stock_quantity),
        image_url || null,
      ]
    );

    res.json({
      success: true,
      message: "Food item added successfully",
    });

  } catch (error) {
    console.error("Add food error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to add food item",
    });
  }
});

// Get available food
app.get("/api/food", async (req, res) => {
  try {
   const [rows] = await pool.query(`
  SELECT
    id,
    name,
    description,
    price,
    image_url,
    category,
    CASE
      WHEN stock_quantity > 0 THEN TRUE
      ELSE FALSE
    END AS available,
    stock_quantity
  FROM food_items
  
  ORDER BY category, name
`);

    res.json({
      success: true,
      food: rows
    });
  } catch (error) {
    console.error("Food query error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve food items",
      error: error.message
    });
  }
});

// Student signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users
       (name, phone, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'student')`,
      [name.trim(), phone.trim(), normalizedEmail, passwordHash]
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
        role: "student"
      }
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create account"
    });
  }
});

// Student login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await pool.query(
      `SELECT id, name, email, phone, password_hash, role
       FROM users
       WHERE email = ?`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to login"
    });
  }
});

// Create order
app.post("/api/orders", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_id, items } = req.body;

    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User ID and order items are required"
      });
    }

    await connection.beginTransaction();

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const [foodRows] = await connection.query(
        `SELECT id, name, price, stock_quantity
         FROM food_items
         WHERE id = ? AND available = TRUE
         FOR UPDATE`,
        [item.food_item_id]
      );

      if (foodRows.length === 0) {
        throw new Error(`Food item ${item.food_item_id} is unavailable`);
      }

      const food = foodRows[0];
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      if (food.stock_quantity < quantity) {
        throw new Error(`${food.name} does not have enough stock`);
      }

      totalAmount += Number(food.price) * quantity;

      orderItems.push({
        food_item_id: food.id,
        quantity,
        price: food.price
      });
    }

    const [orderResult] = await connection.query(
      `INSERT INTO orders
       (user_id, total_amount, status)
       VALUES (?, ?, 'pending')`,
      [user_id, totalAmount]
    );

    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await connection.query(
        `INSERT INTO order_items
         (order_id, food_item_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [
          orderId,
          item.food_item_id,
          item.quantity,
          item.price
        ]
      );

      await connection.query(
        `UPDATE food_items
         SET stock_quantity = stock_quantity - ?
         WHERE id = ?`,
        [item.quantity, item.food_item_id]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order_id: orderId,
      total_amount: totalAmount
    });
  } catch (error) {
    await connection.rollback();

    console.error("Order creation error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create order",
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Get orders for a student
app.get("/api/orders/student/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const [orders] = await pool.query(
      `
      SELECT
  o.id,
  o.user_id,
  o.total_amount,
  o.status,
  o.created_at,
 CASE
  WHEN q.status = 'scanned' THEN TRUE
  ELSE FALSE
END AS qr_scanned
FROM orders o
LEFT JOIN qr_codes q
  ON o.id = q.order_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      `,
      [userId]
    );

    for (const order of orders) {
      const [items] = await pool.query(
        `
        SELECT
          oi.food_item_id,
          f.name,
          oi.quantity,
          oi.price
        FROM order_items oi
        JOIN food_items f
          ON oi.food_item_id = f.id
        WHERE oi.order_id = ?
        `,
        [order.id]
      );

      order.items = items;
    }

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error("Student orders error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve student orders"
    });
  }
});

// Get orders with food items for waiter
app.get("/api/waiter/orders", async (req, res) => {
  try {
    // Get orders
    const [orders] = await pool.query(`
      SELECT
        o.id,
        o.user_id,
        u.name AS student_name,
        u.email AS student_email,
        o.total_amount,
        o.status,
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status IN ('paid', 'preparing','ready')
     ORDER BY
  CASE
    
      WHEN NOT EXISTS (
        SELECT 1
        FROM order_items oi
        JOIN food_items fi
          ON oi.food_item_id = fi.id
        WHERE oi.order_id = o.id
          AND fi.category <> 'Beverages'
      )
    THEN 0
    ELSE 1
  END,
  o.created_at ASC
    `);

    // Get food items for each order
    for (const order of orders) {
      const [items] = await pool.query(
        `
        SELECT
          oi.food_item_id,
          fi.name,
          oi.quantity,
          oi.price
        FROM order_items oi
        JOIN food_items fi
          ON oi.food_item_id = fi.id
        WHERE oi.order_id = ?
        `,
        [order.id]
      );

      order.items = items;
    }

    res.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error("Waiter orders error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve waiter orders",
      error: error.message
    });
  }
});
// Get completed orders for waiter - Order History
app.get("/api/waiter/order-history", async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT
        o.id,
        o.user_id,
        u.name AS student_name,
        u.email AS student_email,
        o.total_amount,
        o.status,
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status = 'completed'
      ORDER BY o.created_at DESC
    `);

    for (const order of orders) {
      const [items] = await pool.query(
        `
        SELECT
          oi.food_item_id,
          f.name,
          oi.quantity,
          oi.price
        FROM order_items oi
        JOIN food_items f
          ON oi.food_item_id = f.id
        WHERE oi.order_id = ?
        `,
        [order.id]
      );

      order.items = items;
    }

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error(
      "Order history error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to retrieve order history"
    });
  }
});
// Update order status by waiter
app.put("/api/waiter/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["preparing", "ready","completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const [orders] = await pool.query(
      `SELECT id, status
       FROM orders
       WHERE id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const currentStatus = orders[0].status;

    // paid → preparing
    if (status === "preparing" && currentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Only paid orders can be marked as preparing"
      });
    }

    // preparing → ready
    if (status === "ready" && currentStatus !== "preparing") {
      return res.status(400).json({
        success: false,
        message: "Only preparing orders can be marked as ready"
      });
    }
    // ready → completed
if (status === "completed" && currentStatus !== "ready") {
  return res.status(400).json({
    success: false,
    message: "Only ready orders can be completed"
  });
}

    await pool.query(
      `UPDATE orders
       SET status = ?
       WHERE id = ?`,
      [status, orderId]
    );

    if (status === "ready") {
  const token =
    "QR-" +
    orderId +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substring(2, 10);

  await pool.query(
    `
    INSERT INTO qr_codes
    (order_id, token, expires_at, status)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'active')
    `,
    [orderId, token]
  );
}

    res.json({
      success: true,
      message: `Order #${orderId} marked as ${status}`,
      order_id: Number(orderId),
      status
    });

  } catch (error) {
    console.error("Waiter status update error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update order status"
    });
  }
});

// Create Cashfree payment order
app.post("/api/cashfree/create-order", async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const [orders] = await pool.query(
      `
      SELECT
        o.id,
        o.total_amount,
        o.status,
        u.name,
        u.email,
        u.phone
      FROM orders o
      JOIN users u
        ON o.user_id = u.id
      WHERE o.id = ?
      `,
      [order_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = orders[0];

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Order is not available for payment"
      });
    }

    if (!order.phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required for payment"
      });
    }

    const cashfreeOrderId = `ORDER_${order.id}_${Date.now()}`;

    const response = await axios.post(
      `${CASHFREE_API_URL}/orders`,
      {
        order_id: cashfreeOrderId,
        order_amount: Number(order.total_amount),
        order_currency: "INR",
        customer_details: {
          customer_id: String(order.id),
          customer_name: order.name,
          customer_email: order.email,
          customer_phone: order.phone
        },
        order_meta: {
          return_url: `http://localhost:3000/payment-success?order_id=${order.id}`
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
          "x-api-version": CASHFREE_API_VERSION
        }
      }
    );

    res.json({
      success: true,
      order_id: order.id,
      cashfree_order_id: cashfreeOrderId,
      payment_session_id: response.data.payment_session_id
    });

  } catch (error) {
    console.error(
      "Cashfree create order error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to create Cashfree payment order"
    });
  }
});


// Verify Cashfree payment
app.post("/api/cashfree/verify-payment", async (req, res) => {
  try {
    const { order_id, cashfree_order_id } = req.body;

    if (!order_id || !cashfree_order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID and Cashfree order ID are required"
      });
    }

    const response = await axios.get(
      `${CASHFREE_API_URL}/orders/${cashfree_order_id}`,
      {
        headers: {
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
          "x-api-version": CASHFREE_API_VERSION
        }
      }
    );

    const cashfreeOrder = response.data;

    if (cashfreeOrder.order_status !== "PAID") {
      return res.status(400).json({
        success: false,
        message: "Payment was not completed",
        payment_status: cashfreeOrder.order_status
      });
    }

    await pool.query(
      `
      UPDATE orders
      SET status = 'paid'
      WHERE id = ?
      `,
      [order_id]
    );


    await pool.query(
  `
  INSERT INTO payments
  (order_id, payment_method, transaction_id, amount, status, paid_at)
  VALUES (?, ?, ?, ?, ?, NOW())
  `,
  [
    order_id,
    "Cashfree",
    cashfree_order_id,
    cashfreeOrder.order_amount,
    "success"
  ]
);

    res.json({
      success: true,
      message: "Payment verified successfully"
    });

  } catch (error) {
    console.error(
      "Cashfree payment verification error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to verify Cashfree payment"
    });
  }
});


// Cancel Cashfree payment order and restore stock
app.post("/api/cashfree/cancel-payment", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { order_id,cashfree_order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    if (!cashfree_order_id) {
      return res.status(400).json({
        success: false,
        message: "Cashfree order ID is required"
      });
    }

const cashfreeResponse = await axios.get(
  `${CASHFREE_API_URL}/orders/${cashfree_order_id}`,
  {
    headers: {
      "x-client-id": CASHFREE_APP_ID,
      "x-client-secret": CASHFREE_SECRET_KEY,
      "x-api-version": CASHFREE_API_VERSION
    }
  }
);

const cashfreeOrder = cashfreeResponse.data;

if (cashfreeOrder.order_status === "PAID") {
  return res.status(400).json({
    success: false,
    message: "Payment was already completed. Order cannot be cancelled."
  });
}


    await connection.beginTransaction();

    const [orders] = await connection.query(
      `
      SELECT id, status
      FROM orders
      WHERE id = ?
      FOR UPDATE
      `,
      [order_id]
    );

    if (orders.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = orders[0];

    // Never cancel an already paid order
    if (order.status !== "pending") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled"
      });
    }

    const [items] = await connection.query(
      `
      SELECT food_item_id, quantity
      FROM order_items
      WHERE order_id = ?
      `,
      [order_id]
    );

    for (const item of items) {
      await connection.query(
        `
        UPDATE food_items
        SET stock_quantity = stock_quantity + ?
        WHERE id = ?
        `,
        [item.quantity, item.food_item_id]
      );
    }

    await connection.query(
      `
      UPDATE orders
      SET status = 'cancelled'
      WHERE id = ?
      `,
      [order_id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Payment cancelled and stock restored"
    });

  } catch (error) {
    await connection.rollback();

    console.error("Cancel payment error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to cancel payment"
    });
  } finally {
    connection.release();
  }
});


// Process payment
app.post("/api/payments", async (req, res) => {
  try {
    const {
      order_id,
      payment_method,
      transaction_id
    } = req.body;

    if (!order_id || !payment_method) {
      return res.status(400).json({
        success: false,
        message: "Order ID and payment method are required"
      });
    }

    const [orders] = await pool.query(
      `SELECT id, total_amount, status
       FROM orders
       WHERE id = ?`,
      [order_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = orders[0];

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Order is not available for payment"
      });
    }

    await pool.query(
      `INSERT INTO payments
       (order_id, amount, payment_method, transaction_id, status, paid_at)
       VALUES (?, ?, ?, ?, 'success', NOW())`,
      [
        order.id,
        order.total_amount,
        payment_method,
        transaction_id || null
      ]
    );

    await pool.query(
      `UPDATE orders
       SET status = 'paid'
       WHERE id = ?`,
      [order.id]
    );

    res.json({
      success: true,
      message: "Payment successful",
      order_id: order.id,
      amount: order.total_amount,
      status: "paid"
    });

  } catch (error) {
    console.error("Payment error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to process payment",
      error: error.message
    });
  }
});


// Scan student QR code
app.post("/api/qr/scan", async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const [qrRows] = await pool.query(
      `
      SELECT
        id,
        order_id,
        token,
        expires_at,
        status,
        scanned_at
      FROM qr_codes
      WHERE order_id = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [order_id]
    );

    if (qrRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "QR code not found"
      });
    }

    const qr = qrRows[0];

    if (qr.status === "scanned") {
      return res.status(400).json({
        success: false,
        message: "QR code has already been scanned"
      });
    }

    if (qr.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "QR code is not active"
      });
    }

    if (qr.expires_at && new Date(qr.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "QR code has expired"
      });
    }

    const [orders] = await pool.query(
      `
      SELECT
        o.id,
        o.user_id,
        u.name AS student_name,
        u.email AS student_email,
        o.total_amount,
        o.status,
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
      `,
      [order_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = orders[0];

    if (order.status !== "ready") {
      return res.status(400).json({
        success: false,
        message: "This order is not ready for collection"
      });
    }

    const [items] = await pool.query(
      `
      SELECT
        oi.food_item_id,
        f.name,
        oi.quantity,
        oi.price
      FROM order_items oi
      JOIN food_items f
        ON oi.food_item_id = f.id
      WHERE oi.order_id = ?
      `,
      [order_id]
    );

    order.items = items;

    await pool.query(
      `
      UPDATE qr_codes
      SET status = 'scanned',
          scanned_at = NOW()
      WHERE id = ?
      `,
      [qr.id]
    );

    res.json({
      success: true,
      message: "QR scanned successfully",
      order
    });

  } catch (error) {
    console.error("QR scan error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to scan QR code"
    });
  }
});


app.put("/api/manager/food/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category,
      stock_quantity,
      image_url,
    } = req.body;

    const available = Number(stock_quantity) > 0;

    await pool.query(
      `
      UPDATE food_items
      SET
        name = ?,
        description = ?,
        price = ?,
        category = ?,
        stock_quantity = ?,
        available = ?,
        image_url = ?
      WHERE id = ?
      `,
      [
        name,
        description || "",
        Number(price),
        category,
        Number(stock_quantity),
        available,
        image_url || null,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Food item updated successfully",
    });

  } catch (error) {
    console.error("Edit food error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update food item",
    });
  }
});


// Food manager - update food availability
app.put("/api/manager/food/:foodId/availability", async (req, res) => {
  try {
    const { foodId } = req.params;
    const { available } = req.body;

    if (typeof available !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Availability must be true or false"
      });
    }

    const [result] = await pool.query(
      `UPDATE food_items
       SET available = ?
       WHERE id = ?`,
      [available, foodId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Food item not found"
      });
    }

    res.json({
      success: true,
      message: available
        ? "Food item is now available"
        : "Food item is now unavailable"
    });

  } catch (error) {
    console.error("Availability update error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update food availability"
    });
  }
});


app.delete("/api/manager/food/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM food_items WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Food item deleted successfully",
    });

  } catch (error) {
    console.error("Delete food error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete food item",
    });
  }
});


// Sales Dashboard
app.get("/api/manager/sales", async (req, res) => {
  try {
   
const [summary] = await pool.query(`
  SELECT
   (
  SELECT COUNT(*)
  FROM orders
  WHERE status = 'completed'
    AND DATE(created_at) = CURDATE()
) AS total_orders,
   (
  SELECT COALESCE(SUM(oi.quantity), 0)
  FROM order_items oi
  JOIN orders o
    ON oi.order_id = o.id
  WHERE o.status = 'completed'
    AND DATE(o.created_at) = CURDATE()
) AS total_items,

    (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM orders
      WHERE status = 'completed'
        AND YEAR(created_at) = YEAR(CURDATE())
        AND MONTH(created_at) = MONTH(CURDATE())
    ) AS total_sales,

    (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM orders
      WHERE status = 'completed'
        AND DATE(created_at) = CURDATE()
    ) AS todays_revenue
`);


    const [foodSales] = await pool.query(`
  SELECT
    f.name,
    SUM(oi.quantity) AS quantity_sold,
    SUM(oi.quantity * oi.price) AS sales
  FROM order_items oi
  JOIN orders o
    ON oi.order_id = o.id
  JOIN food_items f
    ON oi.food_item_id = f.id
  WHERE o.status = 'completed'
    AND DATE(o.created_at) = CURDATE()
  GROUP BY f.id, f.name
  ORDER BY quantity_sold DESC
`);
    res.json({
      success: true,
      summary: summary[0],
      foodSales
    });

  } catch (error) {
    console.error("Sales dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load sales data"
    });
  }
});


app.get("/api/manager/demand", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        f.id,
        f.name,
        f.category,
        COALESCE(
          SUM(
            CASE
              WHEN o.status = 'completed'
                AND YEAR(o.created_at) = YEAR(CURDATE())
                AND MONTH(o.created_at) = MONTH(CURDATE())
              THEN oi.quantity
              ELSE 0
            END
          ),
          0
        ) AS quantity_sold
      FROM food_items f
      LEFT JOIN order_items oi
        ON f.id = oi.food_item_id
      LEFT JOIN orders o
        ON oi.order_id = o.id
      GROUP BY f.id, f.name, f.category
      ORDER BY quantity_sold DESC
    `);

    const maxQuantity =
      rows.length > 0
        ? Math.max(...rows.map((item) => Number(item.quantity_sold)))
        : 0;

    const demand = rows.map((item) => {
      const quantity = Number(item.quantity_sold);

      let demand_level = "Low";

      if (maxQuantity > 0) {
        if (quantity >= maxQuantity * 0.7) {
          demand_level = "High";
        } else if (quantity >= maxQuantity * 0.3) {
          demand_level = "Medium";
        }
      }

      return {
        ...item,
        quantity_sold: quantity,
        demand_level,
      };
    });

    res.json({
      success: true,
      demand,
    });

  } catch (error) {
    console.error("Demand analysis error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load demand data",
    });
  }
});


app.get("/api/manager/graphs", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        f.id,
        f.name,
        COALESCE(
          SUM(
            CASE
              WHEN o.status = 'completed'
                AND YEAR(o.created_at) = YEAR(CURDATE())
                AND MONTH(o.created_at) = MONTH(CURDATE())
              THEN oi.quantity
              ELSE 0
            END
          ),
          0
        ) AS quantity_sold
      FROM food_items f
      LEFT JOIN order_items oi
        ON f.id = oi.food_item_id
      LEFT JOIN orders o
        ON oi.order_id = o.id
      GROUP BY f.id, f.name
      ORDER BY quantity_sold DESC
    `);

    res.json({
      success: true,
      graphs: rows.map((item) => ({
        ...item,
        quantity_sold: Number(item.quantity_sold),
      })),
    });

  } catch (error) {
    console.error("Graphs error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load graph data",
    });
  }
});


app.get("/api/manager/stock-alerts", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        category,
        stock_quantity,
        available
      FROM food_items
      WHERE stock_quantity <= 5
      ORDER BY stock_quantity ASC, name ASC
    `);

    const alerts = rows.map((item) => ({
      ...item,
      stock_quantity: Number(item.stock_quantity),
      alert_level:
        Number(item.stock_quantity) === 0
          ? "Out of Stock"
          : "Low Stock",
    }));

    res.json({
      success: true,
      alerts,
    });

  } catch (error) {
    console.error("Stock alerts error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load stock alerts",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});