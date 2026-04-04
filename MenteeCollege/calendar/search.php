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

include("header.php");

//Set up the return
echo "<div id=\"nav\" style=\"text-align:left; padding:2px;\"><a href=\"{$insUrl}calendar.php\">{$Languages['nav']['return']}</a></div>";

//Are we searching?
if(trim($criteria) != "") {
	//Set up the criteria phrase
	$words = explode(" ",trim($criteria));
	while(list(,$val) = each($words)) {
		if($searchTitle == 1) {
			if($titlePhrase != "") { $titlePhrase .= " OR "; }
			$titlePhrase .= "event_title LIKE '%$val%'";
			}
		if($searchDesc == 1) {
			if($descPhrase != "") { $descPhrase .= " OR "; }
			$descPhrase .= "event_description LIKE '%$val%'";
			}
		if($searchLocation == 1) {
			if($locPhrase != "") { $locPhrase .= " OR "; }
			$locPhrase .= "(event_city LIKE '%$val%' OR event_state LIKE '%$val')";
			}		
		if($searchContact == 1) {
			if($contactPhrase != "") { $contactPhrase .= " OR "; }
			$contactPhrase .= "contact_name LIKE '%$val%'";
			}		
		}
	
	//Finalize our phrase
	$searchPhrase = "";
	if($searchTitle == 1) { $searchPhrase .= "($titlePhrase)"; }
	if($searchDesc == 1) { 
		if($searchPhrase != "") { $searchPhrase .= " OR "; }
		$searchPhrase .= "($descPhrase)"; 
		}
	if($searchLocation == 1) { 
		if($searchPhrase != "") { $searchPhrase .= " OR "; }
		$searchPhrase .= "($locPhrase)"; 
		}
	if($searchContact == 1) { 
		if($searchPhrase != "") { $searchPhrase .= " OR "; }
		$searchPhrase .= "($contactPhrase)"; 
		}
	$fromYear = sprintf("%04s",$fromYear);
	$fromMonth = sprintf("%02s",$fromMonth);
	$fromDay = sprintf("%02s",$fromDay);
	$fromDate = "{$fromYear}-{$fromMonth}-{$fromDay}";
	$toYear = sprintf("%04s",$toYear);
	$toMonth = sprintf("%02s",$toMonth);
	$toDay = sprintf("%02s",$toDay);
	$toDate = "{$toYear}-{$toMonth}-{$toDay}";
	
	//Run the query
	$counter = 0;
	$result = query("SELECT d.event_id,d.event_date,d.event_time_start,d.event_time_end,e.event_title,e.event_city,e.event_state,e.contact_name,e.contact_email,e.event_description,e.style_font_type,e.style_font_style,e.style_font_size,e.style_font_color FROM {$calendar_prefix}dates d LEFT JOIN {$calendar_prefix}events e ON d.event_id=e.event_id WHERE ({$searchPhrase}) AND (d.event_date BETWEEN '$fromDate' AND '$toDate') ORDER BY d.event_date,d.event_time_start LIMIT 25",$cal_link);
	while(list($event_id,$event_date,$event_start,$event_end,$event_title,$event_location1,$event_location2,$contact_name,$contact_email,$event_description,$style_font_type,$style_font_style,$style_font_size,$style_font_color) = mysql_fetch_row($result)) {
		$toLoad = getDisplay($event_id,$event_date,$event_start,$event_end,$event_title,$event_location1,$event_location2,$contact_name,$contact_email,$event_description,$font[$style_font_type],$style[$style_font_style],$size[$style_font_size],$color[$style_font_color]);
		$event_date = formatDate($event_date);
		$searchResults =<<<ENDROW
		<tr>
		 <td width="150">$event_date</td>
		 <td>$toLoad</td>
		</tr>
ENDROW;
		$counter++;
		}

	//Display the results
	if($counter == 0) { 
		$searchResults =<<<ENDROW
		<tr>
		 <td colspan="2" align="center"><br />{$Languages['search']['noresults']}<br /><br /></td>
		</tr>
ENDROW;
		}
		echo<<<ENDPRINT
		<div id="generalBox">
		<br />
		<table width="500" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td colspan="2" class="headtd">{$Languages['search']['results']}</td>
		 </tr>
		 $searchResults
		</table>
		</div>
ENDPRINT;
	}
	
//Display the search box
$result = query("SELECT event_date FROM {$calendar_prefix}dates ORDER BY event_date ASC LIMIT 1",$cal_link);
list($lowDate) = mysql_fetch_row($result);
if($lowDate == "") { $lowDate = date("Y-m-d",time()); }
$lowYear = substr($lowDate,0,4);
$result = query("SELECT event_date FROM {$calendar_prefix}dates ORDER BY event_date DESC LIMIT 1",$cal_link);
list($highDate) = mysql_fetch_row($result);
if($highDate == "") { $highDate = date("Y-m-d",time()); }
$highYear = substr($highDate,0,4);
for($i=1;$i<=12;$i++) {
	if($i == 1) { $fromMonth .= "<option value=\"$i\" selected>{$Languages['global']['monthshort'][$i]}</option>"; }
		else { $fromMonth .= "<option value=\"$i\">{$Languages['global']['monthshort'][$i]}</option>"; }
	if($i == 12) { $toMonth .= "<option value=\"$i\" selected>{$Languages['global']['monthshort'][$i]}</option>"; }
		else { $toMonth .= "<option value=\"$i\">{$Languages['global']['monthshort'][$i]}</option>"; }
	}
for($i=1;$i<=31;$i++) {
	if($i == 1) { $fromDay .= "<option value=\"$i\" selected>$i</option>"; }
		else { $fromDay .= "<option value=\"$i\">$i</option>"; }
	if($i == 31) { $toDay .= "<option value=\"$i\" selected>$i</option>"; }
		else { $toDay .= "<option value=\"$i\">$i</option>"; }
	}
for($i=$lowYear;$i<=$highYear;$i++) {
	if($i == $lowYear) { $fromYear .= "<option value=\"$i\" selected>$i</option>"; }
		else { $fromYear .= "<option value=\"$i\">$i</option>"; }
	if($i == $highYear) { $toYear .= "<option value=\"$i\" selected>$i</option>"; }
		else { $toYear .= "<option value=\"$i\">$i</option>"; }
	}

echo<<<ENDPRINT
<br />
<div id="generalBox">
<table width="500" border="0" cellspacing="1" cellpadding="3">
<form method="post" action="{$insUrl}search.php">
 <tr>
  <td colspan="2" class="headtd">{$Languages['search']['search']}</td>
 </tr>
 <tr>
  <td width="50%" align="right">{$Languages['search']['criteria']}:</td>
  <td width="50%"><input type="text" name="criteria" value="$origCriteria"></td>
 </tr>
 <tr>
  <td width="50%" align="right" valign="middle">{$Languages['search']['fields']}:</td>
  <td width="50%"><input type="checkbox" name="searchTitle" value="1" checked>{$Languages['search']['fieldstitle']}  <input type="checkbox" name="searchDesc" value="1" checked>{$Languages['search']['fieldsdesc']}  <input type="checkbox" name="searchLocation" value="1" checked>{$Languages['search']['fieldsloc']}  <input type="checkbox" name="searchContact" value="1" checked>{$Languages['search']['fieldscontact']}</td>
 </tr>
 <tr>
  <td width="50%" align="right" valign="middle">{$Languages['search']['date']}:</td>
  <td width="50%">
   <select name="fromMonth">$fromMonth</select><select name="fromDay">$fromDay</select><select name="fromYear">$fromYear</select><br />
   <select name="toMonth">$toMonth</select><select name="toDay">$toDay</select><select name="toYear">$toYear</select>
  </td>
 </tr>
 <tr>
  <td colspan="2" align="center"><input type="submit" value="{$Languages['search']['button']}"></td>
 </tr>
</form>
</table>
</div>
ENDPRINT;

include("footer.php");

?>	