<?php
//////////////////////////// COPYRIGHT NOTICE //////////////////////////////
// This script is part of BosDates, a software application by BosDev, Inc //
// Use of any kind of part or all of this script or modification of this  //
// script requires a license from BosDev, Inc. Use or modification of     //
// this script without a license constitutes Software Piracy and will     //
// result in legal action from BosDev, Inc.  All rights reserved.         //
//            http://www.bosdev.com      sales@bosdev.com                 //
//                                                                        //
//           BosDates Lite 3.0 Copyright 2003, BosDev, Inc.               //
////////////////////////////////////////////////////////////////////////////






///////////////////////////////////////////////////////
//                     NOTICE                        //
// Removal or alteration of the following code will  //
// result in a violation of the EULA.  You may opt   //
// to purchase removal rights at the following web   //
// address:                                          //
//          http://www.bosdev.com/order              //
//                                                   //
// We do make checks on installed licenses to ensure //
// our copyrights are preserved.                     //
///////////////////////////////////////////////////////















































echo<<<ENDPRINT
  </div>
  <div class="noprint">
   <br>
   <div id="copyright" align="center">
    Powered by <a href="http://www.bosdev.com/" target="_blank">BosDates Lite</a> <a href="http://www.bosdev.com/" target="_blank">Web Calendar</a><br>Copyright 2003 All Rights Reserved
   </div>
  </div>
   <br>
   <br>
ENDPRINT;

if(substr($SystemOptions['calendar_footer'],0,5) == "file:") {
	$fileToInclude = substr($SystemOptions['calendar_footer'],5);
	include("$fileToInclude");
	}
	else { echo stripslashes($SystemOptions['calendar_footer']); }

echo<<<ENDPRINT
 </body>
</html>
ENDPRINT;

?>
