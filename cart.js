
// cart.js - Daily Digest Shopping Cart

document.addEventListener("DOMContentLoaded", function () {

    let products = [];
    let cart = [];
    let editingId = "";

    // Load products from the MongoDB database
    async function loadProducts() {
        try {
            const response = await fetch("/api/products");

            if (!response.ok) {
                throw new Error("Could not load products.");
            }

            const data = await response.json();

            products = data.products || [];
            showProducts($("#searchInput").val() || "");

            return true;

        } catch (error) {
            document.getElementById("formMessage").textContent =
                "Could not load products from the database.";

            console.error(error);
            return false;
        }
    }

    // Load shopping cart from the MongoDB database
    async function loadCart() {
        try {
            const response = await fetch("/api/cart");

            if (!response.ok) {
                throw new Error("Could not load cart.");
            }

            const data = await response.json();

            cart = data.cart || [];
            showCart();

            return true;

        } catch (error) {
            document.getElementById("cartMessage").textContent =
                "Could not load shopping cart from the database.";

            console.error(error);
            return false;
        }
    }

    // Display available products
    function showProducts(search) {
        let results = document.getElementById("productResults");
        results.innerHTML = "";

        if (!search) {
            search = "";
        }

        let matches = 0;

        for (let i = 0; i < products.length; i++) {
            let p = products[i];

            let text = (
                p.productId + p.description + p.category
            ).toLowerCase();

            if (text.includes(search.toLowerCase())) {
                matches++;

                let div = document.createElement("div");
                div.className = "border rounded p-3 mb-2";

                let info = document.createElement("p");
                info.textContent =
                    p.description + " - $" + Number(p.price).toFixed(2);

                let addButton = document.createElement("button");
                addButton.textContent = "Add to Cart";
                addButton.className = "btn btn-primary me-2";

                addButton.onclick = function () {
                    addToCart(p.productId);
                };

                let editButton = document.createElement("button");
                editButton.textContent = "Edit";
                editButton.className = "btn btn-secondary";

                editButton.onclick = function () {
                    editProduct(p.productId);
                };

                div.appendChild(info);
                div.appendChild(addButton);
                div.appendChild(editButton);

                results.appendChild(div);
            }
        }

        document.getElementById("searchMessage").textContent =
            matches === 0 ? "No matching products found." : "";
    }

    // Add a product to the shopping cart in MongoDB
    async function addToCart(id) {
        try {
            const response = await fetch("/api/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    productId: id
                })
            });

            if (!response.ok) {
                throw new Error("Could not add product to cart.");
            }

            await loadCart();

            document.getElementById("cartMessage").textContent =
                "Product added to cart!";

        } catch (error) {
            document.getElementById("cartMessage").textContent =
                "Could not add product to cart.";

            console.error(error);
        }
    }

    // Display shopping cart
    function showCart() {
        let table = document.getElementById("cartTableBody");
        table.innerHTML = "";

        let total = 0;

        for (let i = 0; i < cart.length; i++) {
            const item = cart[i];

            const p = products.find(function (product) {
                return product.productId === item.productId;
            });

            let row = document.createElement("tr");

            let values = [
                item.productId,
                p ? p.description : "Product unavailable",
                p ? p.category : "",
                p ? p.unitOfMeasure : "",
                p ? "$" + Number(p.price).toFixed(2) : ""
            ];

            for (let k = 0; k < values.length; k++) {
                let cell = row.insertCell();
                cell.textContent = values[k];
            }

            // Quantity input
            let quantity = document.createElement("input");
            quantity.type = "number";
            quantity.min = "1";
            quantity.step = "1";
            quantity.value = item.quantity;
            quantity.className = "form-control";

            quantity.onchange = function () {
                let number = Number(quantity.value);

                if (
                    number < 1 ||
                    number % 1 !== 0 ||
                    quantity.value === ""
                ) {
                    document.getElementById("cartMessage").textContent =
                        "Please enter a valid quantity.";

                    showCart();
                } else {
                    updateCartQuantity(item.productId, number);
                }
            };

            row.insertCell().appendChild(quantity);

            // Remove button
            let removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.className = "btn btn-danger btn-sm";

            removeButton.onclick = function () {
                removeFromCart(item.productId);
            };

            row.insertCell().appendChild(removeButton);

            table.appendChild(row);

            if (p) {
                total = total + (Number(p.price) * item.quantity);
            }
        }

        document.getElementById("cartTotal").textContent =
            total.toFixed(2);
    }

    // Update cart quantity in MongoDB
    async function updateCartQuantity(id, quantity) {
        try {
            const response = await fetch(
                "/api/cart/" + encodeURIComponent(id),
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        quantity: quantity
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Could not update cart quantity.");
            }

            await loadCart();

            document.getElementById("cartMessage").textContent =
                "Cart quantity updated successfully!";

        } catch (error) {
            document.getElementById("cartMessage").textContent =
                "Could not update cart quantity.";

            console.error(error);
        }
    }

    // Remove a product from the MongoDB shopping cart
    async function removeFromCart(id) {
        try {
            const response = await fetch(
                "/api/cart/" + encodeURIComponent(id),
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                throw new Error("Could not remove product from cart.");
            }

            await loadCart();

            document.getElementById("cartMessage").textContent =
                "Product removed from cart!";

        } catch (error) {
            document.getElementById("cartMessage").textContent =
                "Could not remove product from cart.";

            console.error(error);
        }
    }

    // Edit product information
    function editProduct(id) {
        for (let i = 0; i < products.length; i++) {
            if (products[i].productId === id) {
                let p = products[i];

                document.getElementById("productId").value = p.productId;
                document.getElementById("description").value = p.description;
                document.getElementById("category").value = p.category;
                document.getElementById("unitOfMeasure").value =
                    p.unitOfMeasure;
                document.getElementById("price").value = p.price;

                editingId = id;

                document.getElementById("saveButton").textContent =
                    "Update Product";

                break;
            }
        }
    }

    // Clear product form
    function clearForm() {
        document.getElementById("productForm").reset();

        document.getElementById("saveButton").textContent =
            "Save Product";

        editingId = "";
    }

    document.getElementById("clearButton").onclick = clearForm;

    // Validate and save product information
    let form = document.getElementById("productForm");
    form.noValidate = true;

    form.onsubmit = async function (event) {
        event.preventDefault();

        let id = document.getElementById("productId").value.trim();
        let description =
            document.getElementById("description").value.trim();
        let category = document.getElementById("category").value;
        let unit = document.getElementById("unitOfMeasure").value;
        let priceText = document.getElementById("price").value;
        let price = Number(priceText);

        let message = document.getElementById("formMessage");

        if (
            id === "" ||
            description === "" ||
            category === "" ||
            unit === "" ||
            priceText === "" ||
            !Number.isFinite(price) ||
            price < 0 ||
            (priceText.split(".")[1] &&
                priceText.split(".")[1].length > 2)
        ) {
            message.textContent =
                "Please enter valid product information.";
            return;
        }

        // Prevent duplicate product IDs
        for (let i = 0; i < products.length; i++) {
            if (products[i].productId === id && id !== editingId) {
                message.textContent = "Product ID already exists.";
                return;
            }
        }

        // Keep the original product ID when editing
        if (editingId !== "" && id !== editingId) {
            message.textContent =
                "Product ID cannot be changed when editing.";
            return;
        }

        let product = {
            productId: id,
            description: description,
            category: category,
            unitOfMeasure: unit,
            price: price
        };

        const wasEditing = editingId !== "";
        const originalId = editingId;

        try {
            let response;

            if (wasEditing) {
                // Update product in MongoDB
                response = await fetch(
                    "/api/products/" + encodeURIComponent(originalId),
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(product)
                    }
                );
            } else {
                // Add product to MongoDB
                response = await fetch("/api/products", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(product)
                });
            }

            if (!response.ok) {
                throw new Error("Could not save product.");
            }

            clearForm();

            await loadProducts();

            message.textContent = wasEditing
                ? "Product updated successfully!"
                : "Product added successfully!";

        } catch (error) {
            message.textContent =
                "Could not save product to the database.";

            console.error(error);
        }
    };

    // Prepare cart information as JSON
    document.getElementById("sendCartButton").onclick = function () {
        let items = [];

        for (let i = 0; i < cart.length; i++) {
            for (let j = 0; j < products.length; j++) {
                if (cart[i].productId === products[j].productId) {
                    let p = products[j];

                    items.push({
                        productId: p.productId,
                        description: p.description,
                        category: p.category,
                        unitOfMeasure: p.unitOfMeasure,
                        price: Number(p.price),
                        quantity: cart[i].quantity
                    });
                }
            }
        }

        let message = document.getElementById("apiMessage");

        if (items.length === 0) {
            message.textContent = "Your cart is empty.";
            return;
        }

        let preview = document.getElementById("cartJsonPreview");

        if (preview === null) {
            preview = document.createElement("pre");
            preview.id = "cartJsonPreview";
            message.after(preview);
        }

        let cartData = {
            products: items,
            total: Number(
                document.getElementById("cartTotal").textContent
            )
        };

        preview.textContent = JSON.stringify(cartData, null, 2);

        message.textContent = "Cart JSON prepared successfully!";
    };

    // Allow separate jQuery file to access products
    window.cartApp = {
        getProducts: function () {
            return products;
        },
        searchProducts: showProducts,
        addToCart: addToCart
    };

    // Search products using jQuery
    $("#searchInput").on("input", function () {
        const search = $(this).val().trim().toLowerCase();
        showProducts(search);
    });

    // Load products and cart when page opens
    async function initializeCart() {
        const productsLoaded = await loadProducts();

        if (productsLoaded) {
            await loadCart();
        }
    }

    initializeCart();

});
