$(document).ready(function() {
    console.log("Document is ready");

    $("#formSelector").change(function() {
        var formType = $(this).val();
        if (formType === "certificate") {
            $("#diplomaForm").hide();
            $("#certificateForm").show();
            $("#associatesForm").hide();
            $("#associateTypes").hide();
            $("#diplomaTypes").hide();
            $("#certificateCourses").show();
        } else if (formType === "associates") {
            $("#diplomaForm").hide();
            $("#certificateForm").hide();
            $("#associatesForm").show();
            $("#associateTypes").show();
            $("#diplomaTypes").hide();
            $("#certificateCourses").hide();
        } else if (formType === "diploma") {
            $("#diplomaForm").show();
            $("#certificateForm").hide();
            $("#associatesForm").hide();
            $("#associateTypes").hide();
            $("#diplomaTypes").show();
            $("#certificateCourses").hide();
        }
    });


});
