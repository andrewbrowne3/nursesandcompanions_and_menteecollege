var _____WB$wombat$assign$function_____ = function(name) {return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name)) || self[name]; };
if (!self.__WB_pmw) { self.__WB_pmw = function(obj) { this.__WB_source = obj; return this; } }
{
  let window = _____WB$wombat$assign$function_____("window");
  let self = _____WB$wombat$assign$function_____("self");
  let document = _____WB$wombat$assign$function_____("document");
  let location = _____WB$wombat$assign$function_____("location");
  let top = _____WB$wombat$assign$function_____("top");
  let parent = _____WB$wombat$assign$function_____("parent");
  let frames = _____WB$wombat$assign$function_____("frames");
  let opener = _____WB$wombat$assign$function_____("opener");

/*------------------------------------------
 Contact form
 ------------------------------------------*/

$(document).ready(function () {

    $("#contactForm").submit(function(e){

        e.preventDefault();
        var $ = jQuery;

        var postData 		= $(this).serializeArray(),
            formURL 		= $(this).attr("action"),
            $cfResponse 	= $('#contactFormResponse'),
            $cfsubmit 		= $("#cfsubmit"),
            cfsubmitText 	= $cfsubmit.text();

        $cfsubmit.text("Sending...");


        $.ajax(
            {
                url : formURL,
                type: "POST",
                data : postData,
                success:function(data)
                {
                    $cfResponse.html(data);
                    $cfsubmit.text(cfsubmitText);
                    $("#contactForm")[0].reset();
                },
                error: function(data)
                {
                    alert("Error occurd! Please try again");
                    $cfsubmit.text(cfsubmitText);
                }
            });

        return false;

    });



});



/*------------------------------------------
 Appointment form
 ------------------------------------------*/


$(document).ready(function () {

    $("#appointment_form").submit(function(e){

        e.preventDefault();
        var $ = jQuery;

        var postData        = $(this).serializeArray(),
            formURL         = $(this).attr("action"),
            $cfResponse     = $('#AppointmentFormResponse'),
            $afsubmit       = $("#afsubmit"),
            afsubmitText    = $afsubmit.text();

        $afsubmit.text("Sending...");


        $.ajax(
            {
                url : formURL,
                type: "POST",
                data : postData,
                success:function(data)
                {
                    $cfResponse.html(data);
                    $afsubmit.text(afsubmitText);
                    $("#appointment_form")[0].reset();
                },
                error: function(data)
                {
                    alert("Error occurd! Please try again");
                    $afsubmit.text(afsubmitText);
                }
            });
        return true;

    });


});


/*-------------------------------------------------
Dropdown Menu On Hover
--------------------------------------------------*/



}
/*
     FILE ARCHIVED ON 01:10:18 Feb 14, 2020 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 12:02:02 Jan 14, 2024.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 145.736
  exclusion.robots: 0.095
  exclusion.robots.policy: 0.085
  cdx.remote: 0.057
  esindex: 0.009
  LoadShardBlock: 89.941 (3)
  PetaboxLoader3.datanode: 722.742 (4)
  load_resource: 744.421
  PetaboxLoader3.resolve: 70.952
*/