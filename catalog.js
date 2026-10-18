const productForm = document.getElementById("productForm");
const productTableBody = document.getElementById("productTableBody");
const formMessage = document.getElementById("formMessage");
const saveButton = document.getElementById("saveButton");

let products = [];
let editingId = null;

// Load products from JSON or localStorage
function loadProducts() {
    const saved = localStorage.getItem("dailyDigestProducts");

    if (saved !== null) {
        try {
            products = JSON.parse(saved);
            showProducts();
            return;
        } catch (err) {
            console.log("Could not load saved products.");
        }
    }

    $.getJSON("products.json", function(data) {
        products = data.products;
        showProducts();
    }).fail(function() {
        formMessage.style.color = "red";
        formMessage.textContent = "Could not load products.json.";
    });
}

// Save products in localStorage
function saveProducts() {
    localStorage.setItem("dailyDigestProducts", JSON.stringify(products));
    showProducts();
}

// Display products in table
function showProducts() {
    productTableBody.innerHTML = "";

    products.forEach(function(product) {
        const row = document.createElement("tr");

        const values = [
            product.productId,
            product.description,
            product.category,
            product.unitOfMeasure,
            "$" + Number(product.price).toFixed(2)
        ];

        values.forEach(function(value) {
            const td = document.createElement("td");
            td.textContent = value;
            row.appendChild(td);
        });

        // Edit button
        const actions = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "btn btn-sm btn-secondary me-2";
        editButton.type = "button";

        editButton.addEventListener("click", function() {
            editProduct(product.productId);
        });

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "btn btn-sm btn-danger";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function() {
            deleteProduct(product.productId);
        });

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        row.appendChild(actions);

        productTableBody.appendChild(row);
    });

    // Keep search results updated
    $("#searchInput").trigger("input");
}

// Edit product using jQuery
function editProduct(id) {
    const product = products.find(function(p) {
        return p.productId === id;
    });

    if (!product) {
        return;
    }

    $("#productId").val(product.productId);
    $("#description").val(product.description);
    $("#category").val(product.category);
    $("#unitOfMeasure").val(product.unitOfMeasure);
    $("#price").val(product.price);

    editingId = id;
    saveButton.textContent = "Update Product";

    formMessage.style.color = "#1d5563";
    formMessage.textContent = "Editing " + product.description;

    document.getElementById("productForm").scrollIntoView();
}

// Delete product
function deleteProduct(id) {
    products = products.filter(function(product) {
        return product.productId !== id;
    });

    if (editingId === id) {
        clearForm();
    }

    saveProducts();

    formMessage.style.color = "green";
    formMessage.textContent = "Product deleted successfully.";
}

// Clear form
function clearForm() {
    productForm.reset();
    editingId = null;
    saveButton.textContent = "Save Product";
    formMessage.textContent = "";
}

// Save or update product
productForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const id = document.getElementById("productId").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;
    const unit = document.getElementById("unitOfMeasure").value;
    const priceInput = document.getElementById("price").value.trim();
    const price = Number(priceInput);

    // Validation
    if (id === "" || description === "" || category === "" ||
        unit === "" || priceInput === "" || !Number.isFinite(price) ||
        price < 0) {

        formMessage.style.color = "red";
        formMessage.textContent = "Please complete all fields with a valid price.";
        return;
    }

    const product = {
        productId: id,
        description: description,
        category: category,
        unitOfMeasure: unit,
        price: price
    };

    const sameId = products.findIndex(function(p) {
        return p.productId === id;
    });

    if (editingId !== null) {

        const index = products.findIndex(function(p) {
            return p.productId === editingId;
        });

        if (sameId !== -1 && id !== editingId) {
            formMessage.style.color = "red";
            formMessage.textContent = "That Product ID already exists.";
            return;
        }

        if (index !== -1) {
            products[index] = product;
        } else {
            formMessage.style.color = "red";
            formMessage.textContent = "Product no longer exists.";
            return;
        }

        formMessage.style.color = "green";
        formMessage.textContent = "Product updated successfully.";

    } else {

        if (sameId !== -1) {
            formMessage.style.color = "red";
            formMessage.textContent = "That Product ID already exists.";
            return;
        }

        products.push(product);

        formMessage.style.color = "green";
        formMessage.textContent = "Product added successfully.";
    }

    saveProducts();
    productForm.reset();
    editingId = null;
    saveButton.textContent = "Save Product";
});

// Clear button
document.getElementById("clearButton").addEventListener("click", function() {
    clearForm();
});

// Search products using jQuery
$("#searchInput").on("input", function() {
    const search = $(this).val().toLowerCase();
    let matches = 0;

    $("#productTableBody tr").each(function() {
        const rowText = $(this).text().toLowerCase();

        if (rowText.includes(search)) {
            $(this).show();
            matches++;
        } else {
            $(this).hide();
        }
    });

    if (search !== "" && matches === 0) {
        $("#searchMessage").text("No matching products found.");
    } else {
        $("#searchMessage").text("");
    }
});

// Load products when page opens
loadProducts();
