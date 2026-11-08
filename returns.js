document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("returnForm");
    const searchInput = document.getElementById("returnSearch");
    const searchButton = document.getElementById("searchReturnButton");
    const productList = document.getElementById("returnProductList");
    const productSelect = document.getElementById("returnProduct");
    const message = document.getElementById("returnMessage");
    const searchMessage = document.getElementById("searchMessage");
    const submitButton = document.getElementById("submitReturn");
    const apiUrl = "/api/returns";

    if (!form) return;

    form.noValidate = true;
    let products = [];
    let requestSubmitted = false;

    function showMessage(text, isError) {
        message.textContent = text;
        message.classList.toggle("text-danger", isError);
        message.classList.toggle("text-success", !isError && text !== "");
    }

    function productMatches(product, query) {
        const searchable = [
            product.productId,
            product.description,
            product.category,
            product.unitOfMeasure
        ].join(" ").toLowerCase();
        return searchable.includes(query);
    }

    function renderProducts(query) {
        productList.replaceChildren();
        const matches = products.filter(function (product) {
            return productMatches(product, query);
        });

        if (matches.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 5;
            cell.textContent = "No matching products found.";
            row.appendChild(cell);
            productList.appendChild(row);
            searchMessage.textContent = "No matching products found.";
            return;
        }

        searchMessage.textContent = "";
        matches.forEach(function (product) {
            const row = document.createElement("tr");
            const imageCell = document.createElement("td");
            imageCell.textContent = "No image available";
            const nameCell = document.createElement("td");
            nameCell.textContent = product.description;
            const priceCell = document.createElement("td");
            priceCell.textContent = "$" + Number(product.price).toFixed(2);
            const quantityCell = document.createElement("td");
            quantityCell.textContent = "Not provided";
            const selectCell = document.createElement("td");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn btn-sm btn-outline-primary";
            button.textContent = "Select";
            button.addEventListener("click", function () {
                productSelect.value = product.productId;
                productSelect.dispatchEvent(new Event("change"));
                productSelect.focus();
            });
            selectCell.appendChild(button);
            row.append(imageCell, nameCell, priceCell, quantityCell, selectCell);
            productList.appendChild(row);
        });
    }

    function updateSelectedProduct() {
        const selected = products.find(function (product) {
            return product.productId === productSelect.value;
        });
        const image = document.getElementById("returnProductImage");
        document.getElementById("selectedProductName").textContent =
            selected ? selected.description : "";
        document.getElementById("selectedProductPrice").textContent =
            selected ? Number(selected.price).toFixed(2) : "0.00";

        // The current products.json does not provide image paths.
        image.hidden = true;
        image.removeAttribute("src");
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

        const selected = products.find(function (product) {
            return product.productId === productSelect.value;
        });
        if (!selected) {
            invalidFields.push(productSelect);
            errors.push("Select a product from the available product list.");
        }

        if (requestSubmitted) {
            errors.push("This return request was already submitted. Clear the form to submit another.");
        }

        const quantityField = document.getElementById("returnQuantity");
        const quantity = Number(quantityField.value);
        if (!Number.isInteger(quantity) || quantity < 1) {
            invalidFields.push(quantityField);
            errors.push("Return quantity must be a whole number greater than zero.");
        }

        const purchaseDate = document.getElementById("purchaseDate").value;
        const now = new Date();
        const today = now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, "0") + "-" +
            String(now.getDate()).padStart(2, "0");
        if (purchaseDate && purchaseDate > today) {
            const dateField = document.getElementById("purchaseDate");
            invalidFields.push(dateField);
            errors.push("Purchase date cannot be in the future.");
        }

        if (document.getElementById("returnReason").value === "Other" &&
            document.getElementById("returnDetails").value.trim() === "") {
            const detailsField = document.getElementById("returnDetails");
            invalidFields.push(detailsField);
            errors.push("Add details when selecting Other as the return reason.");
        }

        invalidFields.forEach(function (field) {
            field.classList.add("is-invalid");
            field.setAttribute("aria-invalid", "true");
        });
        return errors;
    }

    function requestError(response) {
        if (response.status === 0) return "Could not connect to the returns service.";
        return "Return request failed (HTTP " + response.status + "). Please try again.";
    }

    searchButton.addEventListener("click", function () {
        renderProducts(searchInput.value.trim().toLowerCase());
    });
    searchInput.addEventListener("input", function () {
        renderProducts(searchInput.value.trim().toLowerCase());
    });
    productSelect.addEventListener("change", function () {
        updateSelectedProduct();
        productSelect.classList.remove("is-invalid");
        productSelect.removeAttribute("aria-invalid");
    });

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
            requestSubmitted = false;
            submitButton.disabled = false;
            form.querySelectorAll(".is-invalid").forEach(function (field) {
                field.classList.remove("is-invalid");
                field.removeAttribute("aria-invalid");
            });
            updateSelectedProduct();
            renderProducts(searchInput.value.trim().toLowerCase());
            showMessage("", false);
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

        const product = products.find(function (item) {
            return item.productId === productSelect.value;
        });
        const payload = {
            customer: {
                fullName: document.getElementById("customerName").value.trim(),
                email: document.getElementById("returnEmail").value.trim()
            },
            orderNumber: document.getElementById("orderNumber").value.trim(),
            product: {
                productId: product.productId,
                productName: product.description,
                price: Number(product.price),
                quantity: Number(document.getElementById("returnQuantity").value)
            },
            purchaseDate: document.getElementById("purchaseDate").value,
            reason: document.getElementById("returnReason").value,
            condition: document.getElementById("productCondition").value,
            details: document.getElementById("returnDetails").value.trim(),
            preferredResolution: document.getElementById("returnType").value
        };

        submitButton.disabled = true;
        showMessage("Submitting return request...", false);
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(requestError(response));
            requestSubmitted = true;
            showMessage("Return request submitted successfully.", false);
        } catch (error) {
            showMessage(error.message || "Could not submit the return request.", true);
        } finally {
            submitButton.disabled = requestSubmitted;
        }
    });

    async function loadProducts() {
        try {
            const response = await fetch("products.json", {
                headers: { "Accept": "application/json" }
            });
            if (!response.ok) {
                throw new Error("Could not load products (HTTP " + response.status + ").");
            }
            const data = await response.json();
            if (!data || !Array.isArray(data.products)) {
                throw new Error("Product data is not in the expected format.");
            }
            products = data.products.filter(function (product) {
                return product && typeof product.productId === "string" &&
                    typeof product.description === "string" &&
                    Number.isFinite(Number(product.price));
            });

            productSelect.replaceChildren();
            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "Select a product";
            productSelect.appendChild(placeholder);
            products.forEach(function (product) {
                const option = document.createElement("option");
                option.value = product.productId;
                option.textContent = product.description;
                productSelect.appendChild(option);
            });
            renderProducts("");
        } catch (error) {
            showMessage(error.message || "Could not load products.", true);
            searchMessage.textContent = "Products could not be loaded.";
        }
    }

    loadProducts();
});
