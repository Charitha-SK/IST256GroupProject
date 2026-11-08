const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 3000;
const APPROVAL_DELAY_MS = process.env.APPROVAL_DELAY_MS !== undefined
    ? Number(process.env.APPROVAL_DELAY_MS)
    : 1500;
const APPROVAL_LIMIT = 500;
const MAX_BODY_BYTES = 100 * 1024;
const MAX_STORED_ORDERS = 1000;
const SHIPPING_CENTS = { Standard: 499, Express: 999, Digital: 0 };
const FORBIDDEN_KEYS = ["cardnumber", "securitycode", "cvv", "cvc", "expirationdate"];
const ROOT = __dirname;

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};
const BLOCKED_FILES = ["server.js", "package.json", "package-lock.json"];

const orders = new Map();



function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function sendJson(res, status, data, extraHeaders) {
    const body = JSON.stringify(data);
    res.writeHead(status, Object.assign({
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
    }, extraHeaders));
    res.end(body);
}

function readBody(req) {
    return new Promise(function (resolve, reject) {
        const chunks = [];
        let size = 0;
        let tooLarge = false;

        req.on("data", function (chunk) {
            if (tooLarge) return;
            size += chunk.length;
            if (size > MAX_BODY_BYTES) {
                tooLarge = true;
                chunks.length = 0;
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", function () {
            if (tooLarge) reject(httpError(413, "The request body is too large."));
            else resolve(Buffer.concat(chunks).toString("utf8"));
        });
        req.on("error", reject);
    });
}

function isText(value, maxLength) {
    return typeof value === "string" && value.trim() !== "" && value.length <= maxLength;
}

function containsCardData(value) {
    if (Array.isArray(value)) return value.some(containsCardData);
    if (value === null || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
        return FORBIDDEN_KEYS.indexOf(key.toLowerCase()) !== -1 || containsCardData(value[key]);
    });
}


function validateOrder(body) {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        return { error: "The order must be a JSON object." };
    }
    if (containsCardData(body)) {
        return { error: "Card details must not be sent to this service." };
    }

    const customer = body.customer;
    if (!customer || typeof customer !== "object" ||
        !isText(customer.fullName, 100) ||
        !isText(customer.email, 254) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email) ||
        !isText(customer.address, 200) ||
        !isText(customer.city, 100) ||
        !isText(customer.state, 100) ||
        !isText(customer.zipCode, 10) || !/^\d{5}(-\d{4})?$/.test(customer.zipCode)) {
        return { error: "The customer information is missing or invalid." };
    }

    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 100) {
        return { error: "The order must contain between 1 and 100 items." };
    }
    for (const item of body.items) {
        if (!item || typeof item !== "object" ||
            !isText(item.productId, 50) ||
            !isText(item.description, 200) ||
            !isText(item.unitOfMeasure, 30) ||
            typeof item.price !== "number" || !Number.isFinite(item.price) ||
            item.price < 0 || item.price > 100000 ||
            !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000) {
            return { error: "One or more order items are invalid." };
        }
    }

    const shipping = body.shipping;
    if (!shipping || typeof shipping !== "object" ||
        typeof shipping.method !== "string" ||
        !Object.prototype.hasOwnProperty.call(SHIPPING_CENTS, shipping.method)) {
        return { error: "Choose a valid shipping method." };
    }
    if (shipping.instructions !== undefined &&
        (typeof shipping.instructions !== "string" || shipping.instructions.length > 500)) {
        return { error: "The delivery instructions are too long." };
    }

    const hasPhysicalItems = body.items.some(function (item) {
        return item.unitOfMeasure !== "Digital";
    });
    if (shipping.method === "Digital" && hasPhysicalItems) {
        return { error: "Digital delivery is only available for digital products." };
    }

    // Recalculate the totals rather than trusting the browser
    const subtotalCents = body.items.reduce(function (total, item) {
        return total + Math.round(item.price * 100) * item.quantity;
    }, 0);
    const shippingCents = !hasPhysicalItems || shipping.method === "Digital"
        ? 0
        : SHIPPING_CENTS[shipping.method];
    const totalCents = subtotalCents + shippingCents;

    if (Math.round(Number(body.subtotal) * 100) !== subtotalCents ||
        Math.round(Number(shipping.cost) * 100) !== shippingCents ||
        Math.round(Number(body.total) * 100) !== totalCents) {
        return { error: "The order totals do not match the items and shipping method." };
    }

    return { totalCents: totalCents };
}

function decideOrder(order) {
    if (order.total > APPROVAL_LIMIT) {
        order.status = "Declined";
        order.message = "Orders over $" + APPROVAL_LIMIT.toFixed(2) +
            " need a manual payment review in this test service.";
    } else {
        order.status = "Approved";
        order.message = "Your payment was approved. Thank you for your order!";
    }
}



async function handleSubmit(req, res) {
    const contentType = (req.headers["content-type"] || "").toLowerCase();
    if (contentType.indexOf("application/json") !== 0) {
        throw httpError(415, "Send the order as application/json.");
    }

    let body;
    try {
        body = JSON.parse(await readBody(req));
    } catch (error) {
        if (error.status) throw error;
        throw httpError(400, "The request body is not valid JSON.");
    }

    const result = validateOrder(body);
    if (result.error) throw httpError(400, result.error);

    const orderId = "DD-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const order = {
        orderId: orderId,
        status: "Pending",
        message: "Your order is awaiting approval.",
        total: result.totalCents / 100,
        createdAt: new Date().toISOString()
    };

    orders.set(orderId, order);
    if (orders.size > MAX_STORED_ORDERS) {
        orders.delete(orders.keys().next().value);   // drop the oldest order
    }

    setTimeout(function () { decideOrder(order); }, APPROVAL_DELAY_MS);

    console.log("Order " + orderId + " received (total $" + order.total.toFixed(2) + ")");
    sendJson(res, 201, { orderId: orderId, status: order.status, message: order.message },
        { "Location": "/api/billing/" + orderId });
}

function handleStatus(res, orderId) {
    const order = orders.get(orderId);
    if (!order) throw httpError(404, "Order not found.");

    sendJson(res, 200, {
        orderId: order.orderId,
        status: order.status,
        message: order.message,
        total: order.total
    });
}

function serveStatic(req, res, pathname) {
    let relative;
    try {
        relative = decodeURIComponent(pathname);
    } catch (error) {
        throw httpError(400, "Bad request.");
    }
    if (relative === "/") relative = "/index.html";

    const segments = relative.split("/").filter(Boolean);
    const filePath = path.join(ROOT, relative);
    const extension = path.extname(filePath).toLowerCase();

    // Only serve known file types inside this folder, never dotfiles or server code
    if (relative.indexOf("\0") !== -1 ||
        filePath.indexOf(ROOT + path.sep) !== 0 ||
        segments.some(function (segment) { return segment.charAt(0) === "."; }) ||
        BLOCKED_FILES.indexOf(path.basename(filePath)) !== -1 ||
        !Object.prototype.hasOwnProperty.call(MIME_TYPES, extension)) {
        throw httpError(404, "Not found.");
    }

    fs.stat(filePath, function (statError, stats) {
        if (statError || !stats.isFile()) {
            sendJson(res, 404, { error: "Not found." });
            return;
        }
        res.writeHead(200, {
            "Content-Type": MIME_TYPES[extension],
            "Content-Length": stats.size,
            "X-Content-Type-Options": "nosniff"
        });
        if (req.method === "HEAD") {
            res.end();
            return;
        }
        fs.createReadStream(filePath).pipe(res);
    });
}



const server = http.createServer(async function (req, res) {
    try {
        let pathname;
        try {
            pathname = new URL(req.url, "http://localhost").pathname;
        } catch (error) {
            throw httpError(400, "Bad request.");
        }

        if (pathname === "/api/billing") {
            if (req.method !== "POST") {
                sendJson(res, 405, { error: "Use POST to submit an order." }, { "Allow": "POST" });
                return;
            }
            await handleSubmit(req, res);
            return;
        }

        const statusMatch = pathname.match(/^\/api\/billing\/([A-Za-z0-9-]{1,40})$/);
        if (statusMatch) {
            if (req.method !== "GET") {
                sendJson(res, 405, { error: "Use GET to check an order." }, { "Allow": "GET" });
                return;
            }
            handleStatus(res, statusMatch[1]);
            return;
        }

        if (pathname.indexOf("/api/") === 0) {
            throw httpError(404, "Unknown API route.");
        }

        if (req.method === "GET" || req.method === "HEAD") {
            serveStatic(req, res, pathname);
            return;
        }

        sendJson(res, 405, { error: "Method not allowed." });
    } catch (error) {
        const status = error.status || 500;
        if (!error.status) console.error(error);
        if (!res.headersSent) {
            sendJson(res, status, { error: error.status ? error.message : "Unexpected server error." });
        }
    }
});


server.listen(PORT, "127.0.0.1", function () {
    console.log("Daily Digest service running at http://localhost:" + PORT);
    console.log("Billing page: http://localhost:" + PORT + "/billing.html");
});