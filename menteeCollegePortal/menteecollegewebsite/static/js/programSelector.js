$(document).ready(function() {
    console.log("Document is ready");

    function populateCourseSections(selectedProgramType, selectedProgram) {
        if (selectedProgram !== "") {
            var url;

            if (selectedProgramType === "diploma") {
                url = '/get_diploma_program_course_sections/' + selectedProgram;
            } else if (selectedProgramType === "associates") {
                url = '/get_associates_program_course_sections/' + selectedProgram;
            } else if (selectedProgramType === "certificate") {
                url = '/get_certificate_course_sections/' + selectedProgram;
            }

            $.ajax({
                url: url, 
                success: function(data) {
                    console.log("Success: Received course sections:", data);
                    var options = "";
                    for (var i = 0; i < data.length; i++) {
                        var courseNameAndSchedule = data[i].name + " (" + data[i].schedule + ")";
                        options += "<option value='" + data[i].id + "'>" + courseNameAndSchedule + "</option>";
                    }
                    $("#courseSectionSelect").html(options);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("Error: ", textStatus, errorThrown);
                }
            });
        } else {
            $("#courseSectionSelect").html("<option value=''>---------</option>");
        }
    }

    $("#programTypeSelector").change(function() {
        var selectedProgramType = $(this).val();
        if (selectedProgramType !== "") {
            $.ajax({
                url: '/get_programs_for_type/',
                data: {
                    'programType': selectedProgramType
                },
                success: function(data) {
                    console.log("Success: Received programs:", data);
                    var options = "";
                    for (var i = 0; i < data.programs.length; i++) {
                        options += "<option value='" + data.programs[i].id + "'>" + data.programs[i].name + "</option>";
                    }
                    $("#programSelector").html(options);
                    $("#courseSectionSelect").html("<option value=''>---------</option>");
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("Error: ", textStatus, errorThrown);
                }
            });
        } else {
            $("#programSelector").html("<option value=''>---------</option>");
            $("#courseSectionSelect").html("<option value=''>---------</option>");
        }
    });

    $("#programSelector").change(function() {
        var selectedProgramType = $("#programTypeSelector").val();
        var selectedProgram = $(this).val();
        populateCourseSections(selectedProgramType, selectedProgram);
    });
});
