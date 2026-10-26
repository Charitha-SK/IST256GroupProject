
// cart.js

document.addEventListener("DOMContentLoaded", function () {

    // Starting products
    let products = [
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

    let cart = [];
    let editingId = "";

    // Load saved data
    let savedProducts = localStorage.getItem("dailyDigestProducts");
    let savedCart = localStorage.getItem("dailyDigestCart");

    if (savedProducts !== null) {
        products = JSON.parse(savedProducts);
    }

    if (savedCart !== null) {
        cart = JSON.parse(savedCart);
    }

    // Save data in localStorage
    function saveData() {
        localStorage.setItem("dailyDigestProducts", JSON.stringify(products));
        localStorage.setItem("dailyDigestCart", JSON.stringify(cart));
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

            let text = (p.productId + p.description + p.category).toLowerCase();

            if (text.includes(search.toLowerCase())) {
                matches++;

                let div = document.createElement("div");
                div.className = "border rounded p-3 mb-2";

                let info = document.createElement("p");
                info.textContent = p.description + " - $" + p.price.toFixed(2);

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

    // Add a product to the shopping cart
    function addToCart(id) {
        let found = false;

        for (let i = 0; i < cart.length; i++) {
            if (cart[i].productId === id) {
                cart[i].quantity++;
                found = true;
                break;
            }
        }

        if (found === false) {
            cart.push({ productId: id, quantity: 1 });
        }

        saveData();
        showCart();

        document.getElementById("cartMessage").textContent =
            "Product added to cart!";
    }

    // Display shopping cart
    function showCart() {
        let table = document.getElementById("cartTableBody");
        table.innerHTML = "";

        let total = 0;

        for (let i = 0; i < cart.length; i++) {
            let item = cart[i];

            for (let j = 0; j < products.length; j++) {
                let p = products[j];

                if (item.productId === p.productId) {
                    let row = document.createElement("tr");

                    let values = [
                        p.productId,
                        p.description,
                        p.category,
                        p.unitOfMeasure,
                        "$" + p.price.toFixed(2)
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

                        if (number < 1 || number % 1 !== 0 || quantity.value === "") {
                            document.getElementById("cartMessage").textContent =
                                "Please enter a valid quantity.";
                            showCart();
                        } else {
                            item.quantity = number;
                            saveData();
                            showCart();
                        }
                    };

                    row.insertCell().appendChild(quantity);

                    // Remove button
                    let removeButton = document.createElement("button");
                    removeButton.textContent = "Remove";
                    removeButton.className = "btn btn-danger btn-sm";

                    removeButton.onclick = function () {
                        cart.splice(i, 1);
                        saveData();
                        showCart();

                        document.getElementById("cartMessage").textContent =
                            "Product removed from cart!";
                    };

                    row.insertCell().appendChild(removeButton);
                    table.appendChild(row);

                    total = total + (p.price * item.quantity);
                    break;
                }
            }
        }

        document.getElementById("cartTotal").textContent = total.toFixed(2);
    }

    // Edit product information
    function editProduct(id) {
        for (let i = 0; i < products.length; i++) {
            if (products[i].productId === id) {
                let p = products[i];

                document.getElementById("productId").value = p.productId;
                document.getElementById("description").value = p.description;
                document.getElementById("category").value = p.category;
                document.getElementById("unitOfMeasure").value = p.unitOfMeasure;
                document.getElementById("price").value = p.price;

                editingId = id;
                document.getElementById("saveButton").textContent = "Update Product";
                break;
            }
        }
    }

    // Clear product form
    function clearForm() {
        document.getElementById("productForm").reset();
        document.getElementById("saveButton").textContent = "Save Product";
        editingId = "";
    }

    document.getElementById("clearButton").onclick = clearForm;

    // Validate and save product information
    let form = document.getElementById("productForm");
    form.noValidate = true;

    form.onsubmit = function (event) {
        event.preventDefault();

        let id = document.getElementById("productId").value.trim();
        let description = document.getElementById("description").value.trim();
        let category = document.getElementById("category").value;
        let unit = document.getElementById("unitOfMeasure").value;
        let priceText = document.getElementById("price").value;
        let price = Number(priceText);

        let message = document.getElementById("formMessage");

        if (id === "" || description === "" || category === "" ||
            unit === "" || priceText === "" || isNaN(price) ||
            price < 0 || priceText.split(".")[1] && priceText.split(".")[1].length > 2) {
            message.textContent = "Please enter valid product information.";
            return;
        }

        // Prevent duplicate product IDs
        for (let i = 0; i < products.length; i++) {
            if (products[i].productId === id && id !== editingId) {
                message.textContent = "Product ID already exists.";
                return;
            }
        }

        let product = {
            productId: id,
            description: description,
            category: category,
            unitOfMeasure: unit,
            price: price
        };

        if (editingId !== "") {
            for (let i = 0; i < products.length; i++) {
                if (products[i].productId === editingId) {
                    products[i] = product;
                    break;
                }
            }

            // Update ID in cart if it changed
            for (let i = 0; i < cart.length; i++) {
                if (cart[i].productId === editingId) {
                    cart[i].productId = id;
                }
            }

            message.textContent = "Product updated successfully!";
        } else {
            products.push(product);
            message.textContent = "Product added successfully!";
        }

        saveData();
        showProducts();
        showCart();
        clearForm();
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
                        price: p.price,
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
            total: Number(document.getElementById("cartTotal").textContent)
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

    //search
    $("#searchInput").on("input", function () {
        const search = $(this).val().trim().toLowerCase();

        let matches = 0;

        $productTableBody.find("tr").each(function () {

            // Search the product information
            const rowText = $(this)
                .children("td")
                .slice(0, 5)
                .text()
                .toLowerCase();

            const isMatch = rowText.includes(search);

            // jQuery shows or hides matching rows
            $(this).toggle(isMatch);

            if (isMatch) {
                matches++;
            }
        });

        // Display message when no matches are found
        $("#searchMessage").text(
            search !== "" && matches === 0
                ? "No matching products found."
                : ""
        );
    });

    // Display products and cart when page opens
    showProducts();
    showCart();

});
