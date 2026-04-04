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

//Set defaults if not set
if(!isset($type)) { $type = $SystemOptions['defaultview']; }
if(!isset($year)) { $year = date("Y",time()); }
if(!isset($month)) { $month = date("m",time()); }
if(!isset($day)) { $day = date("d",time()); }

//Set up additional dates needed
$dotw = date("w",mktime(1,1,1,$month,$day,$year));
$prevMonth = date("m",mktime(1,1,1,$month-1,1,$year));
$prevYear = date("Y",mktime(1,1,1,$month-1,1,$year));
$nextMonth = date("m",mktime(1,1,1,$month+1,1,$year));
$nextYear = date("Y",mktime(1,1,1,$month+1,1,$year));
$lastDay = date("t",mktime(01,01,01,$month,1,$year));
$todayDay = date("j");

//Set mini-cals
$prevMiniCal = miniCal(date("m",mktime(1,1,1,$month-1,1,$year)),date("Y",mktime(1,1,1,$month-1,1,$year)));
$nextMiniCal = miniCal(date("m",mktime(1,1,1,$month+1,1,$year)),date("Y",mktime(1,1,1,$month+1,1,$year)));

//Other display elements
$viewModes = viewMenu($type,$day,$month,$year);
$TitleText = titleText();
$dateSelector = dateChooser($day,$month,$year);
$calendarMenu = calendarMenu();

//Set prep data as needed
switch($type) {
	case "day":
		$fromDate = date("Y-m-d",mktime(01,01,01,$month,$day,$year));
		$toDate = date("Y-m-d",mktime(01,01,01,$month,$day,$year));
		$blockMode = FALSE;
		$dayMode = TRUE;
		$yearMode = FALSE;
		break;
		
	case "week":
		$fromDate = date("Y-m-d",mktime(01,01,01,$month,$day-$dotw,$year));
		$toDate = date("Y-m-d",mktime(01,01,01,$month,($day+(6-$dotw)),$year));
		$blockMode = TRUE;
		$dayMode = FALSE;
		$yearMode = FALSE;
		$numRows = 1;	
		break;
		
	case "2week":
		$fromDate = date("Y-m-d",mktime(01,01,01,$month,$day-$dotw,$year));
		$toDate = date("Y-m-d",mktime(01,01,01,$month,($day+(6-$dotw)+7),$year));
		$blockMode = TRUE;
		$dayMode = FALSE;
		$yearMode = FALSE;
		$numRows = 2;	
		break;
		
	case "month":
		$fromDate = date("Y-m-d",mktime(01,01,01,$month,1,$year));
		$toDate = date("Y-m-d",mktime(01,01,01,$month,$lastDay,$year));
		$blockMode = TRUE;
		$dayMode = FALSE;
		$yearMode = FALSE;
		$numRows = 6;	
		break;
		
	case "year":	
		$blockMode = FALSE;
		$dayMode = FALSE;
		$yearMode = TRUE;
		break;	
	}

//Get the style options
$result = query("SELECT text_font_id,text_font FROM {$calendar_prefix}calendars_text_font",$cal_link);
while(list($id,$item) = mysql_fetch_row($result)) {
	$font[$id] = $item;
	}

$result = query("SELECT text_style_id,text_style FROM {$calendar_prefix}calendars_text_style",$cal_link);
while(list($id,$item) = mysql_fetch_row($result)) {
	$style[$id] = $item;
	}

$result = query("SELECT text_size_id,text_size FROM {$calendar_prefix}calendars_text_size",$cal_link);
while(list($id,$item) = mysql_fetch_row($result)) {
	$size[$id] = $item;
	}

$result = query("SELECT text_color_id,text_color FROM {$calendar_prefix}calendars_text_color",$cal_link);
while(list($id,$item) = mysql_fetch_row($result)) {
	$color[$id] = $item;
	}

//Get the events in this date range
$result = query("SELECT d.event_id,d.event_date,d.event_time_start,d.event_time_end,e.event_title,e.event_city,e.event_state,e.contact_name,e.contact_email,e.event_description,e.style_font_type,e.style_font_style,e.style_font_size,e.style_font_color FROM {$calendar_prefix}dates d LEFT JOIN {$calendar_prefix}events e ON d.event_id=e.event_id WHERE (d.event_date BETWEEN '$fromDate' AND '$toDate') ORDER BY d.event_date,d.event_time_start",$cal_link);
while(list($event_id,$event_date,$event_start,$event_end,$event_title,$event_location1,$event_location2,$contact_name,$contact_email,$event_description,$style_font_type,$style_font_style,$style_font_size,$style_font_color) = mysql_fetch_row($result)) {

	//Get the display for this event	
	$toLoad = getDisplay($event_id,$event_date,$event_start,$event_end,$event_title,$event_location1,$event_location2,$contact_name,$contact_email,$event_description,$font[$style_font_type],$style[$style_font_style],$size[$style_font_size],$color[$style_font_color]);

	//Load the cell
	if($type != "day") {
		$tmpEventData[$event_date] .= <<<ENDCELL
		$toLoad
		<table><tr><td></td></tr></table>
ENDCELL;
		}
		else {
			$tmpEventData[$event_id]['data'] = $toLoad;
			$tmpEventData[$event_id]['start'] = $event_start;
			$tmpEventData[$event_id]['end'] = $event_end;
			$tmpEventData[$event_id]['style'] = "{$font[$style_font_type]} {$style[$style_font_style]} {$size[$style_font_size]} {$color[$style_font_color]}";
			}
	}

//Do we need to make blocks?
if($blockMode) {
	//Set up headers
	$headers =<<<ENDHEADER
	<tr>
	 <td width="15%" align="center" class="calendar_header">{$Languages['global']['days'][0]}</td>
	 <td width="14%" align="center" class="calendar_header">{$Languages['global']['days'][1]}</td>
	 <td width="14%" align="center" class="calendar_header">{$Languages['global']['days'][2]}</td>
	 <td width="14%" align="center" class="calendar_header">{$Languages['global']['days'][3]}</td>
	 <td width="14%" align="center" class="calendar_header">{$Languages['global']['days'][4]}</td>
	 <td width="14%" align="center" class="calendar_header">{$Languages['global']['days'][5]}</td>
	 <td width="15%" align="center" class="calendar_header">{$Languages['global']['days'][6]}</td>
	</tr>
ENDHEADER;

	//Initialize the CSS for all possible cells
	for($i=1;$i<=($numRows * 7);$i++) { $cssData[$i] = "empty"; }
	
	//If displaying month mode, adjust our start date
	if($type == "month") {
		$monthDoTW = date("w",mktime(01,01,01,$month,01,$year));
		$adjFromDate = date("Y-m-d",mktime(01,01,01,$month,01-$monthDoTW,$year));
		}
		else { $adjFromDate = $fromDate; }

	//Loop through the rows
	for($i=1;$i<=$numRows;$i++) {
		$cells .= "<tr>";
		for($ii=1;$ii<=7;$ii++) {
			//Set the date for this cell, and the date display
			$cellDate = date("Y-m-d",strtotime("$adjFromDate 13:01:01")+(86400 * $counter));
			$dateParts = explode("-",$cellDate);
			if($type == "month") { $displayDateLine = intval($dateParts[2]); }
				else { $displayDateLine = "<span class=\"month\">".$Languages['global']['monthshort'][intval($dateParts[1])]."</span> ".intval($dateParts[2]); }
			if($tmpEventData[$cellDate] != "") {
				$dateLine = "<a id=\"date\" href=\"calendar.php?type=day&day={$dateParts[2]}&month={$dateParts[1]}&year={$dateParts[0]}\">$displayDateLine</a>";
				}
				else { $dateLine = "<div id=\"date\">$displayDateLine</div>"; }
			if($type == "month" && (strtotime("$cellDate 13:01:01") < strtotime("$fromDate 13:01:01") || strtotime("$cellDate 13:01:01") > strtotime("$toDate 13:01:01"))) { $dateLine = ""; }

			//Check to ensure we're not including an empty row
			if($ii == 1 && (strtotime("$cellDate 13:01:01") > strtotime("$toDate 13:01:01"))) { continue 2; }

			//Set the css class for this cell
			if(date("Y-m-d") == $cellDate) { $class = "today"; }
				else { $class = "active"; }
			if( (date("w",strtotime("$cellDate 13:01:01")) == 0 || date("w",strtotime("$cellDate 13:01:01")) == 6) && !(date("Y-m-d") == $cellDate)) { $class = "weekend"; }

			$cells .=<<<ENDCELL
			<td valign="top" width="$colWidth" height="100" class="$class">
			 <table width="100%" border="0" cellspacing="0" cellpadding="0">
			  <tr>
			   <td valign="top" align="right">
			    {$dateLine}
 			   </td>
			  </tr>
			  <tr>
			   <td width="100%" align="{$SystemOptions['events_align']}">
			    {$tmpEventData[$cellDate]}
 			   </td>
			  </tr>
			 </table>
			</td>
ENDCELL;
			$counter++;
			}
		$cells .= "</tr>";
		}	
	}

//Do we need to make mini-cals
if($yearMode) {
	$miniCal1 = miniCal(1,$year,2); 
	$miniCal2 = miniCal(2,$year,2); 
	$miniCal3 = miniCal(3,$year,2); 
	$miniCal4 = miniCal(4,$year,2); 
	$miniCal5 = miniCal(5,$year,2); 
	$miniCal6 = miniCal(6,$year,2);
	$miniCal7 = miniCal(7,$year,2); 
	$miniCal8 = miniCal(8,$year,2); 
	$miniCal9 = miniCal(9,$year,2); 
	$miniCal10 = miniCal(10,$year,2); 
	$miniCal11 = miniCal(11,$year,2); 
	$miniCal12 = miniCal(12,$year,2);
	$cells =<<<ENDCELL
        <tr>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal1</td>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal2</td>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal3</td>
         <td width="2%">&nbsp;</td>
        </tr>
        <tr>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal4</td>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal5</td>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal6</td>
         <td width="2%">&nbsp;</td>
        </tr>
        <tr>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal7</td>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal8</td>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal9</td>
         <td width="2%">&nbsp;</td>
        </tr>
        <tr>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal10</td>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal11</td>
         <td width="2%">&nbsp;</td>
         <td width="30%" align="center" valign="top">$miniCal12</td>
         <td width="2%">&nbsp;</td>
        </tr>
ENDCELL;
	}

if($dayMode && count($tmpEventData) > 0) {
	$cells =<<<ENDSTART
	<tr>
	 <td align="center">
	  <table width="500" border="0" cellpadding="3" cellspacing="0">
ENDSTART;
	while(list($key,) = each($tmpEventData)) {
		if($event_start != "00:00:01") {
			$start = formatTime($tmpEventData[$key]['start']);
			$end = formatTime($tmpEventData[$key]['end']);
			if((($SystemOptions['events_display'] & 1) != 0) && (($SystemOptions['events_display'] & 2) != 0) && $event_end != "23:59:59") { $displayTime .= "$start-$end<br />"; }
			if((($SystemOptions['events_display'] & 1) != 0) && (($SystemOptions['events_display'] & 2) != 0) && $event_end == "23:59:59") { $displayTime .= "$start<br />"; }
			if((($SystemOptions['events_display'] & 1) != 0) && (($SystemOptions['events_display'] & 2) == 0)) { $displayTime .= "$start<br />"; }
			if((($SystemOptions['events_display'] & 1) == 0) && (($SystemOptions['events_display'] & 2) != 0)) { $displayTime .= "$end<br />"; }
			}
		
		$cells .= <<<ENDROW
		<tr>
		 <td width="150" align="left" valign="top" style="{$tmpEventData[$key]['style']}">
		  $displayTime
		 </td>
		 <td>
		  {$tmpEventData[$key]['data']}
		 </td>
		</tr>
		<tr><td colspan="2" align="center"><hr width="85%" noshade></td></tr>
ENDROW;
		}
	$cells .= "</table></td></tr>";
	}
	
//Start output
include("header.php");

//Read in our template, and fill in the blanks
$template = file("{$insPath}templates/calendar.inc");
while(list(,$val) = each($template)) {
	$val = preg_replace("/%dateSelector%/e","\$dateSelector", $val);
	$val = preg_replace("/%viewModes%/e","\$viewModes", $val);
	$val = preg_replace("/%menu%/e","\$calendarMenu", $val);
	$val = preg_replace("/%titleNav%/e","\$TitleText", $val);
	$val = preg_replace("/%miniPrev%/e","\$prevMiniCal", $val);
	$val = preg_replace("/%miniNext%/e","\$nextMiniCal", $val);
	$val = preg_replace("/%headers%/e","\$headers", $val);
	$val = preg_replace("/%cells%/e","\$cells", $val);
	echo stripslashes($val);
	}

include("footer.php");
//End output

?>