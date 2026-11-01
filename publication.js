 $(function () {
     const $form = $("#publicationForm");

     if ($form.length === 0) return;

     $form.attr("novalidate", "novalidate");

     // Create the message area
     const $message = $("<div>")
         .attr("id", "publicationMessage")
         .addClass("alert d-none mt-3")
         .insertAfter($form);

     // Set the earliest publication date to today
     const now = new Date();
     const year = now.getFullYear();
     const month = String(now.getMonth() + 1).padStart(2, "0");
     const day = String(now.getDate()).padStart(2, "0");
     const today = year + "-" + month + "-" + day;

     $("#publicationDate").attr("min", today);

     // Display success and error messages
     function showMessage(message, isValid) {
         $message.removeClass("d-none alert-success alert-danger");
         $message.addClass(isValid ? "alert-success" : "alert-danger");
         $message.text(message);
     }

     // Validate
     window.validatePublicationForm = function () {
         $form.find(".is-invalid").removeClass("is-invalid");

         const errors = [];

         if ($("#articleTitle").val().trim() === "") {
             errors.push("Enter an article title.");
             $("#articleTitle").addClass("is-invalid");
         }

         if ($("#articleDescription").val().trim() === "") {
             errors.push("Enter an article description.");
             $("#articleDescription").addClass("is-invalid");
         }

         const date = $("#publicationDate").val();

         if (date === "" || date < today) {
             errors.push("Choose a valid publication date.");
             $("#publicationDate").addClass("is-invalid");
         }

         if ($('input[name="channels"]:checked').length === 0) {
             errors.push("Select at least one distribution channel.");
             $('input[name="channels"]').addClass("is-invalid");
         }

         if ($("#reviewStatus").val() === "") {
             errors.push("Choose a review status.");
             $("#reviewStatus").addClass("is-invalid");
         }

         if (errors.length > 0) {
             showMessage(errors.join(" "), false);
             return false;
         }

         showMessage("Publication options are valid!", true);
         return true;
     };

     // Check
     $form.on("submit", function (event) {
         event.preventDefault();

         if (!window.validatePublicationForm()) {
             event.stopImmediatePropagation();
         }
     });

     // Remove error messages when fields changed
     $form.on("input change", "input, textarea, select", function () {
         $(this).removeClass("is-invalid");

         if (this.name === "channels") {
             $('input[name="channels"]').removeClass("is-invalid");
         }

         $message.addClass("d-none").text("");
     });

     // Clear validation messages when form resets
     $form.on("reset", function () {
         $form.find(".is-invalid").removeClass("is-invalid");
         $message.addClass("d-none").text("");
     });
 });
