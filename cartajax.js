

$(function () {

    //fake api url
    var API_URL = "https://jsonplaceholder.typicode.com/posts";

    var TIMEOUT_MS = 10000;            // give up after 10 seconds
    var CLEAR_CART_ON_SUCCESS = false; // set to true to empty the cart after a successful send

    var $message = $("#apiMessage");
    var $button = $("#sendCartButton");

    // Show a status message (uses Bootstrap text color classes)
    function showStatus(text, cssClass) {
        $message
            .removeClass("text-success text-danger text-info")
            .addClass(cssClass)
            .text(text);
    }

    // Show the server's response under the cart JSON preview
    function showResponse(data) {
        var $out = $("#apiResponsePreview");

        if ($out.length === 0) {
            $out = $("<pre>").attr("id", "apiResponsePreview");
            var $preview = $("#cartJsonPreview");

            if ($preview.length > 0) {
                $preview.after($out);
            } else {
                $message.after($out);
            }
        }

        var text = (typeof data === "object" && data !== null)
            ? JSON.stringify(data, null, 2)
            : String(data || "(empty response)");

        $out.text("Server response:\n" + text);
    }

    // Turn an AJAX failure into a friendly message
    function errorText(jqXHR, textStatus) {
        if (textStatus === "timeout") {
            return "The server took too long to respond. Please try again.";
        }
        if (jqXHR.status === 0) {
            return "Could not reach the server. Check your connection or the API address.";
        }
        if (jqXHR.status === 400 || jqXHR.status === 422) {
            return "The server rejected the cart data (HTTP " + jqXHR.status + ").";
        }
        if (jqXHR.status === 404) {
            return "The cart API address was not found (HTTP 404).";
        }
        if (jqXHR.status >= 500) {
            return "The server had a problem (HTTP " + jqXHR.status + "). Please try again later.";
        }
        return "Request failed (HTTP " + jqXHR.status + " " + jqXHR.statusText + ").";
    }

    // POST the cart JSON document to the API
    function sendCart(cartData) {
        $button.prop("disabled", true);   // prevent double submits
        showStatus("Sending cart to the server...", "text-info");

        $.ajax({
            url: API_URL,
            method: "POST",
            contentType: "application/json; charset=utf-8",
            headers: { "Accept": "application/json" },
            data: JSON.stringify(cartData),
            timeout: TIMEOUT_MS
        })
        .done(function (response, textStatus, jqXHR) {
            showStatus("Cart sent successfully (HTTP " + jqXHR.status + ").", "text-success");
            showResponse(response);

            if (CLEAR_CART_ON_SUCCESS && window.cartApp) {
                window.cartApp.clearCart();
            }
        })
        .fail(function (jqXHR, textStatus) {
            showStatus(errorText(jqXHR, textStatus), "text-danger");
        })
        .always(function () {
            $button.prop("disabled", false);
        });

        document.dispatchEvent(new CustomEvent("cartReady", { detail: cartData }));
    }

    // cart.js fires "cartReady" (with the cart JSON) when the button is clicked
    $(document).on("cartReady", function (event) {
        sendCart(event.originalEvent.detail);
    });

});