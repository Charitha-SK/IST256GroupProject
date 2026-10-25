
// catalog.js - Daily Digest Catalog (JavaScript + jQuery)

$(function () {
    const $productForm = $("#productForm");
    const $productTableBody = $("#productTableBody");
    const $formMessage = $("#formMessage");
    const $saveButton = $("#saveButton");

    let products = [];
    let editingId = null;

    // Load products from localStorage or products.json
    function loadProducts() {
        const saved = localStorage.getItem("dailyDigestProducts");

        if (saved !== null) {
            try {
                const parsed = JSON.parse(saved);

                if (Array.isArray(parsed)) {
                    products = parsed;
                    showProducts();
                    return;
                }
            } catch (err) {
                console.log("Could not load saved products.", err);
            }
        }

        // jQuery AJAX: load products from JSON
        $.getJSON("products.json", function (data) {
            products = data.products;
            showProducts();
        }).fail(function () {
            showMessage("Could not load products.json.", "red");
        });
    }

    // Save products in localStorage
    function saveProducts() {
        localStorage.setItem(
            "dailyDigestProducts",
            JSON.stringify(products)
        );
        showProducts();
    }

    // Display messages using jQuery
    function showMessage(message, color) {
        $formMessage.text(message).css("color", color);
    }

    // Display products in the table using jQuery
    function showProducts() {
        $productTableBody.empty();

        $.each(products, function (index, product) {
            const $row = $("<tr>");

            const values = [
                product.productId,
                product.description,
                product.category,
                product.unitOfMeasure,
                "$" + Number(product.price).toFixed(2)
            ];

            $.each(values, function (index, value) {
                $row.append($("<td>").text(value));
            });

            // Edit button
            const $editButton = $("<button>")
                .attr("type", "button")
                .addClass("btn btn-sm btn-secondary me-2")
                .text("Edit")
                .on("click", function () {
                    editProduct(product.productId);
                });

            // Delete button
            const $deleteButton = $("<button>")
                .attr("type", "button")
                .addClass("btn btn-sm btn-danger")
                .text("Delete")
                .on("click", function () {
                    deleteProduct(product.productId);
                });

            $row.append(
                $("<td>").append($editButton, $deleteButton)
            );

            $productTableBody.append($row);
        });

        // Reapply search filter after updating table
        $("#searchInput").trigger("input");
    }

    // Edit an existing product
    function editProduct(id) {
        const product = products.find(function (p) {
            return p.productId === id;
        });

        if (!product) return;

        // jQuery fills the form fields
        $("#productId").val(product.productId);
        $("#description").val(product.description);
        $("#category").val(product.category);
        $("#unitOfMeasure").val(product.unitOfMeasure);
        $("#price").val(product.price);

        editingId = id;

        $saveButton.text("Update Product");

        showMessage(
            "Editing " + product.description,
            "#1d5563"
        );

        $productForm[0].scrollIntoView();
    }

    // Delete a product
    function deleteProduct(id) {
        products = products.filter(function (product) {
            return product.productId !== id;
        });

        if (editingId === id) {
            clearForm();
        }

        saveProducts();

        showMessage(
            "Product deleted successfully.",
            "green"
        );
    }

    // Clear the product form
    function clearForm() {
        $productForm[0].reset();

        editingId = null;

        $saveButton.text("Save Product");
        $formMessage.text("");
    }

    // Add or update products using jQuery
    $productForm.on("submit", function (event) {
        event.preventDefault();

        // Retrieve form values using jQuery
        const id = $("#productId").val().trim();
        const description = $("#description").val().trim();
        const category = $("#category").val();
        const unit = $("#unitOfMeasure").val();
        const priceInput = $("#price").val().trim();
        const price = Number(priceInput);

        // Validate user input
        if (
            id === "" ||
            description === "" ||
            category === "" ||
            unit === "" ||
            priceInput === "" ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            showMessage(
                "Please complete all fields with a valid price.",
                "red"
            );
            return;
        }

        const product = {
            productId: id,
            description: description,
            category: category,
            unitOfMeasure: unit,
            price: price
        };

        // Check for duplicate product IDs
        const sameId = products.findIndex(function (p) {
            return p.productId === id;
        });

        let successMessage;

        if (editingId !== null) {
            // Update existing product
            const index = products.findIndex(function (p) {
                return p.productId === editingId;
            });

            if (sameId !== -1 && id !== editingId) {
                showMessage(
                    "That Product ID already exists.",
                    "red"
                );
                return;
            }

            if (index === -1) {
                showMessage(
                    "Product no longer exists.",
                    "red"
                );
                return;
            }

            products[index] = product;
            successMessage = "Product updated successfully.";

        } else {
            // Add new product
            if (sameId !== -1) {
                showMessage(
                    "That Product ID already exists.",
                    "red"
                );
                return;
            }

            products.push(product);
            successMessage = "Product added successfully.";
        }

        saveProducts();
        clearForm();

        showMessage(successMessage, "green");
    });

    // Clear button using jQuery
    $("#clearButton").on("click", clearForm);

    // Live search and filtering using jQuery
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

    // Initialize the catalog
    loadProducts();
});
