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

//Connect to database
include("connect.php");
include("functions.php");

//Get the event data
$event = intval(protect($event));
$result = mysql_query("SELECT event_id,event_title,event_city,event_state,contact_name,contact_email,event_description,event_url FROM {$calendar_prefix}events WHERE event_id=$event",$cal_link);
list($event_id,$eventTitle,$eventLocation1,$eventLocation2,$contactName,$contactEmail,$eventDescription,$eventUrl) = mysql_fetch_row($result);

//Get the dates/time
$dateString = "";
$result = query("SELECT event_date FROM {$calendar_prefix}dates WHERE event_id=$event ORDER BY event_date",$cal_link);
while(list($theDate) = mysql_fetch_row($result)) {
	if($dateString != "") { $dateString .= ","; }
	$dateString .= formatDate($theDate);	
	}
$result = query("SELECT event_time_start,event_time_end FROM {$calendar_prefix}dates WHERE event_id=$event ORDER BY event_date LIMIT 1",$cal_link);
list($start,$end) = mysql_fetch_row($result);
if($start != "00:00:01") {
	$start = formatTime($start);
	$end = formatTime($end);
	if($end != "23:59:59") { $eventTime = "$start - $end"; }
		else { $eventTime = $start; }
	}
	else { $eventTime = $Languages['event']['allday']; }

//Prep the data
$addPageTitle = $eventTitle;
$eventTitle = toHtml($eventTitle);
$eventLocation1 = toHtml($eventLocation1);
$eventLocation2 = toHtml($eventLocation2);
$contactName = toHtml($contactName);
if($contactEmail != "") { $contactEmail = toEmail($contactEmail); }
$eventDescription = toHtml($eventDescription);
$eventUrl = toHtml($eventUrl);

//Load the event template
$eventData =<<<ENDDATA
<div id="events" align="center">
<table width="500" border="0" cellspacing="1" cellpadding="3">
 <tr>
  <td colspan="2" class="title">$eventTitle</td>
 </tr>
 <tr>
  <td width="100" class="heading">{$Languages['event']['date']}:</td>
  <td class="data">{$dateString}</td>
 </tr>
 <tr>
  <td width="100" class="heading">{$Languages['event']['time']}:</td>
  <td class="data">{$eventTime}</td>
 </tr> 
ENDDATA;
if($eventLocation1 != "" || $eventLocation2 != "") {
	$eventData .=<<<ENDDATA
	<tr>
	 <td width="100" class="heading">{$Languages['event']['where']}:</td>
	 <td class="data">{$eventLocation1} {$eventLocation2}</td>
	</tr>
ENDDATA;
	}
if($contactName != "" || $contactEmail != "") {
	$eventData .=<<<ENDDATA
	<tr>
	 <td width="100" class="heading">{$Languages['event']['contact']}:</td>
	 <td class="data">{$contactName} {$contactEmail}</td>
	</tr>
ENDDATA;
	}
if($eventUrl != "") {
	$eventData .=<<<ENDDATA
	<tr>
	 <td width="100" class="heading">{$Languages['event']['link']}:</td>
	 <td class="data">{$eventUrl}</td>
	</tr>
ENDDATA;
	}
$eventData .=<<<ENDDATA
 <tr>
  <td colspan="2" class="data">
   <br />
   $eventDescription
  </td>
 </tr>
</table>
</div>
ENDDATA;

//Display the event
if($adminOverride == 1) { $SystemOptions['events_popup'] = 1; }
if($SystemOptions['events_popup'] == 1) { 
	//Show in popup window
	echo<<<ENDPRINT
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
 <head>
  <title>{$addPageTitle} | {$SystemOptions['pagetitle']}</title>
  <meta http-equiv="Content-Type" content="text/html; charset={$Languages['global']['charset']}">
  <meta name="generator" content="BosDates Lite 3.0 by BosDev">
  <meta name="author" content="BosDev http://www.bosdev.com">
  <link rel="stylesheet" media="screen" href="{$insUrl}themes/{$SystemOptions['css']}" type="text/css" >
  <link rel="stylesheet" media="print"  href="{$insUrl}themes/{$SystemOptions['css_print']}" type="text/css" >
 </head>
 <body>
  <div id="nav">
  <table width="100%" border="0" cellspacing="1" cellpadding="3">
   <tr>
    <td align="right"><a href="javascript:window.close();">{$Languages['event']['close']}</a></td>
   </tr>
  </table>
  </div>
  <br />
  $eventData
 </body>
</html>
ENDPRINT;
	}
	else {
		//Display full page
		include("header.php");
		
		//Get the date information
		if($date == "") { $date = date("Y-m-d",time()); }
		$year = intval(substr($date,0,4));
		$month = intval(substr($date,5,2));
		$day = intval(substr($date,8,2));

		//Set mini-cals
		$prevMiniCal = miniCal(date("m",mktime(1,1,1,$month-1,1,$year)),date("Y",mktime(1,1,1,$month-1,1,$year)));
		$nextMiniCal = miniCal(date("m",mktime(1,1,1,$month+1,1,$year)),date("Y",mktime(1,1,1,$month+1,1,$year)));

		//Other display elements
		$viewModes = viewMenu("day",$day,$month,$year);
		$TitleText = titleText();
		$dateSelector = dateChooser($day,$month,$year);
		$calendarMenu = calendarMenu();
		
		//Read in our template, and fill in the blanks
		$eventData = "<tr><td align=\"center\">$eventData</td></tr>";
		$template = file("{$insPath}templates/calendar.inc");
		while(list(,$val) = each($template)) {
			$val = preg_replace("/%dateSelector%/e","\$dateSelector", $val);
			$val = preg_replace("/%viewModes%/e","\$viewModes", $val);
			$val = preg_replace("/%menu%/e","\$calendarMenu", $val);
			$val = preg_replace("/%titleNav%/e","\$TitleText", $val);
			$val = preg_replace("/%miniPrev%/e","\$prevMiniCal", $val);
			$val = preg_replace("/%miniNext%/e","\$nextMiniCal", $val);
			$val = preg_replace("/%headers%/e","\$headers", $val);
			$val = preg_replace("/%cells%/e","\$eventData", $val);
			echo stripslashes($val);
			}
				
		include("footer.php");		
		}

?>