
// catalog.js - Daily Digest Catalog (JavaScript + jQuery)

$(function () {
    const $productForm = $("#productForm");
    const $productTableBody = $("#productTableBody");
    const $formMessage = $("#formMessage");
    const $saveButton = $("#saveButton");

    let products = [];
    let editingId = null;

    // Load products from the MongoDB database using the API
    async function loadProducts() {
        try {
            const response = await fetch("/api/products");

            if (!response.ok) {
                throw new Error("Could not load products.");
            }

            const data = await response.json();

            products = data.products;
            showProducts();

            return true;

        } catch (error) {
            showMessage("Could not load products from the database.", "red");
            console.error(error);
            return false;
        }
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

    // Delete a product from the MongoDB database
    async function deleteProduct(id) {
        try {
            const response = await fetch(
                "/api/products/" + encodeURIComponent(id),
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                throw new Error("Could not delete product.");
            }

            products = products.filter(function (product) {
                return product.productId !== id;
            });

            if (editingId === id) {
                clearForm();
            }

            showProducts();

            showMessage(
                "Product deleted successfully.",
                "green"
            );

        } catch (error) {
            showMessage("Could not delete product from the database.", "red");
            console.error(error);
        }
    }

    // Clear the product form
    function clearForm() {
        $productForm[0].reset();

        editingId = null;

        $saveButton.text("Save Product");
        $formMessage.text("");
    }

    // Add or update products using the API
    $productForm.on("submit", async function (event) {
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
            showMessage("Please complete all fields with a valid price.", "red");
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

        if (editingId !== null) {
            if (sameId !== -1 && id !== editingId) {
                showMessage("That Product ID already exists.", "red");
                return;
            }
        } else if (sameId !== -1) {
            showMessage("That Product ID already exists.", "red");
            return;
        }

        const wasEditing = editingId !== null;
        const originalId = editingId;

        try {
            let response;

            if (wasEditing) {
                // Update existing product in MongoDB
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
                // Add new product to MongoDB
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

            const loaded = await loadProducts();

            if (loaded) {
                showMessage(
                    wasEditing
                        ? "Product updated successfully."
                        : "Product added successfully.",
                    "green"
                );
            } else {
                showMessage(
                    "Product saved, but the catalog could not refresh.",
                    "red"
                );
            }

        } catch (error) {
            showMessage("Could not save product to the database.", "red");
            console.error(error);
        }
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
