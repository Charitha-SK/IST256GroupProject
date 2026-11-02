$(function () {
    const $form = $("#publicationForm");
    const $jsonSection = $("#publicationJsonSection");
    const $jsonOutput = $("#publicationJsonOutput");

    if ($form.length === 0) return;

    $form.on("submit", function () {
        const publicationOptions = {
            articleTitle: $("#articleTitle").val().trim(),
            articleDescription: $("#articleDescription").val().trim(),
            publicationDate: $("#publicationDate").val(),
            distributionChannels: $('input[name="channels"]:checked')
                .map(function () {
                    return this.value;
                })
                .get(),
            reviewStatus: $("#reviewStatus").val(),
            editorialNotes: $("#editorialNotes").val().trim()
        };

        const jsonDocument = JSON.stringify(publicationOptions, null, 2);
        $jsonOutput.text(jsonDocument);
        $jsonSection.prop("hidden", false);

        $form.trigger("publicationReady", [publicationOptions, jsonDocument]);
    });

    $form.on("reset", function () {
        $jsonOutput.text("");
        $jsonSection.prop("hidden", true);
    });
});
