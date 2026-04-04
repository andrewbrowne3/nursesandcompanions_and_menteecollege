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

if($userInfo['admPanel'] == 0) {
	header("Location: {$insUrl}calendar.php");
	die();
	}

switch($action) {
	case "events":
		//Set/format date
		if(!isset($month) || $month == "") { $month = date("m"); }
			else { $month = sprintf("%02s",$month); }
		if(!isset($year) || $year == "") { $year = date("Y"); }
			else { $year = sprintf("%04s",$year); }

		//Get list of events
		$eventsArray = array();
		$eventsRowsArray = array();
		$count = 0;
		$result = query("SELECT e.event_id,e.event_title,d.event_date,d.event_time_start,d.event_time_end FROM {$calendar_prefix}events e LEFT JOIN {$calendar_prefix}dates d ON e.event_id=d.event_id WHERE d.event_date LIKE '$year-$month%' GROUP BY e.event_id ORDER BY d.event_date",$cal_link);
		while(list($eventID,$eventTitle,$eventDate,$eventStart,$eventEnd) = mysql_fetch_row($result)) {
			$editLink = "<a href=\"{$insUrl}admin/index.php?action=eventsScreen&eventsSub=edit&eventID=$eventID&returnMonth=$month&returnYear=$year\">[{$Languages['admin']['eventsedit']}]</a>";
			$delLink = "<a href=\"{$insUrl}admin/index.php?action=eventDelete&eventID=$eventID&returnMonth=$month&returnYear=$year\">[{$Languages['admin']['eventsdelete']}]</a>";
			$eventTitle = stripslashes($eventTitle);
			$doy = date("z",strtotime("$eventDate"));
			$eventStart = formatTime($eventStart);
			$eventEnd = formatTime($eventEnd);
			if($eventStart != "00:00:00" && $eventEnd == "23:59:59") { $displayTime = "$eventStart"; }
			if($eventStart != "00:00:00" && $eventEnd != "23:59:59") { $displayTime = "$eventStart-$eventEnd"; }
			if($eventStart == "00:00:01" && $end == "23:59:59") { $displayTime = $Languages['admin']['eventsallday']; }
			if($eventsRowsArray[$doy]%2 != 0) { $class="class=\"alttd\""; }
				else { $class = ""; }

			$eventsRowsArray[$doy] = $eventsRowsArray[$doy] + 1;
			$eventsArray[$doy] .=<<<ENDPRINT
			<table width="100%" border="0" cellspacing="1" cellpadding="1" style="border:0px;">
			 <tr>
			  <td $class width="100%" valign="top">
			   <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:0px;">
			    <tr>
			     <td $class><a href="javascript:popUp('{$insUrl}event.php?event=$eventID&date=$eventDate&adminOverride=1','520','520');"><b>$eventTitle</b></a></td>
			    </tr>
			    <tr>
			     <td $class width="33%">{$Languages['admin']['eventstime']}:$displayTime</td>
			    </tr>
			   </table>
			  </td>
			  <td $class width="100" valign="center" align="center">
			   <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:0px;">
			    <tr>
			     <td $class align="center">$editLink</td>
			    </tr>
			    <tr>
			     <td $class align="center">$delLink</td>
			    </tr>
			   </table>
			  </td>
			 </tr>
			</table>
ENDPRINT;
			}

		$nod = date("t",strtotime("$year-$month-01"));
		$sdoy = date("z",strtotime("$year-$month-01"));
		$ldoy = date("z",strtotime("$year-$month-$nod"));

		$d = 1;
		for($i=$sdoy;$i<=$ldoy;$i++) {
			if($eventsArray[$i] != "") {
				$m = $Languages['global']['monthshort'][sprintf("%01d",$month)];
				$y = $year;
				$dateLine = ${$DateFormat[0]}."&nbsp;".${$DateFormat[1]}."&nbsp;".${$DateFormat[2]};
				$eventList .=<<<ENDPRINT
				<tr>
				 <td class="headtd" colspan="2">$dateLine - {$eventsRowsArray[$i]} {$Languages['admin']['eventsevents']} - <a class="menuLink" id="showHide{$i}" href="javascript:void(0);" onclick="showEvents($i);">[{$Languages['admin']['eventsshowhide']}]</a></td>
				</tr>
				<tr>
				 <td colspan="2">
			          <div id="doy{$i}" style="display:none;">{$eventsArray[$i]}</div>
				 </td>
				</tr>
ENDPRINT;
				}
			$d++;
			}

		if($eventList == "") {
			$eventList .=<<<ENDPRINT
			<tr>
			 <td colspan="2" align="center">
		          <br>
		          {$Languages['admin']['eventscurrentnone']}<br>
		          <br>
			 </td>
			</tr>
ENDPRINT;
			}

		//Build date box
		$result = query("SELECT event_date FROM {$calendar_prefix}dates ORDER BY event_date ASC LIMIT 1",$cal_link);
		list($fromDate) = mysql_fetch_row($result);
		$result = query("SELECT event_date FROM {$calendar_prefix}dates ORDER BY event_date DESC LIMIT 1",$cal_link);
		list($toDate) = mysql_fetch_row($result);
		if($fromDate == "") { $fromDate = date("Y-m-d"); }
		if($toDate == "") { $toDate = date("Y-m-d"); }
		$fromYear = substr($fromDate,0,4);
		$toYear = substr($toDate,0,4);
		for($i=1;$i<=12;$i++) {
			if(sprintf("%02s",$i) == $month) { $monthBox .= "<option value=\"$i\" selected>".$Languages['global']['monthshort'][$i]."</option>"; }
				else { $monthBox .= "<option value=\"$i\">".$Languages['global']['monthshort'][$i]."</option>"; }
			}
		for($i=$fromYear;$i<=$toYear;$i++) {
			if($i == $year) { $yearBox .= "<option value=\"$i\" selected>$i</option>"; }
				else { $yearBox .= "<option value=\"$i\">$i</option>"; }
			}

		$prevLink = "<a href=\"index.php?action=events&month=".date("m",mktime(1,1,1,$month - 1,1,$year))."&year=".date("Y",mktime(1,1,1,$month - 1,1,$year))."\">{$Languages['nav']['prevsyb']}</a>";
		$nextLink = "<a href=\"index.php?action=events&month=".date("m",mktime(1,1,1,$month + 1,1,$year))."&year=".date("Y",mktime(1,1,1,$month + 1,1,$year))."\">{$Languages['nav']['nextsyb']}</a>";
		$dateBox = "$prevLink <select name=\"month\">$monthBox</select><select name=\"year\">$yearBox</select><input type=\"submit\" value=\"{$Languages['nav']['go']}\"> $nextLink";

		$displayData =<<<ENDPRINT
		<script language="javascript">
		function showEvents(id){
			if (document.getElementById) {
				divObj = document.getElementById("doy" + id);
				}
			else if(document.all) {
				divObj = document.all("doy" + id);
				}
			else if (document.layers) {
				divObj = document.layers["doy" + id];
				}
			if(document.getElementById || document.all){
				if(divObj.style.display == "none") { divObj.style.display = "block"; }
					else { divObj.style.display = "none"; }
				}
			else if (document.layers) {
				if(divObj.visibility = "none") { divObj.visibility = "visible"; }
					else { divObj.visibility = "none"; }
				}
			currDivObj = divObj;
			}
		</script>
		<div id="generalBox">
		<table width="100%" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menuevents']}</td>
		 </tr>
		 <tr>
		  <td>
		   <table width="100%" border="0" cellspacing="0" cellpadding="3">
		   <form method="post" action="{$insUrl}admin/index.php" name="add">
		   <input type="hidden" name="action" value="eventsScreen">
		    <tr>
		     <td class="headtd">{$Languages['admin']['eventsadd']}</td>
		    </tr>
		    <tr>
		     <td>
		      {$Languages['admin']['eventsaddintro']}<br>
		      <input type="submit" value="{$Languages['admin']['process']}"><br>
		     </td>
		    </tr>
	           </form>
		   </table>
		   <br>
		   <table width="100%" border="0" cellspacing="0" cellpadding="3">
		   <form method="post" action="{$insUrl}admin/index.php">
		   <input type="hidden" name="action" value="events">
		   <input type="hidden" name="showCalendar" value="$showCalendar">
		    <tr>
		     <td class="headtd" colspan="2">{$Languages['admin']['eventscurrent']}</td>
		    </tr>
		    <tr>
		     <td colspan="2" align="center">
		      $dateBox<br>
		     </td>
		    </tr>
	            $eventList
	           </form>
		   </table>
		  </td>
		 </tr>
		</table>
		</div>
ENDPRINT;
		break;

	case "eventDelete":
		$eventID = intval(protect($eventID));

		$result = query("SELECT event_title FROM {$calendar_prefix}events WHERE event_id=$eventID",$cal_link);
		list($eventTitle) = mysql_fetch_row($result);
		$eventTitle = stripslashes($eventTitle);

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menuevents']}</td>
		 </tr>
		 <tr>
		  <td>
		   <table width="100%" border="0" cellspacing="0" cellpadding="3">
		   <form method="post" action="{$insUrl}admin/index.php" onReset="javascript:history.go(-1);">
		   <input type="hidden" name="action" value="eventDeleteProcess">
		   <input type="hidden" name="eventID" value="$eventID">
		   <input type="hidden" name="returnMonth" value="$returnMonth">
		   <input type="hidden" name="returnYear" value="$returnYear">
		    <tr>
		     <td class="headtd">{$Languages['admin']['eventsdeletehead']}</td>
		    </tr>
		    <tr>
		     <td>
		      <b>$eventTitle</b><br>
		      {$Languages['admin']['eventsdeleteintro']}<br>
		      <br>
		      <input type="reset" value="{$Languages['admin']['cancel']}"><input type="submit" value="{$Languages['admin']['process']}">
		     </td>
		    </tr>
	           </form>
		   </table>
		  </td>
		 </tr>
		</table>
		</div>
ENDPRINT;
		break;

	case "eventDeleteProcess":
		$eventID = intval(protect($eventID));
		$result = query("DELETE FROM {$calendar_prefix}dates WHERE event_id=$eventID",$cal_link);
		$result = query("DELETE FROM {$calendar_prefix}events WHERE event_id=$eventID",$cal_link);
		header("Location: {$insUrl}admin/index.php?action=events&month=$returnMonth&year=$returnYear");
		break;

	case "eventsScreen":
		//This screen is used for new events and editing an event

		//If editing, get the data
		if(isset($eventID)) {
			$eventID = intval(protect($eventID));
			if($eventID < 1) { die(); }
			$result = query("SELECT event_url,event_title,event_city,event_state,contact_name,contact_email,event_description,style_font_type,style_font_style,style_font_size,style_font_color FROM {$calendar_prefix}events WHERE event_id=$eventID",$cal_link);
			list($eventUrl,$eventTitle,$eventLocation1,$eventLocation2,$contactName,$contactEmail,$eventDescription,$styleFontType,$styleFontStyle,$styleFontSize,$styleFontColor) = mysql_fetch_row($result);

			if($eventTitle == "") { die(); }

			$eventTitle = toEdit($eventTitle);
			$eventLocation1 = toEdit($eventLocation1);
			$eventLocation2 = toEdit($eventLocation2);
			$contactName = toEdit($contactName);
			$contactEmail = toEdit($contactEmail);
			$eventDescription = toHtml($eventDescription);

			$result = query("SELECT event_date,event_time_start,event_time_end FROM {$calendar_prefix}dates WHERE event_id=$eventID ORDER BY event_date ASC LIMIT 1",$cal_link);
			list($eventDate,$eventStart,$eventEnd) = mysql_fetch_row($result);
			$result = query("SELECT event_date FROM {$calendar_prefix}dates WHERE event_id=$eventID ORDER BY event_date DESC LIMIT 1",$cal_link);
			list($eventEnds) = mysql_fetch_row($result);
			$numOfDays = (((strtotime($eventEnds) - strtotime($eventDate))/86400) + 1);
			}

		switch($eventsSub) {
			case "edit":
				$formExtras =<<<ENDPRINT
				<input type="hidden" name="action" value="eventEdit">
				<input type="hidden" name="eventID" value="$eventID">
ENDPRINT;
				break;
			default:
				$formExtras =<<<ENDPRINT
				<input type="hidden" name="action" value="eventProcess">
ENDPRINT;
				break;
			}

		if(isset($eventID)) {
			$dateParts = explode("-",$eventDate);
			$month = sprintf("%02d",$dateParts[1]);
			$day = sprintf("%02d",$dateParts[2]);
			$year = $dateParts[0];
			}
			else {
				$month = date("m",time());
				$day = date("d",time());
				$year = date("Y",time());
				}

		if(isset($eventID)) {
			for($i=1;$i<=14;$i++) {
				if($i == $numOfDays) { $numDaysBox .= "<option value=\"$i\" selected>$i</option>"; }
					else { $numDaysBox .= "<option value=\"$i\">$i</option>"; }
				}
			}
			else {
				$numDaysBox =<<<ENDPRINT
				<option value="1" selected>1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option>
ENDPRINT;
				}


		for($i = 1; $i <= 12; $i++) {
			if($i == $month) { $mData .= "<option value=\"$i\" selected>".$Languages['global']['monthshort'][date("n",mktime (01,01,01,$i,01,2000))]."</option>"; }
				else { $mData .= "<option value=\"$i\">".$Languages['global']['monthshort'][date("n",mktime (01,01,01,$i,01,2000))]."</option>"; }
			}
		$m = "<select id=\"eventMonth\" name=\"eventMonth\">$mData</select>";
		$m2 = "<select id=\"repeatMonth\" name=\"repeatMonth\">$mData</select>";

		for($i = 1; $i <= 31; $i++) {
			if($i == $day) { $dData .= "<option value=\"$i\" selected>$i</option>"; }
				else { $dData .= "<option value=\"$i\">$i</option>"; }
			}
		$d = "<select id=\"eventDay\" name=\"eventDay\">$dData</select>";
		$d2 = "<select id=\"repeatDay\" name=\"repeatDay\">$dData</select>";

		for($i = $year; $i <= $year + 5; $i++) {
			if($i == $year) { $yData .= "<option value=\"$i\" selected>$i</option>"; }
				else { $yData .= "<option value=\"$i\">$i</option>"; }
			}
		$y = "<select id=\"eventYear\" name=\"eventYear\">$yData</select>";
		$y2 = "<select id=\"repeatYear\" name=\"repeatYear\">$yData</select>";

		$dateBox = ${$DateFormat[0]}.${$DateFormat[1]}.${$DateFormat[2]};
		$dateBox2 = ${$DateFormat[0]."2"}.${$DateFormat[1]."2"}.${$DateFormat[2]."2"};

		if(isset($eventID)) {
			$startParts = explode(":",$eventStart);
			$endParts = explode(":",$eventEnd);
			}

		if($Languages['timeformat'] == "12") {
			for($i=1; $i<=24; $i++) {
				if($i > 12) { $ii = $i - 12; $iii = "pm";}
					else { $ii = $i; $iii = "am";}
				if($i == 12) { $iii = "noon"; }
				if($i == 24) { $iii = "midnight"; }

				if(isset($eventID)) {
					if($i == sprintf("%01d",$startParts[0])) {
						$startBox .= "<option value=\"".sprintf("%02s",$i)."\" selected>$ii $iii</option>";
						}
						else {
							$startBox .= "<option value=\"".sprintf("%02s",$i)."\">$ii $iii</option>";
							}
					}
					else {
						if($i == 8) { $startBox .= "<option value=\"".sprintf("%02s",$i)."\" selected>$ii $iii</option>"; }
							else {
								$startBox .= "<option value=\"".sprintf("%02s",$i)."\">$ii $iii</option>";
								}
						}
				}
			}
			else {
				for($i=0; $i <=23; $i++) {
					if(isset($eventID)) {
						if($i == sprintf("%01d",$startParts[0])) { $startBox .= "<option value=\"".sprintf("%02s",$i)."\" selected>".sprintf("%02s",$i)."</option>"; }
							else { $startBox .= "<option value=\"".sprintf("%02s",$i)."\">".sprintf("%02s",$i)."</option>"; }
						}
						else {
							if($i == 8) { $startBox .= "<option value=\"".sprintf("%02s",$i)."\" selected>".sprintf("%02s",$i)."</option>"; }
								else { $startBox .= "<option value=\"".sprintf("%02s",$i)."\">".sprintf("%02s",$i)."</option>"; }
							}
					}
				}

		if($Languages['timeformat'] == "12") {
			for($i=1; $i <=24; $i++) {
				if($i > 12) { $ii = $i - 12; $iii = "pm";}
				else { $ii = $i; $iii = "am";}
				if($i == 12) { $iii =  "noon"; }
				if($i == 24) { $iii = "midnight"; }

				if(isset($eventID)) {
					if(($i == sprintf("%01d",$endParts[0])) && ($eventEnd != "23:59:59")) { $endBox .= "<option value=\"".sprintf("%02s",$i)."\" selected>$ii $iii</option>"; }
						else {
							$endBox .= "<option value=\"".sprintf("%02s",$i)."\">$ii $iii</option>";
							}
					}
					else {
						if($i == 17) { $endBox .= "<option value=\"".sprintf("%02s",$i)."\" selected>$ii $iii</option>"; }
							else {
								$endBox .= "<option value=\"".sprintf("%02s",$i)."\">$ii $iii</option>";
								}
						}
				}
			}
			else {
				for($i=0; $i <=23; $i++) {
					if(isset($eventID)) {
						if($i == sprintf("%01d",$endParts[0])) { $endBox .= "<option value=\"".sprintf("%02s",$i)."\" selected>".sprintf("%02s",$i)."</option>"; }
							else { $endBox .= "<option value=\"".sprintf("%02s",$i)."\">".sprintf("%02s",$i)."</option>"; }
						}
						else {
							if($i == 17) { $endBox .= "<option value=\"".sprintf("%02s",$i)."\" selected>".sprintf("%02s",$i)."</option>"; }
								else { $endBox .= "<option value=\"".sprintf("%02s",$i)."\">".sprintf("%02s",$i)."</option>"; }
							}
					}
				}
		if(isset($eventID) && ($eventEnd == "23:59:59" && $startTime != "00:00:00")) {
			$endBox .= "<option value=\"0\" selected>{$Languages['admin']['eventsaddnoendtime']}</option>";
			}
			else {
				$endBox .= "<option value=\"0\">{$Languages['admin']['eventsaddnoendtime']}</option>";
				}

		for($i=0;$i<=55;$i=$i+5) {
			if(isset($eventID)) {
				if($i == sprintf("%01d",$startParts[1])) { $startMinuteBox .= "<option value=\"".sprintf("%02s",$i)."\" selected>".sprintf("%02s",$i)."</option>"; }
					else { $startMinuteBox .= "<option value=\"".sprintf("%02s",$i)."\">".sprintf("%02s",$i)."</option>"; }
				if($i == sprintf("%01d",$endParts[1])) { $endMinuteBox .= "<option value=\"".sprintf("%02s",$i)."\" selected>".sprintf("%02s",$i)."</option>"; }
					else { $endMinuteBox .= "<option value=\"".sprintf("%02s",$i)."\">".sprintf("%02s",$i)."</option>"; }
				}
				else {
					$startMinuteBox .= "<option value=\"".sprintf("%02s",$i)."\">".sprintf("%02s",$i)."</option>";
					$endMinuteBox .= "<option value=\"".sprintf("%02s",$i)."\">".sprintf("%02s",$i)."</option>";
					}
			}

		if(isset($eventID)) {
			if($eventStart == "00:00:01" && $eventEnd == "23:59:59") { $allDayCheck = "checked"; }
			}

		$result = query("SELECT * FROM {$calendar_prefix}calendars_text_font ORDER BY text_font_id",$cal_link);
		while(list($id,$style,$name) = mysql_fetch_row($result)) {
			if($name != "") {
				if(($id == 1 && $eventID == "") || ($id == $styleFontType && ($eventID != "" || $templateID != ""))) { $fontList .= "<input type=\"radio\" name=\"eventFont\" value=\"$id\" checked><span style='$style'>$name</span> "; }
					else { $fontList .= "<input type=\"radio\" name=\"eventFont\" value=\"$id\"><span style='$style'>$name</span> "; }
				}
			}
		$result = query("SELECT * FROM {$calendar_prefix}calendars_text_style ORDER BY text_style_id",$cal_link);
		while(list($id,$style,$name) = mysql_fetch_row($result)) {
			if($name != "") {
				if(($id == 1 && $eventID == "") || ($id == $styleFontStyle && ($eventID != "" || $templateID != ""))) { $styleList .= "<input type=\"radio\" name=\"eventFontStyle\" value=\"$id\" checked><span style='$style'>$name</span> "; }
					else { $styleList .= "<input type=\"radio\" name=\"eventFontStyle\" value=\"$id\"><span style='$style'>$name</span> "; }
				}
			}
		$result = query("SELECT * FROM {$calendar_prefix}calendars_text_size ORDER BY text_size_id",$cal_link);
		while(list($id,$style,$name) = mysql_fetch_row($result)) {
			if($name != "") {
				if(($id == 1 && $eventID == "") || ($id == $styleFontSize && ($eventID != "" || $templateID != ""))) { $sizeList .= "<input type=\"radio\" name=\"eventFontSize\" value=\"$id\" checked><span style='$style'>$name</span> "; }
					else { $sizeList .= "<input type=\"radio\" name=\"eventFontSize\" value=\"$id\"><span style='$style'>$name</span> "; }
				}
			}
		$result = query("SELECT * FROM {$calendar_prefix}calendars_text_color ORDER BY text_color_id",$cal_link);
		while(list($id,$style,$name) = mysql_fetch_row($result)) {
			if($name != "") {
				if(($id == 1 && $eventID == "") || ($id == $styleFontColor && ($eventID != "" || $templateID != ""))) { $colorList .= "<input type=\"radio\" name=\"eventFontColor\" value=\"$id\" checked><span style='$style'>$name</span> "; }
					else { $colorList .= "<input type=\"radio\" name=\"eventFontColor\" value=\"$id\"><span style='$style'>$name</span> "; }
				if(isset($eventID)) {
					if($eventBackground == $id) { $backgroundList .= "<option value=\"$id\" style='$style' selected>$name</option>"; }
						else { $backgroundList .= "<option value=\"$id\" style='$style'>$name</option>"; }
					}
					else { $backgroundList .= "<option value=\"$id\" style='$style'>$name</option>"; }
				}
			}

		$displayData =<<<ENDPRINT
		<script language="javascript" type="text/javascript" src="{$insUrl}editor/tiny_mce.js"></script>
		<script language="javascript" type="text/javascript">
			tinyMCE.init({
				theme : "advanced",
				mode : "exact",
				convert_urls : "false",
    				relative_urls : "false",
				elements : "eventDescription",
				extended_valid_elements : "a[href|target|name]",
				plugins : "table",
				theme_advanced_buttons3_add_before : "tablecontrols,separator",
				theme_advanced_toolbar_location : "top",
				theme_advanced_toolbar_align : "center",
				invalid_elements : "iframe,script",
				theme_advanced_styles : "",
				debug : false
				});
		</script>
		<script language=JavaScript>
		var datePickerDivID = "datepicker";
		var iFrameDivID = "datepickeriframe";
		var dayArrayShort = new Array('{$Languages['global']['daysupershort'][0]}', '{$Languages['global']['daysupershort'][1]}', '{$Languages['global']['daysupershort'][2]}', '{$Languages['global']['daysupershort'][3]}', '{$Languages['global']['daysupershort'][4]}', '{$Languages['global']['daysupershort'][5]}', '{$Languages['global']['daysupershort'][6]}');
		var monthArrayLong = new Array('{$Languages['global']['months'][1]}', '{$Languages['global']['months'][2]}', '{$Languages['global']['months'][3]}', '{$Languages['global']['months'][4]}', '{$Languages['global']['months'][5]}', '{$Languages['global']['months'][6]}', '{$Languages['global']['months'][7]}', '{$Languages['global']['months'][8]}', '{$Languages['global']['months'][9]}', '{$Languages['global']['months'][10]}', '{$Languages['global']['months'][11]}', '{$Languages['global']['months'][12]}');

		var dateSeparator = "/";
		var dateFormat = "mdy";

		function displayDatePicker(fromTo, displayBelowThisObject) {
	  		var formItem = document.getElementById(displayBelowThisObject);
		  	var x = formItem.offsetLeft;
		  	var y = formItem.offsetTop + formItem.offsetHeight ;
	  		var parent = formItem;
			while (parent.offsetParent) {
	    			parent = parent.offsetParent;
    				x += parent.offsetLeft;
    				y += parent.offsetTop ;
  				}
		  	drawDatePicker(fromTo,x, y);
			}

		function drawDatePicker(fromTo,x, y) {
		  	if (!document.getElementById(datePickerDivID)) {
    				var newNode = document.createElement("div");
    				newNode.setAttribute("id", datePickerDivID);
    				newNode.setAttribute("class", "");
	    			newNode.setAttribute("style", "visibility: hidden; width:200px;");
    				document.body.appendChild(newNode);
  				}
  			var pickerDiv = document.getElementById(datePickerDivID);
	  		pickerDiv.style.position = "absolute";
  			pickerDiv.style.left = x + "px";
  			pickerDiv.style.top = y + "px";
	  		pickerDiv.style.visibility = (pickerDiv.style.visibility == "visible" ? "hidden" : "visible");
  			pickerDiv.style.display = (pickerDiv.style.display == "block" ? "none" : "block");
  			pickerDiv.style.zIndex = 10000;
			var fromYear = fromTo + "Year";
			var fromMonth = fromTo + "Month";
			var fromDay = fromTo + "Day";
	  		var year = document.getElementById(fromYear)[document.getElementById(fromYear).selectedIndex].value;
  			var month = document.getElementById(fromMonth)[document.getElementById(fromMonth).selectedIndex].value;
  			var day = document.getElementById(fromDay)[document.getElementById(fromDay).selectedIndex].value;
			refreshDatePicker(fromTo, year, month - 1, day)
			}

		function refreshDatePicker(fromTo, year, month, day) {
	  		var thisDay = new Date();
  			if ((month >= 0) && (year > 0)) { thisDay = new Date(year, month, 1); }
		  		else {
    					day = thisDay.getDate();
    					thisDay.setDate(1);
  					}
	  		var crlf = "";
  			var TABLE = "<table cols=7 cellpadding=1 cellspacing=1 align=center>" + crlf;
  			var xTABLE = "</table>" + crlf;
	  		var TR = "<tr>";
  			var TR_title = "<tr>";
  			var TR_days = "<tr>";
	  		var xTR = "</tr>" + crlf;
  			var TD = "<td class=active onMouseOut=this.className='active'; onMouseOver=this.className='full';" ;
  			var TD_text = "<span class=day>";
	  		var xTD_text = "</span>";
  			var TD_title = "<td colspan=5 class=month>";
  			var TD_buttons = "<td>";
	  		var TD_days = "<td class=header align=center>";
  			var TD_selected = "<td class=full";
  			var xTD = "</td>" + crlf;
	  		var DIV_title = "<div class=monthHeader align=center>";
  			var DIV_title_text = "<div class=month>";
  			var DIV_selected = "<div>";
	  		var xDIV = "</div>";
  			var html = "<div id=miniDateCells><div id=nav>";
	  		html += TABLE;
  			html += TR_title;
  			html += TD_buttons + getButtonCode(fromTo,thisDay, -1, "&lt;") + xTD;
	  		html += TD_title + DIV_title + DIV_title_text + monthArrayLong[ thisDay.getMonth()] + " " + thisDay.getFullYear() + xDIV + xDIV + xTD;
  			html += TD_buttons + getButtonCode(fromTo,thisDay, 1, "&gt;") + xTD;
  			html += xTR;
	  		html += TR_days;
  			for(i = 0; i < dayArrayShort.length; i++) { html += TD_days + dayArrayShort[i] + xTD; }
  			html += xTR;
	  		html += TR;
  			for (i = 0; i < thisDay.getDay(); i++) { html += TD + ">" + TD_text + "&nbsp;" + xTD_text + xTD; }
		  	do {
	    			dayNum = thisDay.getDate();
    				TD_onclick = " onclick=updateDateField('"+fromTo+"','" + getDateString(thisDay) + "');>";
	    			if (dayNum == day) { html += TD_selected + TD_onclick + DIV_selected + dayNum + xDIV + xTD; }
    					else { html += TD + TD_onclick + TD_text + dayNum + xTD_text + xTD; }
				if (thisDay.getDay() == 6) { html += xTR + TR; }
	    			thisDay.setDate(thisDay.getDate() + 1);
  				} while (thisDay.getDate() > 1)
		  	if (thisDay.getDay() > 0) {
	    			for (i = 7; i > thisDay.getDay(); i--) { html += TD + ">" + TD_text + "&nbsp;" + xTD_text + xTD; }
  				}
  			html += xTR;
  			html += xTABLE;
	  		html += "</div></div>";
  			document.getElementById(datePickerDivID).innerHTML = html;
  			adjustiFrame();
			}

		function getButtonCode( fromTo, dateVal, adjust, label) {
		  	var newMonth = (dateVal.getMonth () + adjust) % 12;
		  	var newYear = dateVal.getFullYear() + parseInt((dateVal.getMonth() + adjust) / 12);
	  		if (newMonth < 0) {
    				newMonth += 12;
    				newYear += -1;
	  			}
  			return "<button class=dpButton onClick=refreshDatePicker('" + fromTo + "'," + newYear + "," + newMonth + ");>" + label + "</button>";
			}

		function getDateString(dateVal) {
	  		var dayString = "00" + dateVal.getDate();
		  	var monthString = "00" + (dateVal.getMonth()+1);
		  	dayString = dayString.substring(dayString.length - 2);
	  		monthString = monthString.substring(monthString.length - 2);
 			return monthString + dateSeparator + dayString + dateSeparator + dateVal.getFullYear();
	  		}

		function getFieldDate(dateString) {
		  	var dateVal;
	  		var dArray;
		  	var d, m, y;
		  	try {
    				dArray = splitDateString(dateString);
    				if (dArray) {
		      			d = parseInt(dArray[1], 10);
          				m = parseInt(dArray[0], 10) - 1;
          				y = parseInt(dArray[2], 10);
      					dateVal = new Date(y, m, d);
    					}
	    				else if (dateString) { dateVal = new Date(dateString); }
    					else { dateVal = new Date(); }
  				} catch(e) { dateVal = new Date(); }
			return dateVal;
			}

		function splitDateString(dateString) {
	  		var dArray;
		  	if (dateString.indexOf("/") >= 0) { dArray = dateString.split("/"); }
		  	else if (dateString.indexOf(".") >= 0) { dArray = dateString.split("."); }
	  		else if (dateString.indexOf("-") >= 0) { dArray = dateString.split("-"); }
		  	else { dArray = false; }
		  	return dArray;
			}

		function updateDateField(fromTo,dateString) {
			var dateParts = splitDateString(dateString);
			var fromYear = fromTo + "Year";
			var fromMonth = fromTo + "Month";
			var fromDay = fromTo + "Day";
			var year = parseInt(dateParts[2]);
			var month = parseInt((dateParts[0]) - 1);
			var day = parseInt((dateParts[1]) - 1);
	  		var theSelect = document.getElementById(fromYear);
  			for (loop=0; loop < theSelect.options.length; loop++) {
	    			if(theSelect.options[loop].text == year) {
	    				document.getElementById(fromYear).options.selectedIndex = loop;
    					}
  				}
	  		document.getElementById(fromMonth).options.selectedIndex = month;
  			document.getElementById(fromDay).options.selectedIndex = day;
  			var pickerDiv = document.getElementById(datePickerDivID);
	  		pickerDiv.style.visibility = "hidden";
  			pickerDiv.style.display = "none";
  			adjustiFrame();
			}

		function adjustiFrame(pickerDiv, iFrameDiv) {
		  	var is_opera = (navigator.userAgent.toLowerCase().indexOf("opera") != -1);
		  	if (is_opera)
	  		return;
  			try {
		    		if (!document.getElementById(iFrameDivID)) {
      					var newNode = document.createElement("iFrame");
      					newNode.setAttribute("id", iFrameDivID);
      					newNode.setAttribute("src", "javascript:false;");
	      				newNode.setAttribute("scrolling", "no");
      					newNode.setAttribute ("frameborder", "0");
      					document.body.appendChild(newNode);
    					}
	    			if (!pickerDiv) { pickerDiv = document.getElementById(datePickerDivID); }
    				if (!iFrameDiv) { iFrameDiv = document.getElementById(iFrameDivID); }
    				try {
		      			iFrameDiv.style.position = "absolute";
	      				iFrameDiv.style.width = pickerDiv.offsetWidth;
      					iFrameDiv.style.height = pickerDiv.offsetHeight ;
      					iFrameDiv.style.top = pickerDiv.style.top;
      					iFrameDiv.style.left = pickerDiv.style.left;
      					iFrameDiv.style.zIndex = pickerDiv.style.zIndex - 1;
	      				iFrameDiv.style.visibility = pickerDiv.style.visibility ;
      					iFrameDiv.style.display = pickerDiv.style.display;
    					} catch(e) { }
  				} catch (ee) { }
			}
		</script>
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menuevents']}</td>
		 </tr>
		 <tr>
		  <td>
  		   $calendarMoveBox
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		   <form method="post" action="{$insUrl}admin/index.php" enctype="multipart/form-data" name="theform" onSubmit="return checkEvent(this);">
		   <input type="hidden" name="waste" value="waste">
		   $formExtras
		    <tr>
		     <td class="headtd">{$Languages['admin']['eventinformation']}</td>
		    </tr>
		    $categorySelector
		    <tr>
		     <td><b>{$Languages['admin']['eventtitle']}:</b> <input type="text" style="width:300px;" name="eventTitle" value="$eventTitle"></td>
		    </tr>
		    <tr>
		     <td>
		      <b>{$Languages['admin']['eventlocation']}:</b><br>
		      <input type="text" style="width:300px;" name="eventLocation1" value="$eventLocation1"><br>
		      <input type="text" style="width:300px;" name="eventLocation2" value="$eventLocation2">
		     </td>
		    </tr>
		    <tr>
		     <td><b>{$Languages['admin']['eventlink']}:</b> <input type="text" style="width:300px;" name="eventURL" value="$eventUrl"></td>
		    </tr>
		    <tr>
		     <td><b>{$Languages['admin']['eventcontact']}:</b> <input type="text" style="width:300px;" name="eventContact" value="$contactName"></td>
		    </tr>
		    <tr>
		     <td><b>{$Languages['admin']['eventemail']}:</b> <input type="text" style="width:300px;" name="eventEmail" value="$contactEmail"></td>
		    </tr>
		    <tr>
		     <td class="headtd">{$Languages['admin']['eventdescription']}</td>
		    </tr>
		    <tr>
		     <td align="center">
		      <textarea name="eventDescription" style="width:100%;" rows="15">$eventDescription</textarea>
		     </td>
		    </tr>
		    <tr>
		     <td class="headtd">{$Languages['admin']['eventdatetime']}</td>
		    </tr>
		    <tr>
		     <td>
		       {$Languages['admin']['eventdate']}:&nbsp;$dateBox&nbsp;<input type="button" style="width:20px; height:20px; background-image:url({$insUrl}admin/selector.gif);" onclick="displayDatePicker('event','eventMonth');"></button>&nbsp;{$Languages['admin']['eventnumdays']}:&nbsp;<select name="eventNumDays">$numDaysBox</select><br>
		       <br>
		       {$Languages['admin']['eventstart']}:&nbsp;<select name="eventStartHour">$startBox</select>:<select name="eventStartMinute">$startMinuteBox</select><br>
		       {$Languages['admin']['eventend']}:&nbsp;<select name="eventEndHour">$endBox</select>:<select name="eventEndMinute">$endMinuteBox</select><br>
		       {$Languages['admin']['eventorclickhere']} <input type="checkbox" name="eventAllDay" value="1" $allDayCheck><br>
		       <br>
                       {$Languages['admin']['eventsrepeat']}:&nbsp;<select name="eventRepeat"><option value="0">{$Languages['admin']['eventsdonotrepeat']}</option><option value="12">{$Languages['admin']['eventssamedaily']}</option><option value="1">{$Languages['admin']['eventssameday']}</option><option value="2">{$Languages['admin']['eventssamedate']}</option><option value="3">{$Languages['admin']['eventssameweek']}</option><option value="4">{$Languages['admin']['eventssame2week']}</option><option value="5">{$Languages['admin']['eventssamequarter']}</option><option value="6">{$Languages['admin']['eventssamebiyearly']}</option><option value="7">{$Languages['admin']['eventssameyearly']}</option><option value="8">{$Languages['admin']['eventsevery30']}</option><option value="9">{$Languages['admin']['eventsevery60']}</option><option value="10">{$Languages['admin']['eventsevery90']}</option><option value="11">{$Languages['admin']['eventsevery180']}</option></select><br>
         	       {$Languages['admin']['eventsrepeat']}:&nbsp;<input type="text" size="2" name="eventRepeatTimes"> {$Languages['admin']['eventstimesoruntil']}&nbsp;$dateBox2&nbsp;<input type="button" style="width:20px; height:20px; background-image:url({$insUrl}admin/selector.gif);" onclick="displayDatePicker('repeat','repeatMonth');"></button>
         	      <br>
		     </td>
		    </tr>
		    <tr>
		     <td class="headtd">{$Languages['admin']['eventappearance']}</td>
		    </tr>
		    <tr>
		     <td>
		      {$Languages['admin']['eventfontface']}: $fontList<br>
		      {$Languages['admin']['eventfontsize']}: $sizeList<br>
		      {$Languages['admin']['eventfontstyle']}: $styleList<br>
		      {$Languages['admin']['eventfontcolor']}: $colorList<br>
		     </td>
		    </tr>
		    <tr>
		     <td>
		      <br>
		      <div align="center"><input type="submit" value="{$Languages['admin']['process']}"></div>
		      <br>
		     </td>
		    </tr>
		   </table>

		  </td>
		 </tr>
		</form>
		</table>
		</div>
ENDPRINT;
		break;

	case "eventProcess":
		//Protect the input
		$calendarID = intval(protect($calendarID));
		$eventTitle = strip_tags(protect($eventTitle));
		$eventLocation1 = strip_tags(protect($eventLocation1));
		$eventLocation2 = strip_tags(protect($eventLocation2));
		$eventURL = validateUrl(strip_tags(protect($eventURL)));
		$eventContact = strip_tags(protect($eventContact));
		$eventEmail = strip_tags(protect($eventEmail));
		$eventDescription = protect($eventDescription);
		$eventMonth = intval(protect($eventMonth));
		$eventDay = intval(protect($eventDay));
		$eventYear = intval(protect($eventYear));
		$repeatMonth = intval(protect($repeatMonth));
		$repeatDay = intval(protect($repeatDay));
		$repeatYear = intval(protect($repeatYear));
		$eventNumDays = intval(protect($eventNumDays));
		$eventStartHour = intval(protect($eventStartHour));
		$eventStartMinute = intval(protect($eventStartMinute));
		$eventEndHour = intval(protect($eventEndHour));
		$eventEndMinute = intval(protect($eventEndMinute));
		$eventAllDay = intval(protect($eventAllDay));
		$eventRepeat = intval(protect($eventRepeat));
		$eventRepeatTimes = intval(protect($eventRepeatTimes));
		$eventFont = intval(protect($eventFont));
		$eventFontSize = intval(protect($eventFontSize));
		$eventFontStyle = intval(protect($eventFontStyle));
		$eventFontColor = intval(protect($eventFontColor));
		if($eventFont == 0) { $eventFont = 1; }
		if($eventFontSize == 0) { $eventFontSize = 1; }
		if($eventFontStyle == 0) { $eventFontStyle = 1; }
		if($eventFontColor == 0) { $eventFontColor = 1; }

		//Set up the dates/times for the events
		if($eventNumDays == 0) { $eventNumDays = 1; }
		$eventOccurance = 0;
		$eventDateTimes = array();

		//Normal selection
		if($eventAllDay == 1) { $startTime = "00:00:01"; $endTime = "23:59:59"; }
			else {
				$startTime = sprintf("%02s",$eventStartHour).":".sprintf("%02s",$eventStartMinute).":00";
				if($eventEndHour == 0) { $endTime = "23:59:59"; }
					else {
						$endTime = sprintf("%02s",$eventEndHour).":".sprintf("%02s",$eventEndMinute).":00";
						}
				}

		//Check to see if we are repeating this event
		if($eventRepeat >= 1) {
			//Determine first occurance
			$first = mktime (0,0,0,$eventMonth,$eventDay,$eventYear);
			if($eventRepeatTimes == "") {
				//Convert TO date into repeat times
				switch($eventRepeat) {
					case 1:	//Same day every month
						$future = mktime (0,0,0,$repeatMonth,0,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 2419200);
						break;
					case 2:	//Same date every month
						$future = mktime (0,0,0,$repeatMonth,0,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 2419200);
						break;
					case 3:	//Same day every week
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 604800);
						break;
					case 4:	//Same day every 2 weeks
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 1209600);
						break;
					case 5: //Every quarter
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$find_date = $first;
						$eventRepeatTimes = 0;
						while($future > $find_date) {
							$eventRepeatTimes++;
							$find_date = strtotime("+3 months",$find_date);
							}
						$eventRepeatTimes--;
						break;
					case 6: //Bi-yearly
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$find_date = $first;
						$eventRepeatTimes = 0;
						while($future > $find_date) {
							$eventRepeatTimes++;
							$find_date = strtotime("+6 months",$find_date);
							}
						$eventRepeatTimes--;
						break;
					case 7: //Yearly
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$find_date = $first;
						$eventRepeatTimes = 0;
						while($future > $find_date) {
							$eventRepeatTimes++;
							$find_date = strtotime("+1 year",$find_date);
							}
						$eventRepeatTimes--;
						break;
					case 8: //Every 30 days
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 2592000);
						break;
					case 9: //Every 60 days
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 5184000);
						break;
					case 10://Every 90 days
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 7776000);
						break;
					case 11://Every 180 days
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 15552000);
						break;
					case 12://Daily
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 86400);
						break;
					}
				}

			if($eventRepeat == 1) {
				$dowCount = 0;
				$dow = date("w",mktime(0,0,0,$eventMonth,$eventDay,$eventYear));
				$nod = date("t",mktime (0,0,0,$eventMonth,01,$eventYear));
				for($d = 1; $d <= $nod; $d++) {
					$Cdow = date("w",mktime(0,0,0,$eventMonth,$d,$eventYear));
					if(($dow == $Cdow) && ($d <= $eventDay)) { $dowCount++; }
					}
				}

			//Figure out the dates
			for($i=0;$i<=$eventRepeatTimes;$i++) {
				$eventOccurance++;
				switch($eventRepeat) {
					case 1:
						$CdowCount = 1;
						$nod = date("t",mktime (0,0,0,$eventMonth+$i,01,$eventYear));
						for($d = 1; $d <= $nod; $d++) {
							$Cdow = date("w",mktime(0,0,0,$eventMonth+$i,$d,$eventYear));
							if($dow == $Cdow) {
								if($CdowCount == $dowCount) { $theDate = date("Y-m-d",mktime(0,0,0,$eventMonth+$i,$d,$eventYear)); }
								$CdowCount++;
								}
							}
						if($theDate != $prev_date) {
							$prev_date = $theDate;
							}
							else {
								$eventOccurance--;
								continue 2;
								}
					break;
					case 2:
						$theDate = date("Y-m-d",strtotime("+$i month",$first));
						break;
					case 3:
						$theDate = date("Y-m-d",strtotime("+$i week",$first));
		 				break;
		 			case 4:
						$j = $i * 2;
						$theDate = date("Y-m-d",strtotime("+$j weeks",$first));
		 				break;
		 			case 5:
		 				$j = $i * 3;
		 				$theDate = date("Y-m-d",strtotime("+$j months",$first));
		 				break;
		 			case 6:
		 				$j = $i * 6;
		 				$theDate = date("Y-m-d",strtotime("+$j months",$first));
		 				break;
		 			case 7:
		 				$theDate = date("Y-m-d",strtotime("+$i years",$first));
		 				break;
		 			case 8:
		 				$j = $i * 30;
		 				$theDate = date("Y-m-d",strtotime("+$j days",$first));
		 				break;
		 			case 9:
		 				$j = $i * 60;
		 				$theDate = date("Y-m-d",strtotime("+$j days",$first));
		 				break;
		 			case 10:
		 				$j = $i * 90;
		 				$theDate = date("Y-m-d",strtotime("+$j days",$first));
		 				break;
		 			case 11:
		 				$j = $i * 180;
		 				$theDate = date("Y-m-d",strtotime("+$j days",$first));
		 				break;
					case 12:
						$theDate = date("Y-m-d",strtotime("+$i days",$first));
						break;
					}
				$eventDateTimes[$eventOccurance] = "$theDate|$startTime|$endTime";
				}
			}
			else {
				//Single occurance
				$theDate = sprintf("%04s",$eventYear)."-".sprintf("%02s",$eventMonth)."-".sprintf("%02s",$eventDay);
				$eventDateTimes[1] = "$theDate|$startTime|$endTime";
				$eventOccurance = 1;
				}
	
		//Prepare event data
		$eventQuery = "INSERT INTO {$calendar_prefix}events (event_id,contact_name,contact_email,event_title,event_description,event_url,event_city,event_state,style_font_type,style_font_style,style_font_size,style_font_color) VALUES (NULL,'$eventContact','$eventEmail','$eventTitle','$eventDescription','$eventURL','$eventLocation1','$eventLocation2',$eventFont,$eventFontStyle,$eventFontSize,$eventFontColor)";

		//Store event dates
		$eventIDArray = array();
		for($i=1;$i<=$eventOccurance;$i++) {
			$eventData = explode("|",$eventDateTimes[$i]);
			$eventDate = $eventData[0];
			$eventStart = $eventData[1];
			$eventEnd = $eventData[2];

			//Store the event/date
			$result = query($eventQuery,$cal_link);
			$eventID = mysql_insert_id($cal_link);
			for($ii=0;$ii<=$eventNumDays-1;$ii++) {
				$storeDate = date("Y-m-d",strtotime($eventDate) + (86400 * $ii));
				$result = query("INSERT INTO {$calendar_prefix}dates (event_id,event_date,event_time_start,event_time_end) VALUES ($eventID,'$storeDate','$eventStart','$eventEnd')",$cal_link);
				}
			$datesStored .= "$eventDate ";
			}

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menuevents']}</td>
		 </tr>
		 <tr>
		  <td>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		    <tr>
		     <td colspan="2" class="headtd">{$Languages['admin']['eventsadd']}</td>
		    </tr>
		    <tr>
		     <td>
		      {$Languages['admin']['eventsposted']}: $datesStored<br>
		      <br>
		     </td>
		    </tr>
		   </table>
		  </td>
		 </tr>
		</table>
		</div>
ENDPRINT;
		break;

	case "eventEdit":
		//Protect the input
		$eventID = intval($eventID);
		$eventTitle = strip_tags(protect($eventTitle));
		$eventLocation1 = strip_tags(protect($eventLocation1));
		$eventLocation2 = strip_tags(protect($eventLocation2));
		$eventURL = validateUrl(strip_tags(protect($eventURL)));
		$eventContact = strip_tags(protect($eventContact));
		$eventEmail = strip_tags(protect($eventEmail));
		$eventDescription = protect($eventDescription);
		$eventMonth = intval(protect($eventMonth));
		$eventDay = intval(protect($eventDay));
		$eventYear = intval(protect($eventYear));
		$repeatMonth = intval(protect($repeatMonth));
		$repeatDay = intval(protect($repeatDay));
		$repeatYear = intval(protect($repeatYear));
		$eventNumDays = intval(protect($eventNumDays));
		$eventStartHour = intval(protect($eventStartHour));
		$eventStartMinute = intval(protect($eventStartMinute));
		$eventEndHour = intval(protect($eventEndHour));
		$eventEndMinute = intval(protect($eventEndMinute));
		$eventAllDay = intval(protect($eventAllDay));
		$eventRepeat = intval(protect($eventRepeat));
		$eventRepeatTimes = intval(protect($eventRepeatTimes));
		$advancedDateInfo = protect($advancedDateInfo);
		$eventFont = intval(protect($eventFont));
		$eventFontSize = intval(protect($eventFontSize));
		$eventFontStyle = intval(protect($eventFontStyle));
		$eventFontColor = intval(protect($eventFontColor));
		if($eventFont == 0) { $eventFont = 1; }
		if($eventFontSize == 0) { $eventFontSize = 1; }
		if($eventFontStyle == 0) { $eventFontStyle = 1; }
		if($eventFontColor == 0) { $eventFontColor = 1; }

		//Remove old database entries
		$result = query("DELETE FROM {$calendar_prefix}dates WHERE event_id=$eventID",$cal_link);
		$result = query("DELETE FROM {$calendar_prefix}events WHERE event_id=$eventID",$cal_link);

		//Set up the dates/times for the events
		if($eventNumDays == 0) { $eventNumDays = 1; }
		$eventOccurance = 0;
		$eventDateTimes = array();

		//Normal selection
		if($eventAllDay == 1) { $startTime = "00:00:01"; $endTime = "23:59:59"; }
			else {
				$startTime = sprintf("%02s",$eventStartHour).":".sprintf("%02s",$eventStartMinute).":00";
				if($eventEndHour == 0) { $endTime = "23:59:59"; }
					else {
						$endTime = sprintf("%02s",$eventEndHour).":".sprintf("%02s",$eventEndMinute).":00";
						}
				}

		//Check to see if we are repeating this event
		if($eventRepeat >= 1) {
			//Determine first occurance
			$first = mktime (0,0,0,$eventMonth,$eventDay,$eventYear);
			if($eventRepeatTimes == "") {
				//Convert TO date into repeat times
				switch($eventRepeat) {
					case 1:	//Same day every month
						$future = mktime (0,0,0,$repeatMonth,0,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 2419200);
						break;
					case 2:	//Same date every month
						$future = mktime (0,0,0,$repeatMonth,0,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 2419200);
						break;
					case 3:	//Same day every week
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 604800);
						break;
					case 4:	//Same day every 2 weeks
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 1209600);
						break;
					case 5: //Every quarter
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$find_date = $first;
						$eventRepeatTimes = 0;
						while($future > $find_date) {
							$eventRepeatTimes++;
							$find_date = strtotime("+3 months",$find_date);
							}
						$eventRepeatTimes--;
						break;
					case 6: //Bi-yearly
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$find_date = $first;
						$eventRepeatTimes = 0;
						while($future > $find_date) {
							$eventRepeatTimes++;
							$find_date = strtotime("+6 months",$find_date);
							}
						$eventRepeatTimes--;
						break;
					case 7: //Yearly
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$find_date = $first;
						$eventRepeatTimes = 0;
						while($future > $find_date) {
							$eventRepeatTimes++;
							$find_date = strtotime("+1 year",$find_date);
							}
						$eventRepeatTimes--;
						break;
					case 8: //Every 30 days
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 2592000);
						break;
					case 9: //Every 60 days
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 5184000);
						break;
					case 10://Every 90 days
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 7776000);
						break;
					case 11://Every 180 days
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 15552000);
						break;
					case 12://Daily
						$future = mktime (0,0,0,$repeatMonth,$repeatDay,$repeatYear);
						$eventRepeatTimes = floor(($future - $first) / 86400);
						break;
					}
				}

			if($eventRepeat == 1) {
				$dowCount = 0;
				$dow = date("w",mktime(0,0,0,$eventMonth,$eventDay,$eventYear));
				$nod = date("t",mktime (0,0,0,$eventMonth,01,$eventYear));
				for($d = 1; $d <= $nod; $d++) {
					$Cdow = date("w",mktime(0,0,0,$eventMonth,$d,$eventYear));
					if(($dow == $Cdow) && ($d <= $eventDay)) { $dowCount++; }
					}
				}

			//Figure out the dates
			for($i=0;$i<=$eventRepeatTimes;$i++) {
				$eventOccurance++;
				switch($eventRepeat) {
					case 1:
						$CdowCount = 1;
						$nod = date("t",mktime (0,0,0,$eventMonth+$i,01,$eventYear));
						for($d = 1; $d <= $nod; $d++) {
							$Cdow = date("w",mktime(0,0,0,$eventMonth+$i,$d,$eventYear));
							if($dow == $Cdow) {
								if($CdowCount == $dowCount) { $theDate = date("Y-m-d",mktime(0,0,0,$eventMonth+$i,$d,$eventYear)); }
								$CdowCount++;
								}
							}
						if($theDate != $prev_date) {
							$prev_date = $theDate;
							}
							else {
								$eventOccurance--;
								continue 2;
								}
					break;
					case 2:
						$theDate = date("Y-m-d",strtotime("+$i month",$first));
						break;
					case 3:
						$theDate = date("Y-m-d",strtotime("+$i week",$first));
		 				break;
		 			case 4:
						$j = $i * 2;
						$theDate = date("Y-m-d",strtotime("+$j weeks",$first));
		 				break;
		 			case 5:
		 				$j = $i * 3;
		 				$theDate = date("Y-m-d",strtotime("+$j months",$first));
		 				break;
		 			case 6:
		 				$j = $i * 6;
		 				$theDate = date("Y-m-d",strtotime("+$j months",$first));
		 				break;
		 			case 7:
		 				$theDate = date("Y-m-d",strtotime("+$i years",$first));
		 				break;
		 			case 8:
		 				$j = $i * 30;
		 				$theDate = date("Y-m-d",strtotime("+$j days",$first));
		 				break;
		 			case 9:
		 				$j = $i * 60;
		 				$theDate = date("Y-m-d",strtotime("+$j days",$first));
		 				break;
		 			case 10:
		 				$j = $i * 90;
		 				$theDate = date("Y-m-d",strtotime("+$j days",$first));
		 				break;
		 			case 11:
		 				$j = $i * 180;
		 				$theDate = date("Y-m-d",strtotime("+$j days",$first));
		 				break;
					case 12:
						$theDate = date("Y-m-d",strtotime("+$i days",$first));
						break;
					}
				$eventDateTimes[$eventOccurance] = "$theDate|$startTime|$endTime";
				}
			}
			else {
				//Single occurance
				$theDate = sprintf("%04s",$eventYear)."-".sprintf("%02s",$eventMonth)."-".sprintf("%02s",$eventDay);
				$eventDateTimes[1] = "$theDate|$startTime|$endTime";
				$eventOccurance = 1;
				}

		//Store event dates
		$eventIDArray = array();
		for($i=1;$i<=$eventOccurance;$i++) {
			$eventData = explode("|",$eventDateTimes[$i]);
			$eventDate = $eventData[0];
			$eventStart = $eventData[1];
			$eventEnd = $eventData[2];

			//Which event are we updating
			$newEventID = $eventsToUpdate[$i-1];
			if($newEventID == "") { $newEventID = "NULL"; }

			//Prepare event data
			$eventQuery = "INSERT INTO {$calendar_prefix}events (event_id,contact_name,contact_email,event_title,event_description,event_url,event_city,event_state,style_font_type,style_font_style,style_font_size,style_font_color) VALUES ($eventID,'$eventContact','$eventEmail','$eventTitle','$eventDescription','$eventURL','$eventLocation1','$eventLocation2',$eventFont,$eventFontStyle,$eventFontSize,$eventFontColor)";			

			//Store the event/date
			$result = query($eventQuery,$cal_link);
			if($adminID == "") { $adminID = $eventID; }
			for($ii=0;$ii<=$eventNumDays-1;$ii++) {
				$storeDate = date("Y-m-d",strtotime($eventDate) + (86400 * $ii));
				$result = query("INSERT INTO {$calendar_prefix}dates (event_id,event_date,event_time_start,event_time_end) VALUES ($eventID,'$storeDate','$eventStart','$eventEnd')",$cal_link);
				}
			$eventPosted = 1;
			array_push($eventIDArray,$eventID);
			$datesStored .= "$eventDate ";
			}

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menuevents']}</td>
		 </tr>
		 <tr>
		  <td>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		    <tr>
		     <td colspan="2" class="headtd">{$Languages['admin']['eventsedited']}</td>
		    </tr>
		    <tr>
		     <td>
		      {$Languages['admin']['eventposted']}: $datesStored<br>
		      <br>		      
		     </td>
		    </tr>
		   </table>
		  </td>
		 </tr>
		</table>
		</div>
ENDPRINT;
		break;
	}

?>
