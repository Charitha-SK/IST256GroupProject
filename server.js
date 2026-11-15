try { process.loadEnvFile(); } catch (_) {}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const crudRouter = require("./crud");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/daily_digest";

const BLOCKED_FILES = new Set([
    "/server.js",
    "/models.js",
    "/crud.js",
    "/create_database.js",
    "/package.json",
    "/package-lock.json",
    "/.gitignore"
]);

app.use(express.json({ limit: "100kb" }));

// Prevent serving backend source and package files as static assets
app.use(function (req, res, next) {
    if (BLOCKED_FILES.has(req.path)) {
        return res.status(404).json({ error: "Not found." });
    }
    next();
});

// Serve static frontend files (HTML, CSS, JS, JSON, images)
app.use(express.static(__dirname));

// Mount MongoDB CRUD API routes (/api/products, /api/cart, /api/billing, /api/shipping, /api/returns)
app.use("/api", crudRouter);

// Fallback for unknown API routes
app.use("/api", function (req, res) {
    res.status(404).json({ error: "Unknown API route." });
});

// Serve index.html at root
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB database: " + mongoose.connection.name);

        app.listen(PORT, "127.0.0.1", function () {
            console.log("Daily Digest Express server running at http://localhost:" + PORT);
            console.log("Billing page: http://localhost:" + PORT + "/billing.html");
            console.log("Returns page: http://localhost:" + PORT + "/returns.html");
        });
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error.message);
        process.exit(1);
    }
}

startServer();
