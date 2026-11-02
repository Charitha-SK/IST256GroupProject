
$(function () {

    var API_URL = "https://jsonplaceholder.typicode.com/posts";
    var TIMEOUT_MS = 10000;   // give up after 10 seconds

    var $form = $("#publicationForm");
    var $submit = $("#submitPublication");
    var $jsonOutput = $("#publicationJsonOutput");

    if ($form.length === 0) return;

    // Status line and server response, added under the JSON preview
    var $status = $("<p>")
        .attr({ id: "publicationApiMessage", role: "status" })
        .addClass("mt-3 mb-1");

    var $response = $("<pre>")
        .attr("id", "publicationApiResponse")
        .addClass("p-3 bg-light border rounded")
        .prop("hidden", true);

    $jsonOutput.after($status, $response);

    // Show a status message (uses Bootstrap text color classes)
    function showStatus(text, cssClass) {
        $status
            .removeClass("text-success text-danger text-info")
            .addClass(cssClass)
            .text(text);
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
            return "The server rejected the publication data (HTTP " + jqXHR.status + ").";
        }
        if (jqXHR.status === 404) {
            return "The publication API address was not found (HTTP 404).";
        }
        if (jqXHR.status >= 500) {
            return "The server had a problem (HTTP " + jqXHR.status + "). Please try again later.";
        }
        return "Request failed (HTTP " + jqXHR.status + " " + jqXHR.statusText + ").";
    }

    // POST the publication JSON document to the API
    function sendPublication(publicationOptions) {
        $submit.prop("disabled", true);   // prevent double submits
        $response.prop("hidden", true).text("");
        showStatus("Sending publication options to the server...", "text-info");

        $.ajax({
            url: API_URL,
            method: "POST",
            contentType: "application/json; charset=utf-8",
            headers: { "Accept": "application/json" },
            data: JSON.stringify(publicationOptions),
            timeout: TIMEOUT_MS
        })
        .done(function (data, textStatus, jqXHR) {
            showStatus("Publication options sent successfully (HTTP " + jqXHR.status + ").", "text-success");

            var text = (typeof data === "object" && data !== null)
                ? JSON.stringify(data, null, 2)
                : String(data || "(empty response)");

            $response.text("Server response:\n" + text).prop("hidden", false);
        })
        .fail(function (jqXHR, textStatus) {
            showStatus(errorText(jqXHR, textStatus), "text-danger");
        })
        .always(function () {
            $submit.prop("disabled", false);
        });
    }

    // publicationjson.js triggers this with (event, publicationOptions, jsonDocument)
    $form.on("publicationReady", function (event, publicationOptions) {
        sendPublication(publicationOptions);
    });

    // Clear the status and response when the form is cleared
    $form.on("reset", function () {
        $status.text("").removeClass("text-success text-danger text-info");
        $response.text("").prop("hidden", true);
    });

});