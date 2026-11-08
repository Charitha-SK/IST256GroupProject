document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("billingForm");
    const message = document.getElementById("billingMessage");
    const itemsBody = document.getElementById("orderItems");
    const submitButton = document.getElementById("submitBilling");
    const shippingSelect = document.getElementById("shippingMethod");
    const apiUrl = "/api/billing";
    const requestTimeoutMs = 10000;   
    const approvalPollMs = 1000;  
    const approvalMaxChecks = 15;

    if (!form) return;

    form.noValidate = true;

    let products = [];
    let cart = [];
    let orderItems = [];
    let orderSubmitted = false;

    function showMessage(text, isError) {
        message.textContent = text;
        message.classList.toggle("text-danger", isError);
        message.classList.toggle("text-success", !isError && text !== "");
    }

    function money(value) {
        return Number(value).toFixed(2);
    }

    function readStoredArray(key) {
        const stored = localStorage.getItem(key);
        if (stored === null) return [];

        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
            throw new Error("Saved shopping data is not in the expected format.");
        }
        return parsed;
    }

    function renderOrder() {
        itemsBody.replaceChildren();
        orderItems = [];

        cart.forEach(function (cartItem) {
            const product = products.find(function (item) {
                return item.productId === cartItem.productId;
            });
            const quantity = Number(cartItem.quantity);
            const price = Number(product && product.price);

            if (!product || !Number.isInteger(quantity) || quantity < 1 ||
                !Number.isFinite(price) || price < 0) {
                return;
            }

            orderItems.push({
                productId: product.productId,
                description: product.description,
                unitOfMeasure: product.unitOfMeasure,
                price: price,
                quantity: quantity
            });

            const row = document.createElement("tr");
            [product.description, String(quantity), "$" + money(price * quantity)]
                .forEach(function (value) {
                    const cell = document.createElement("td");
                    cell.textContent = value;
                    row.appendChild(cell);
                });
            itemsBody.appendChild(row);
        });

        if (orderItems.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 3;
            cell.textContent = "Your cart is empty. Add items before placing an order.";
            row.appendChild(cell);
            itemsBody.appendChild(row);
        }

        updateTotals();
    }

    function updateTotals() {
        const subtotalCents = orderItems.reduce(function (total, item) {
            return total + Math.round(item.price * 100) * item.quantity;
        }, 0);
        const hasPhysicalItems = orderItems.some(function (item) {
            return item.unitOfMeasure !== "Digital";
        });
        const shippingMethod = shippingSelect.value;
        const shippingCents = !hasPhysicalItems || shippingMethod === "Digital"
            ? 0
            : shippingMethod === "Express" ? 999
                : shippingMethod === "Standard" ? 499 : 0;
        const subtotal = subtotalCents / 100;
        const shipping = shippingCents / 100;
        const total = (subtotalCents + shippingCents) / 100;

        document.getElementById("orderSubtotal").textContent = money(subtotal);
        document.getElementById("shippingCost").textContent = money(shipping);
        document.getElementById("orderTotal").textContent = money(total);
        return { subtotal: subtotal, shipping: shipping, total: total };
    }

    function validateForm() {
        form.querySelectorAll(".is-invalid").forEach(function (field) {
            field.classList.remove("is-invalid");
            field.removeAttribute("aria-invalid");
        });

        const invalidFields = Array.from(form.querySelectorAll("input, select, textarea"))
            .filter(function (field) {
                return !field.checkValidity();
            });
        const errors = [];

        if (invalidFields.length > 0) {
            errors.push("Complete all required fields using the requested formats.");
        }

        const cardNumber = document.getElementById("cardNumber");
        const digits = cardNumber.value.replace(/[\s-]/g, "");
        const cardDigits = /^\d{13,19}$/.test(digits);
        let sum = 0;
        let doubleDigit = false;
        for (let index = digits.length - 1; index >= 0; index--) {
            let digit = Number(digits[index]);
            if (doubleDigit) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            doubleDigit = !doubleDigit;
        }
        if (!cardDigits || sum % 10 !== 0) {
            invalidFields.push(cardNumber);
            errors.push("Enter a valid test card number.");
        }

        const expiration = document.getElementById("expirationDate").value;
        if (expiration) {
            const [year, month] = expiration.split("-").map(Number);
            const now = new Date();
            if (year < now.getFullYear() ||
                (year === now.getFullYear() && month < now.getMonth() + 1)) {
                const expirationField = document.getElementById("expirationDate");
                invalidFields.push(expirationField);
                errors.push("The card expiration date must be in the future.");
            }
        }

        invalidFields.forEach(function (field) {
            field.classList.add("is-invalid");
            field.setAttribute("aria-invalid", "true");
        });

        if (orderItems.length === 0) {
            errors.push("Your cart is empty; add an item before placing an order.");
        }
        if (shippingSelect.value === "Digital" &&
            orderItems.some(function (item) {
                return item.unitOfMeasure !== "Digital";
            })) {
            shippingSelect.classList.add("is-invalid");
            shippingSelect.setAttribute("aria-invalid", "true");
            errors.push("Digital delivery is only available for digital products.");
        }

        return errors;
    }
    

    async function requestError(response) {
        let serverMessage = "";
        try {
            const data = await response.json();
            if (data && typeof data.error === "string") serverMessage = data.error;
        } catch (error) {
            // No JSON body, so fall back to the generic message below
        }
 
        if (serverMessage) {
            return serverMessage + " (HTTP " + response.status + ")";
        }
        return "Billing request failed (HTTP " + response.status + "). Please try again.";
    }
    

    async function sendRequest(url, options) {
        const controller = new AbortController();
        const timer = window.setTimeout(function () {
            controller.abort();
        }, requestTimeoutMs);
 
        let response;
        try {
            response = await fetch(url, Object.assign({}, options, { signal: controller.signal }));
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("The billing service took too long to respond. Please try again.");
            }
            throw new Error("Could not connect to the billing service.");
        } finally {
            window.clearTimeout(timer);
        }
 
        if (!response.ok) throw new Error(await requestError(response));
 
        try {
            return await response.json();
        } catch (error) {
            throw new Error("The billing service sent a response that could not be read.");
        }
    }
 
    function pause(milliseconds) {
        return new Promise(function (resolve) {
            window.setTimeout(resolve, milliseconds);
        });
    }
 

    async function waitForApproval(orderId) {
        let decision = { orderId: orderId, status: "Pending" };
 
        for (let check = 0; check < approvalMaxChecks && decision.status === "Pending"; check++) {
            await pause(approvalPollMs);
            decision = await sendRequest(apiUrl + "/" + encodeURIComponent(orderId), {
                headers: { "Accept": "application/json" }
            });
        }
 
        return decision;
    }

    shippingSelect.addEventListener("change", updateTotals);

    form.addEventListener("input", function (event) {
        event.target.classList.remove("is-invalid");
        event.target.removeAttribute("aria-invalid");
        showMessage("", false);
    });

    form.addEventListener("change", function (event) {
        event.target.classList.remove("is-invalid");
        event.target.removeAttribute("aria-invalid");
        showMessage("", false);
    });

    form.addEventListener("reset", function () {
        window.setTimeout(function () {
            orderSubmitted = false;
            submitButton.disabled = false;
            form.querySelectorAll(".is-invalid").forEach(function (field) {
                field.classList.remove("is-invalid");
                field.removeAttribute("aria-invalid");
            });
            showMessage("", false);
            updateTotals();
        }, 0);
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const errors = validateForm();
        if (errors.length > 0) {
            showMessage(errors.join(" "), true);
            const firstInvalid = form.querySelector(".is-invalid");
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        const totals = updateTotals();
        if (orderSubmitted) {
            showMessage("This order was already submitted. Clear the form to place another order.", true);
            return;
        }
        const payload = {
            customer: {
                fullName: document.getElementById("fullName").value.trim(),
                email: document.getElementById("email").value.trim(),
                address: document.getElementById("address").value.trim(),
                city: document.getElementById("city").value.trim(),
                state: document.getElementById("state").value.trim(),
                zipCode: document.getElementById("zipCode").value.trim()
            },
            items: orderItems,
            shipping: {
                method: shippingSelect.value,
                instructions: document.getElementById("shippingNotes").value.trim(),
                cost: totals.shipping
            },
            subtotal: totals.subtotal,
            total: totals.total,
            paymentMethod: "card"
        };

        submitButton.disabled = true;
        showMessage("Submitting order...", false);
        try {
            const created = await sendRequest(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            orderSubmitted = true;
            document.getElementById("cardNumber").value = "";
            document.getElementById("securityCode").value = "";
            showMessage("Order " + created.orderId + " received. Waiting for approval...", false);
            let decision;
            try {
                decision = await waitForApproval(created.orderId);
            } catch (error) {
                showMessage("Order " + created.orderId + " was received, but its approval status " +
                    "could not be checked: " + error.message, true);
                return;
            }
 
            if (decision.status === "Approved") {
                showMessage("Order " + decision.orderId + " approved. Total: $" +
                    money(decision.total) + ". " + (decision.message || ""), false);
            } else if (decision.status === "Declined") {
                orderSubmitted = false;   // let the customer fix the details and try again
                showMessage("Order " + decision.orderId + " was declined. " +
                    (decision.message || "") + " Please check your details and try again.", true);
            } else {
                showMessage("Order " + decision.orderId + " is still awaiting approval. " +
                    "Please check back soon.", false);
            }
        } catch (error) {
            showMessage(error.message || "Could not submit the order.", true);
        } finally {
            submitButton.disabled = orderSubmitted;
        }
    });

    async function initialize() {
        try {
            const storedCart = readStoredArray("dailyDigestCart");
            try {
                products = readStoredArray("dailyDigestProducts");
            } catch (error) {
                showMessage(error.message, true);
                return;
            }

            if (products.length === 0) {
                const response = await fetch("products.json", {
                    headers: { "Accept": "application/json" }
                });
                if (!response.ok) {
                    throw new Error("Could not load products (HTTP " + response.status + ").");
                }
                const data = await response.json();
                products = data.products;
            }

            cart = storedCart;
            renderOrder();
        } catch (error) {
            showMessage(error.message || "Could not load your cart.", true);
        }
    }

    initialize();
});
