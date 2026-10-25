
// cart.js - Daily Digest Shopping Cart
// Regular JavaScript only - no jQuery or AJAX

document.addEventListener("DOMContentLoaded", function () {

    const productForm = document.getElementById("productForm");
    const productResults = document.getElementById("productResults");
    const cartTableBody = document.getElementById("cartTableBody");
    const cartTotal = document.getElementById("cartTotal");
    const formMessage = document.getElementById("formMessage");
    const cartMessage = document.getElementById("cartMessage");
    const apiMessage = document.getElementById("apiMessage");
    const saveButton = document.getElementById("saveButton");

    const PRODUCT_KEY = "dailyDigestProducts";
    const CART_KEY = "dailyDigestCart";

    let products = [];
    let cart = [];
    let editingId = null;

    // Starting product data from products.json
    const defaultProducts = [
        { productId: "DD-001", description: "Campus Tech Fair Recap", category: "Technology", unitOfMeasure: "Digital", price: 1.99 },
        { productId: "DD-002", description: "Quiet Hours Photo Essay", category: "Lifestyle", unitOfMeasure: "Digital", price: 2.49 },
        { productId: "DD-003", description: "Five-Minute Reset", category: "Lifestyle", unitOfMeasure: "Digital", price: 0.99 },
        { productId: "DD-004", description: "Student Budget Meal Guide", category: "Lifestyle", unitOfMeasure: "Digital", price: 1.49 },
        { productId: "DD-005", description: "Best Reads of the Semester", category: "Books", unitOfMeasure: "Digital", price: 1.79 },
        { productId: "DD-006", description: "Daily Digest Reading List Set", category: "Books", unitOfMeasure: "Set", price: 12.99 },
        { productId: "DD-007", description: "Daily Digest Tote Bag", category: "Accessories", unitOfMeasure: "Each", price: 14.99 },
        { productId: "DD-008", description: "Dorm Room Refresh Guide", category: "Home", unitOfMeasure: "Digital", price: 2.29 },
        { productId: "DD-009", description: "Daily Digest Monthly Pass", category: "Lifestyle", unitOfMeasure: "Subscription", price: 7.99 },
        { productId: "DD-010", description: "Study Gadgets Roundup", category: "Technology", unitOfMeasure: "Digital", price: 1.99 }
    ];

    // Display success or error messages
    function showMessage(element, message, color) {
        element.textContent = message;
        element.style.color = color;
    }

    // Load products from localStorage
    function loadProducts() {
        const saved = localStorage.getItem(PRODUCT_KEY);

        try {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed)) {
                products = parsed;
            } else {
                products = defaultProducts.slice();
            }
        } catch (error) {
            products = defaultProducts.slice();
        }

        saveProducts();
    }

    // Save product data
    function saveProducts() {
        localStorage.setItem(
            PRODUCT_KEY,
            JSON.stringify(products)
        );
    }

    // Load saved shopping cart
    function loadCart() {
        const saved = localStorage.getItem(CART_KEY);

        try {
            const parsed = JSON.parse(saved);
            cart = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            cart = [];
        }
    }

    // Save cart data
    function saveCart() {
        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

        displayCart();
    }

    // Display available products
    function displayProducts(searchText = "") {
        productResults.innerHTML = "";

        const search = String(searchText).toLowerCase().trim();

        const matches = products.filter(function (product) {
            return (
                product.productId.toLowerCase().includes(search) ||
                product.description.toLowerCase().includes(search) ||
                product.category.toLowerCase().includes(search)
            );
        });

        matches.forEach(function (product) {
            const div = document.createElement("div");
            div.className = "border rounded p-3 mb-2";

            const information = document.createElement("p");

            information.textContent =
                product.description + " | " +
                product.category + " | $" +
                Number(product.price).toFixed(2);

            // Add to Cart button
            const addButton = document.createElement("button");
            addButton.textContent = "Add to Cart";
            addButton.className = "btn btn-primary me-2";
            addButton.type = "button";

            addButton.addEventListener("click", function () {
                addToCart(product.productId);
            });

            // Edit Product button
            const editButton = document.createElement("button");
            editButton.textContent = "Edit Product";
            editButton.className = "btn btn-secondary";
            editButton.type = "button";

            editButton.addEventListener("click", function () {
                editProduct(product.productId);
            });

            div.appendChild(information);
            div.appendChild(addButton);
            div.appendChild(editButton);

            productResults.appendChild(div);
        });

        document.getElementById("searchMessage").textContent =
            matches.length === 0
                ? "No matching products found."
                : "";
    }

    // Add product to shopping cart
    function addToCart(productId) {
        const product = products.find(function (p) {
            return p.productId === productId;
        });

        if (!product) {
            showMessage(cartMessage, "Product not found.", "red");
            return;
        }

        const existingItem = cart.find(function (item) {
            return item.productId === productId;
        });

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                productId: productId,
                quantity: 1
            });
        }

        saveCart();

        showMessage(
            cartMessage,
            product.description + " added to cart.",
            "green"
        );
    }

    // Display items in shopping cart
    function displayCart() {
        cartTableBody.innerHTML = "";

        let total = 0;

        cart.forEach(function (item) {
            const product = products.find(function (p) {
                return p.productId === item.productId;
            });

            if (!product) return;

            const row = document.createElement("tr");

            const values = [
                product.productId,
                product.description,
                product.category,
                product.unitOfMeasure,
                "$" + Number(product.price).toFixed(2)
            ];

            values.forEach(function (value) {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            // Quantity field
            const quantityCell = document.createElement("td");
            const quantityInput = document.createElement("input");

            quantityInput.type = "number";
            quantityInput.min = "1";
            quantityInput.step = "1";
            quantityInput.value = item.quantity;
            quantityInput.className = "form-control";
            quantityInput.style.width = "80px";

            quantityInput.addEventListener("change", function () {
                const quantity = Number(quantityInput.value);

                if (!Number.isInteger(quantity) || quantity < 1) {
                    showMessage(
                        cartMessage,
                        "Quantity must be a whole number greater than zero.",
                        "red"
                    );

                    displayCart();
                    return;
                }

                item.quantity = quantity;
                saveCart();
            });

            quantityCell.appendChild(quantityInput);
            row.appendChild(quantityCell);

            // Remove button
            const actionCell = document.createElement("td");
            const removeButton = document.createElement("button");

            removeButton.textContent = "Remove";
            removeButton.className = "btn btn-danger btn-sm";
            removeButton.type = "button";

            removeButton.addEventListener("click", function () {
                removeFromCart(item.productId);
            });

            actionCell.appendChild(removeButton);
            row.appendChild(actionCell);

            cartTableBody.appendChild(row);

            total += Number(product.price) * item.quantity;
        });

        // Calculate total price
        cartTotal.textContent = total.toFixed(2);
    }

    // Remove product from cart
    function removeFromCart(productId) {
        cart = cart.filter(function (item) {
            return item.productId !== productId;
        });

        saveCart();

        showMessage(
            cartMessage,
            "Product removed from cart.",
            "green"
        );
    }

    // Edit existing product
    function editProduct(productId) {
        const product = products.find(function (p) {
            return p.productId === productId;
        });

        if (!product) return;

        document.getElementById("productId").value = product.productId;
        document.getElementById("description").value = product.description;
        document.getElementById("category").value = product.category;
        document.getElementById("unitOfMeasure").value = product.unitOfMeasure;
        document.getElementById("price").value = product.price;

        editingId = productId;
        saveButton.textContent = "Update Product";

        showMessage(
            formMessage,
            "Editing " + product.description,
            "blue"
        );

        productForm.scrollIntoView();
    }

    // Clear product form
    function clearForm() {
        productForm.reset();
        editingId = null;

        saveButton.textContent = "Save Product";
        formMessage.textContent = "";
    }

    document.getElementById("clearButton")
        .addEventListener("click", clearForm);

    // Handle product form submission
    productForm.noValidate = true;

    productForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const id = document.getElementById("productId").value.trim();
        const description = document.getElementById("description").value.trim();
        const category = document.getElementById("category").value;
        const unit = document.getElementById("unitOfMeasure").value;
        const priceText = document.getElementById("price").value.trim();
        const price = Number(priceText);

        // Validate required fields
        if (
            id === "" ||
            description === "" ||
            category === "" ||
            unit === "" ||
            !/^\d+(\.\d{1,2})?$/.test(priceText) ||
            !Number.isFinite(price)
        ) {
            showMessage(
                formMessage,
                "Please complete all fields with a valid price.",
                "red"
            );
            return;
        }

        // Create product JSON object
        const product = {
            productId: id,
            description: description,
            category: category,
            unitOfMeasure: unit,
            price: price
        };

        // Check for duplicate product IDs
        const duplicate = products.find(function (p) {
            return p.productId === id && p.productId !== editingId;
        });

        if (duplicate) {
            showMessage(
                formMessage,
                "That Product ID already exists.",
                "red"
            );
            return;
        }

        let successMessage;

        if (editingId !== null) {
            // Update existing product
            const index = products.findIndex(function (p) {
                return p.productId === editingId;
            });

            if (index === -1) {
                showMessage(formMessage, "Product not found.", "red");
                return;
            }

            products[index] = product;

            // Update product ID in cart if changed
            cart.forEach(function (item) {
                if (item.productId === editingId) {
                    item.productId = id;
                }
            });

            saveCart();
            successMessage = "Product updated successfully.";

        } else {
            // Add new product
            products.push(product);
            successMessage = "Product added successfully.";
        }

        saveProducts();
        clearForm();
        displayProducts();
        displayCart();

        showMessage(formMessage, successMessage, "green");
    });

    // Prepare shopping cart information as JSON
    function prepareCartJSON() {
        const cartProducts = cart.map(function (item) {
            const product = products.find(function (p) {
                return p.productId === item.productId;
            });

            if (!product) return null;

            return {
                productId: product.productId,
                description: product.description,
                category: product.category,
                unitOfMeasure: product.unitOfMeasure,
                price: Number(product.price),
                quantity: item.quantity,
                subtotal: Number(
                    (Number(product.price) * item.quantity).toFixed(2)
                )
            };
        }).filter(Boolean);

        const total = cartProducts.reduce(function (sum, item) {
            return sum + item.subtotal;
        }, 0);

        return {
            products: cartProducts,
            total: Number(total.toFixed(2))
        };
    }

    // Prepare Cart Data button
    document.getElementById("sendCartButton")
        .addEventListener("click", function () {

            const cartData = prepareCartJSON();

            if (cartData.products.length === 0) {
                showMessage(
                    apiMessage,
                    "Your cart is empty. Add products first.",
                    "red"
                );
                return;
            }

            const jsonData = JSON.stringify(cartData, null, 2);

            // Display JSON on the page
            let jsonPreview = document.getElementById("cartJsonPreview");

            if (!jsonPreview) {
                jsonPreview = document.createElement("pre");
                jsonPreview.id = "cartJsonPreview";
                jsonPreview.className = "border rounded p-3 mt-2";
                jsonPreview.style.whiteSpace = "pre-wrap";

                apiMessage.insertAdjacentElement("afterend", jsonPreview);
            }

            jsonPreview.textContent = jsonData;

            showMessage(
                apiMessage,
                "Cart JSON prepared successfully.",
                "green"
            );
        });

    // Allow separate jQuery file to use these functions
    window.cartApp = {
        getProducts: function () {
            return products.slice();
        },
        searchProducts: displayProducts,
        addToCart: addToCart
    };

    // Initialize shopping cart
    loadProducts();
    loadCart();
    displayProducts();
    displayCart();

});
