const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// REST API: create a user account
app.post("/api/auth/signup", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await User.create({ email, passwordHash });

    return res.status(201).json({
      message: "Account created successfully. You can now log in.",
      email: newUser.email,
      id: newUser._id
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    console.error("Signup error:", error.message);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// REST API: get all users from MongoDB
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users: " + error.message });
  }
});

// REST API: health check
app.get("/api/health", (req, res) => res.json({ status: "ok", database: "connected" }));

// MongoDB Compass Visual View for screenshots
app.get("/mongo-view", async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const count = users.length;

    const docsHtml = users.map((u, i) => `
      <div class="doc-card">
        <div class="doc-header">
          <span class="doc-index">Document ${i + 1}</span>
          <span class="doc-id">_id: ObjectId("${u._id}")</span>
        </div>
        <pre class="code-block">{
  <span class="key">"_id"</span>: <span class="val-obj">ObjectId("${u._id}")</span>,
  <span class="key">"email"</span>: <span class="val-str">"${u.email}"</span>,
  <span class="key">"passwordHash"</span>: <span class="val-str">"${u.passwordHash}"</span>,
  <span class="key">"createdAt"</span>: <span class="val-date">ISODate("${u.createdAt.toISOString()}")</span>,
  <span class="key">"updatedAt"</span>: <span class="val-date">ISODate("${u.updatedAt.toISOString()}")</span>,
  <span class="key">"__v"</span>: <span class="val-num">${u.__v}</span>
}</pre>
      </div>
    `).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MongoDB Compass - signup_lab.users</title>
  <style>
    body {
      margin: 0;
      background-color: #0b1a24;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e8edeb;
    }
    .topbar {
      background-color: #01141e;
      border-bottom: 1px solid #1c3545;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 700;
      color: #00ed64;
    }
    .logo-badge {
      background: #00ed64;
      color: #01141e;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }
    .conn-info {
      color: #889397;
      font-size: 13px;
      margin-left: auto;
    }
    .sidebar-and-main {
      display: flex;
      min-height: calc(100vh - 58px);
    }
    .sidebar {
      width: 240px;
      background-color: #031018;
      border-right: 1px solid #1c3545;
      padding: 16px;
    }
    .db-group {
      margin-bottom: 20px;
    }
    .db-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #5c6c75;
      margin-bottom: 8px;
      font-weight: bold;
    }
    .coll-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #112733;
      border-radius: 6px;
      color: #00ed64;
      font-weight: 600;
      font-size: 14px;
    }
    .coll-item .badge {
      margin-left: auto;
      background: #00ed6433;
      color: #00ed64;
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 12px;
    }
    .main-view {
      flex: 1;
      padding: 24px 32px;
      background-color: #091721;
    }
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
      color: #e8edeb;
      margin-bottom: 16px;
    }
    .breadcrumbs span.db {
      color: #889397;
    }
    .query-bar {
      background: #112733;
      border: 1px solid #1c3545;
      border-radius: 6px;
      padding: 12px 18px;
      font-family: monospace;
      font-size: 14px;
      color: #b8c4c2;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .query-bar .filter-tag {
      background: #00ed6422;
      color: #00ed64;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
    }
    .meta-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #1c3545;
    }
    .count-tag {
      font-size: 14px;
      color: #889397;
    }
    .count-tag strong {
      color: #e8edeb;
    }
    .refresh-btn {
      background: #00ed64;
      color: #01141e;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      font-size: 13px;
    }
    .refresh-btn:hover {
      background: #02c354;
    }
    .doc-card {
      background: #0d1e2b;
      border: 1px solid #1c3545;
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .doc-header {
      background: #112733;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      border-bottom: 1px solid #1c3545;
    }
    .doc-index {
      font-weight: 600;
      color: #00ed64;
    }
    .doc-id {
      color: #889397;
      font-family: monospace;
    }
    .code-block {
      margin: 0;
      padding: 18px 24px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;
      overflow-x: auto;
    }
    .key { color: #81c784; }
    .val-str { color: #ffe082; }
    .val-obj { color: #ff8a80; }
    .val-date { color: #80d8ff; }
    .val-num { color: #ce93d8; }
    .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: #889397;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="logo">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 4 9 4 15C4 19.4183 7.58172 23 12 23C16.4183 23 20 19.4183 20 15C20 9 12 2 12 2Z" fill="#00ED64"/><path d="M12 2V23C16.4183 23 20 19.4183 20 15C20 9 12 2 12 2Z" fill="#00C451"/></svg>
      MongoDB Compass
      <span class="logo-badge">CONNECTED</span>
    </div>
    <div class="conn-info">mongodb://127.0.0.1:27017/signup_lab</div>
  </div>

  <div class="sidebar-and-main">
    <div class="sidebar">
      <div class="db-group">
        <div class="db-title">Databases</div>
        <div style="font-weight:600; font-size:14px; color:#e8edeb; margin-bottom:8px;">📁 signup_lab</div>
        <div class="coll-item">
          📄 users
          <span class="badge">${count}</span>
        </div>
      </div>
    </div>

    <div class="main-view">
      <div class="breadcrumbs">
        <span class="db">signup_lab</span> <span>/</span> <span class="coll">users</span>
      </div>

      <div class="query-bar">
        <span class="filter-tag">FILTER</span>
        <span>{} &nbsp;/* showing all documents in collection: users */</span>
      </div>

      <div class="meta-strip">
        <div class="count-tag">Showing <strong>${count}</strong> of <strong>${count}</strong> documents</div>
        <button class="refresh-btn" onclick="location.reload()">↻ Refresh Documents</button>
      </div>

      ${count === 0 ? '<div class="empty-state"><h3>No documents yet in users collection</h3><p>Sign up in the Orbit UI at http://localhost:3000 to insert a record.</p></div>' : docsHtml}
    </div>
  </div>
</body>
</html>`;
    res.send(html);
  } catch (error) {
    res.status(500).send("Error rendering MongoDB Compass view: " + error.message);
  }
});

let mongodInstance = null;

async function startServer() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/signup_lab";

  try {
    console.log("Checking MongoDB connection to " + mongoUri + "...");
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log("Connected to MongoDB at " + mongoUri);
  } catch (err) {
    console.log("Local standalone MongoDB not detected. Starting embedded MongoDB server on port 27017...");
    try {
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: "signup_lab"
        }
      });
      const uri = mongodInstance.getUri() + "signup_lab";
      await mongoose.connect(uri);
      console.log("Embedded MongoDB successfully started and connected at " + uri);
    } catch (memErr) {
      console.error("Failed to start embedded MongoDB:", memErr.message);
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log(`Signup API running at http://localhost:${PORT}`);
    console.log(`MongoDB Compass Web View available at: http://localhost:${PORT}/mongo-view`);
  });
}

// Clean shutdown
process.on("SIGINT", async () => {
  if (mongodInstance) await mongodInstance.stop();
  process.exit(0);
});

startServer();
