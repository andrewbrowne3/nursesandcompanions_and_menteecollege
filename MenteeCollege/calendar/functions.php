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

error_reporting (E_ALL ^ E_NOTICE);

//Check for install script
if(is_file("{$insPath}install.php")) { die ("Remove the install.php file and any upgrade files from the server now."); }

//Prep variables
if(PHP_VERSION < '4.1.0')
{	
	$_GET = &$HTTP_GET_VARS;
        $_POST = &$HTTP_POST_VARS;
        $_COOKIE = &$HTTP_COOKIE_VARS;
        $_SERVER = &$HTTP_SERVER_VARS;
        $_ENV = &$HTTP_ENV_VARS;
        $_FILES = &$HTTP_POST_FILES;
}
$_REQUEST = array_merge($_GET, $_POST, $_COOKIE, $_SERVER, $_ENV, $_FILES);
unset($_REQUEST['insPath'],$_REQUEST['insUrl']);
if($_POST['insPath'] != "" || $_GET['insPath'] != "") { die(); }
$isMagic = get_magic_quotes_gpc();
$typesToRegister = array($_REQUEST);
foreach($typesToRegister as $varType)
{
	if(is_array($varType))
	{
		while(list($key,$value) = @each($varType))
		{
	        	if ($isMagic)
	        	{
	        		if(!is_array($value)) { $value = stripslashes($value); }
        		}
        		if(!defined('InAdmin')) { ${$key} = removeXSS($value); }
        			else  { ${$key} = $value; }
    		}
    	}
}
set_magic_quotes_runtime(0);

//Set globals
global $SystemOptions,$Languages,$type,$calendar,$calendarList,$calTitles,$DateFormat;
$SystemOptions = array();
$result = query("SELECT item,value FROM {$calendar_prefix}system",$cal_link);
while(list($item,$value) = mysql_fetch_row($result)) {
	$SystemOptions[$item] = $value;
	}

//Set language
if(isset($_COOKIE[$cookie_prefix."langOverride"])) { $SystemOptions['language'] = $_COOKIE[$cookie_prefix."langOverride"]; }
include("{$insPath}languages/{$SystemOptions['language']}.php");
$DateFormat = explode(",",$Languages['dateformat']);

//Set integration
include("{$insPath}integration/{$SystemOptions['integration']}.php");

//Strip XSS attacks
function removeXSS($val) 
{
   	$val = preg_replace('/([\x00-\x08][\x0b-\x0c][\x0e-\x20])/', '', $val);
   	$search = 'abcdefghijklmnopqrstuvwxyz';
   	$search .= 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
   	$search .= '1234567890!@#$%^&*()';
   	$search .= '~`";:?+/={}[]-_|\'\\';
   	for ($i = 0; $i < strlen($search); $i++) 
   	{
      		$val = preg_replace('/(&#[x|X]0{0,8}'.dechex(ord($search[$i])).';?)/i', $search[$i], $val);
      		$val = preg_replace('/(&#0{0,8}'.ord($search[$i]).';?)/', $search[$i], $val);
	}
   	$ra1 = Array('javascript', 'vbscript', 'expression', 'applet', 'meta', 'xml', 'blink', 'link', 'style', 'script', 'embed', 'object', 'iframe', 'frame', 'frameset', 'ilayer', 'layer', 'bgsound', 'title', 'base');
   	$ra2 = Array('onabort', 'onactivate', 'onafterprint', 'onafterupdate', 'onbeforeactivate', 'onbeforecopy', 'onbeforecut', 'onbeforedeactivate', 'onbeforeeditfocus', 'onbeforepaste', 'onbeforeprint', 'onbeforeunload', 'onbeforeupdate', 'onblur', 'onbounce', 'oncellchange', 'onchange', 'onclick', 'oncontextmenu', 'oncontrolselect', 'oncopy', 'oncut', 'ondataavailable', 'ondatasetchanged', 'ondatasetcomplete', 'ondblclick', 'ondeactivate', 'ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop', 'onerror', 'onerrorupdate', 'onfilterchange', 'onfinish', 'onfocus', 'onfocusin', 'onfocusout', 'onhelp', 'onhover', 'onkeydown', 'onkeypress', 'onkeyup', 'onlayoutcomplete', 'onload', 'onlosecapture', 'onmousedown', 'onmouseenter', 'onmouseleave', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onmousewheel', 'onmove', 'onmoveend', 'onmovestart', 'onpaste', 'onpropertychange', 'onreadystatechange', 'onreset', 'onresize', 'onresizeend', 'onresizestart', 'onrowenter', 'onrowexit', 'onrowsdelete', 'onrowsinserted', 'onscroll', 'onselect', 'onselectionchange', 'onselectstart', 'onstart', 'onstop', 'onsubmit', 'onunload');
   	$ra = array_merge($ra1, $ra2);
   	$found = true; 
   	while ($found == true) 
   	{
      		$val_before = $val;
      		for ($i = 0; $i < sizeof($ra); $i++) 
      		{
         		$pattern = '/';
         		for ($j = 0; $j < strlen($ra[$i]); $j++) 
         		{
            			if ($j > 0) 
            			{
               				$pattern .= '(';
               				$pattern .= '(&#[x|X]0{0,8}([9][a][b]);?)?';
               				$pattern .= '|(&#0{0,8}([9][10][13]);?)?';
               				$pattern .= ')?';
            			}
            			$pattern .= $ra[$i][$j];
         		}
         		$pattern .= '/i';
         		$replacement = substr($ra[$i], 0, 2).'||x||'.substr($ra[$i], 2);
         		$val = preg_replace($pattern, $replacement, $val);
         		if ($val_before == $val) { $found = false; }
      		}
   	}
   	return $val;
}

//Date Chooser for navigation
function dateChooser($d_day,$d_month,$d_year) {
	global $Languages,$day,$month,$year,$type,$calendar,$category,$cal_link,$calendar_prefix,$insUrl,$DateFormat;
	$m = "<select name=\"month\">";
	for($i=01; $i<=12; $i++) { if($i == $d_month) { $m .=  "<option value=\"$i\" selected>".$Languages['global']['months'][$i]."</option>"; } else { $m .=  "<option value=\"$i\">".$Languages['global']['months'][$i]."</option>"; } }
	$m .= "</select>";
	$d = "<select name=\"day\">";
	for($i=1; $i<=31; $i++) { if($i == $d_day) { $d .= "<option value=\"$i\" selected>$i</option>"; } else { $d .= "<option value=\"$i\">$i</option>"; } }
	$d .= "</select>";
	$y = "<select name=\"year\">";
	for($i =$d_year-5; $i<=$d_year+5; $i++) { if($i == $d_year) { $y .= "<option value=\"$i\" selected>$i</option>"; } else { $y .= "<option value=\"$i\">$i</option>"; } }
	$y .= "</select>";
	$dateLine .= ${$DateFormat[0]}.${$DateFormat[1]}.${$DateFormat[2]};

	$output = <<<ENDFORM
	<div id="nav">
	<table cellspacing="0" cellpadding="0" cellspacing="0" style="border:0px;">
	<form method="post" action="{$insUrl}calendar.php" onReset="javascript:location.href='{$insUrl}calendar.php';">
        <input type="hidden" name="type" value="$type">
         <tr>
          <td>
           $dateLine<input type="submit" value="{$Languages['nav']['go']}"><input type="reset" value="{$Languages['nav']['today']}">
          </td>
         </tr>
	</form>
	</table>
	</div>
ENDFORM;
	return $output;
	}
	
//Menu for navigation
function calendarMenu() {
	global $Languages,$SystemOptions,$type,$insUrl;

	$output = <<<ENDPRINT
	<div id="menu">{$Languages['nav']['menu']}: <a href="{$insUrl}search.php">{$Languages['nav']['search']}</a> | <a href="javascript:void(0);" onClick="javascript:window.print();">{$Languages['nav']['print']}</a>
ENDPRINT;
	if($SystemOptions['admin_link'] == 1) { $output .= " | <a href=\"{$insUrl}admin/index.php\">{$Languages['nav']['admin']}</a>"; }
	$output .= "&nbsp;</div>";
	return $output;
	}
	
//Calendar title/banners/month nav
function titleText() {
	global $SystemOptions,$Languages,$day,$month,$year,$type,$insUrl,$insPath,$DateFormat;
	
	$calTitle = stripslashes($SystemOptions['calendar_title']);
	switch($type) {
		case "day":
			$next_day = date("d",mktime (01,01,01,$month,$day+1,$year));
			$next_month = date("m",mktime (01,01,01,$month,$day+1,$year));
			$next_year = date("Y",mktime (01,01,01,$month,$day+1,$year));
			$prev_day = date("d",mktime (01,01,01,$month,$day-1,$year));
			$prev_month = date("m",mktime (01,01,01,$month,$day-1,$year));
			$prev_year = date("Y",mktime (01,01,01,$month,$day-1,$year));
			$bmonth = date("n",mktime (01,01,01,$month,$day,$year));
			$m = $Languages['global']['months'][$bmonth];
			$d = sprintf("%01d",$day);
			$y = $year;
			if($SystemOptions['language'] == "t_chinese" || $SystemOptions['language'] == "s_chinese") { $bar_text = ${$DateFormat[1]}." ".${$DateFormat[2]}." {$Languages['nav']['day']}"; }
				else { $bar_text = ${$DateFormat[0]}." ".${$DateFormat[1]}." ".${$DateFormat[2]}; }
			$TitleText = <<<ENDPRINT
			<div id="title">
		 	$banner<br>
		 	$calTitle<br>
		 	<br>
		 	<a href="calendar.php?type=day&day=$prev_day&month=$prev_month&year=$prev_year">{$Languages['nav']['prevsyb']}</a> $bar_text <a href="calendar.php?type=day&day=$next_day&month=$next_month&year=$next_year">{$Languages['nav']['nextsyb']}</a>
ENDPRINT;
			break;

		case "week":
			$next_day = date("d",mktime (01,01,01,$month,$day+7,$year));
			$next_month = date("m",mktime (01,01,01,$month,$day+7,$year));
			$next_year = date("Y",mktime (01,01,01,$month,$day+7,$year));
			$prev_day = date("d",mktime (01,01,01,$month,$day-7,$year));
			$prev_month = date("m",mktime (01,01,01,$month,$day-7,$year));
			$prev_year = date("Y",mktime (01,01,01,$month,$day-7,$year));
			$dow = date("w",mktime(01,01,01,$month,$day,$year));
			$bmonth = date("n",mktime (01,01,01,$month,$day,$year));
			$m = $Languages['global']['months'][$bmonth];
			$d = sprintf("%01d",$day);
			$y = $year;
			if($SystemOptions['language'] == "t_chinese" || $SystemOptions['language'] == "s_chinese") { $bar_text .= ${$DateFormat[0]}." {$Languages['nav']['year']} ".${$DateFormat[1]}." ".${$DateFormat[2]}." {$Languages['nav']['day']}"; }
				else { $bar_text .= ${$DateFormat[0]}." ".${$DateFormat[1]}." ".${$DateFormat[2]}; }
			$TitleText = <<<ENDPRINT
			<div id="title">
		 	$banner<br>
		 	$calTitle<br>
		 	<br>
		 	<a href="calendar.php?type=week&day=$prev_day&month=$prev_month&year=$prev_year">{$Languages['nav']['prevsyb']}</a>{$Languages['nav']['weekof']}  $bar_text <a href="calendar.php?type=week&day=$next_day&month=$next_month&year=$next_year">{$Languages['nav']['nextsyb']}</a>
ENDPRINT;
			break;

		case "2week":
			$next_day = date("d",mktime (01,01,01,$month,$day+14,$year));
			$next_month = date("m",mktime (01,01,01,$month,$day+14,$year));
			$next_year = date("Y",mktime (01,01,01,$month,$day+14,$year));
			$prev_day = date("d",mktime (01,01,01,$month,$day-14,$year));
			$prev_month = date("m",mktime (01,01,01,$month,$day-14,$year));
			$prev_year = date("Y",mktime (01,01,01,$month,$day-14,$year));
			$dow = date("w",mktime(01,01,01,$month,$day,$year));
			switch($SystemOptions['day_layout']) {
				case 1: $offset = 0; break;
				case 2: $offset = -1; break;
				case 3: $offset = 1; break;
				}
			$week1_month = date("n",mktime (01,01,01,$month,$day-$dow+$offset,$year));
			$week1_day = date("j",mktime (01,01,01,$month,$day-$dow+$offset,$year));
			$week1_year = date("Y",mktime (01,01,01,$month,$day-$dow+$offset,$year));
			$week2_month = date("n",mktime (01,01,01,$month,$day+7-$dow+$offset,$year));
			$week2_day = date("j",mktime (01,01,01,$month,$day+7-$dow+$offset,$year));
			$week2_year = date("Y",mktime (01,01,01,$month,$day+7-$dow+$offset,$year));
			$m = $Languages['global']['months'][$week1_month];
			$d = sprintf("%01d",$week1_day);
			$y = $week1_year;
			if($SystemOptions['language'] == "t_chinese" || $SystemOptions['language'] == "s_chinese") { $bar_text = ${$DateFormat[0]}." {$Languages['nav']['year']} ".${$DateFormat[1]}." ".${$DateFormat[2]}." {$Languages['nav']['day']}"; }
				else { $bar_text = ${$DateFormat[0]}." ".${$DateFormat[1]}." ".${$DateFormat[2]}; }
			$bar_text .= " ".$Languages['nav']['and']." ";
			$m = $Languages['global']['months'][$week2_month];
			$d = sprintf("%01d",$week2_day);
			$y = $week2_year;
			if($SystemOptions['language'] == "t_chinese" || $SystemOptions['language'] == "s_chinese") { $bar_text .= ${$DateFormat[0]}." {$Languages['nav']['year']} ".${$DateFormat[1]}." ".${$DateFormat[2]}." {$Languages['nav']['day']}"; }
				else { $bar_text .= ${$DateFormat[0]}." ".${$DateFormat[1]}." ".${$DateFormat[2]}; }
			$TitleText = <<<ENDPRINT
			<div id="title">
		 	$banner<br>
		 	$calTitle<br>
		 	<br>
		 	<a href="calendar.php?type=2week&day=$prev_day&month=$prev_month&year=$prev_year">{$Languages['nav']['prevsyb']}</a> {$Languages['nav']['weeksof']}  $bar_text <a href="calendar.php?type=2week&day=$next_day&month=$next_month&year=$next_year">{$Languages['nav']['nextsyb']}</a>
ENDPRINT;
			break;

		case "month":
			$next_month = date("m",mktime (01,01,01,$month+1,1,$year));
			$next_year = date("Y",mktime (01,01,01,$month+1,1,$year));
			$prev_month = date("m",mktime (01,01,01,$month-1,1,$year));
			$prev_year = date("Y",mktime (01,01,01,$month-1,1,$year));
			$bmonth = date("n",mktime (01,01,01,$month,$day,$year));
			$bar_text = "{$Languages['global']['months'][$bmonth]} $year";
			$TitleText = <<<ENDPRINT
			<div id="title">
		 	$banner<br>
		 	$calTitle<br>
		 	<br>
		 	<a href="calendar.php?type=month&month=$prev_month&year=$prev_year">{$Languages['nav']['prevsyb']}</a> $bar_text <a href="calendar.php?type=month&month=$next_month&year=$next_year">{$Languages['nav']['nextsyb']}</a>
ENDPRINT;
			break;

		case "year":
			$next_year = date("Y",mktime (01,01,01,$month,$day,$year+1));
			$prev_year = date("Y",mktime (01,01,01,$month,$day,$year-1));
			$bar_text = date("Y",mktime (01,01,01,$month,$day,$year));
			$TitleText = <<<ENDPRINT
			<div id="title">
		 	$banner<br>
		 	$calTitle<br>
		 	<br>
		 	<a href="calendar.php?type=year&day=1&month=1&year=$prev_year">{$Languages['nav']['prevsyb']}</a> $bar_text <a href="calendar.php?type=year&day=1&month=1&year=$next_year">{$Languages['nav']['nextsyb']}</a>
ENDPRINT;
			break;
		}
	return $TitleText;
	}

//Create MiniCalendars
function miniCal($m_month,$m_year,$type=1) {
	global $SystemOptions,$Languages,$calendar_prefix,$cal_link,$insUrl,$DateFormat;

	//Set some initial variables
	$firstDayOfMonth = date("w",mktime (01,01,01,$m_month,01,$m_year));
	$numberOfDays = date("t",mktime (01,01,01,$m_month,01,$m_year));
	$monthText = "<a class=\"month\" href=\"{$insUrl}calendar.php?type=month&day=1&month=$m_month&year=$m_year\">".$Languages['global']['months'][sprintf("%01d",$m_month)]."</a>";
	$month = sprintf("%02s",$m_month);

	//Set our date range for this view mode
	$fromDate = date("Y-m-d",mktime(01,01,01,$m_month,1,$m_year));
	$toDate =   date("Y-m-d",mktime(01,01,01,$m_month,$numberOfDays,$m_year));
	$startDay = 1;
	$endDay = $numberOfDays;

	//Run the query
	$result = query("SELECT event_date FROM {$calendar_prefix}dates WHERE event_date BETWEEN '$fromDate' AND '$toDate' ORDER BY event_date",$cal_link);

	//Parse it out
	while(list($event_date) = mysql_fetch_row($result)) {
		//Set the position, and prep the data
		$position = date("j",strtotime("$event_date"));

		//Load the cell
		$tmpEventData[$position] = "TRUE";
		}

	//Set the header text and adjust for the layout option
	for($i=0;$i<=6;$i++) {
		$cell_header[$i+1] = $Languages['global']['daysupershort'][$i];
		}

	//Initialize the CSS for all possible cells
	for($i=1;$i<=42;$i++) {
		$css_data[$i] = "empty";
		}

	$positionAdjustment = 0;
	for($dayNumber=1; $dayNumber<=$endDay; $dayNumber++) {
		//Set the cell position, from 1 to 42
		$position = $firstDayOfMonth + $dayNumber + $positionAdjustment;

		//Shift the results forward if needed
		if($position <= 0) { $position = $position + 7; $positionAdjustment = 7; }

		//Shift the results backwards to eliminate blank rows if needed
		if($dayNumber == 1 && $position > 7) { $position = $position - 7; $positionAdjustment = -7; }
		if($tmpEventData[$dayNumber] == "TRUE") {
			$date[$position] = "<a class=\"day\" href=\"{$insUrl}calendar.php?type=day&day=$dayNumber&month=$m_month&year=$m_year\">$dayNumber</a>";
			}
			else { $date[$position] = "<span class=\"day\">$dayNumber</span>"; }
		if($type == 2) { $date[$position] .= "<br><br>"; }

		//Set the CSS for the cell
		$css_data[$position] = "active";
		if($tmpEventData[$dayNumber] == "TRUE")  { $css_data[$position] = "full"; }
		}

	//Load the cells
	for($i=1;$i<=42;$i++) {
		$cell_content[$i] =<<<ENDCELL
		<div align="right">{$date[$i]}</div>
ENDCELL;
		}

	//Set the size
	if($type == 1) {
		$width = 120;
		$template = file("{$insPath}templates/cal_mini.inc");
		}
		else {
		$width = "100%";
			$template = file("{$insPath}templates/cal_mid.inc");
			}

	//Read in our template, and fill in the blanks
	while(list(,$val) = each($template)) {
		$val = preg_replace("/%css_data\[(.*?)\]%/e","\$css_data[\\1]", $val);
		$val = preg_replace("/%cell_content\[(.*?)\]%/e","\$cell_content[\\1]",$val);
		$val = preg_replace("/%cell_header\[(.*?)\]%/e","\$cell_header[\\1]",$val);
		$val = preg_replace("/%cell_month%/e","\$monthText",$val);
		$val = preg_replace("/%width%/e","\$width",$val);
		$miniCal .= stripslashes($val);
		}
	return $miniCal;
	}

//Format the date
function formatDate($date) {
	global $Languages;
	$parts = explode("-",$date);
	$bmonth = date("n",mktime (01,01,01,$parts[1],$parts[2],$parts[0]));
	$m = $Languages['global']['months'][$bmonth];
	$d = sprintf("%01d",$parts[2]);
	$y = $parts[0];
	$DateFormat = explode(",",$Languages['dateformat']);
	$return = ${$DateFormat[0]}." ".${$DateFormat[1]}." ".${$DateFormat[2]};
	return $return;
	}

//Format time for display
function formatTime($time) {
	global $Languages;
	if($Languages['timeformat'] == "12") {
		$parts = explode(":",$time);
		$hour = intval($parts[0]);
		$minute = $parts[1];
		$ampm = "&nbsp;".strftime("%p",mktime($hour,$minute,0,1,1,1));
		if($hour >= 13) {
			$hour -= 12;
			}
		if($hour == 0) { $hour = "12"; }
		$time_return = $hour.":".$minute.$ampm;
		}
		else {
			$parts = explode(":",$time);
			$hour = intval($parts[0]);
			$minute = $parts[1];
			$time_return = sprintf("%02s",$hour).":".$minute;
			}

	return $time_return;
	}

//Convert email address to JS document.write
function toEmail($email) {
	$emailParts = explode("@",$email);
	$return =<<<ENDRETURN
<script type="text/javascript">
<!--
var theAt = "@";
document.write('<a href="mailto:'+'{$emailParts[0]}'+theAt+'{$emailParts[1]}">{$emailParts[0]}'+theAt+'{$emailParts[1]}</a>');
//-->
</script>
ENDRETURN;
	
	return $return;
	}

//Convert markups to HTML for display
function toHtml($text,$isMail=0) {
	// Stripslashes and pad the beginning of the text
	$text = " ".stripslashes($text);

	if($isMail == 0) {
		//Replace ' " `
		$text = str_replace("\"","&quot;",$text);
		$text = str_replace("“","&quot;",$text);
		$text = str_replace("”","&quot;",$text);
		$text = str_replace("'","&rsquo;",$text);
		$text = str_replace("’","&rsquo;",$text);
		$text = str_replace("‘","&lsquo;",$text);
		}

    	// Convert near-URL tags to HTML
    	$text = preg_replace("#([\n\r ])([a-z]+?)://([^, \n\r]+)#i", "\\1<a href=\"\\2://\\3\" target=\"_blank\">\\2://\\3</a>", $text);
	$text = preg_replace("#([\n\r ])www\.([a-z0-9\-]+)\.([a-z0-9\-.\~]+)((?:/[^, \n\r]*)?)#i", "\\1<a href=\"http://www.\\2.\\3\\4\" target=\"_blank\">www.\\2.\\3\\4</a>", $text);
	$text = preg_replace("#([\n\r ])([a-z0-9\-_.]+?)@([^, \n\r]+)#i", "\\1<a href=\"mailto:\\2@\\3\">\\2@\\3</a>", $text);

    	// Convert URL tags to HTML
    	$text = preg_replace("/\[url\]ftp:\/\/([^\[]*?)\[\/url\]/i","<a href=\"ftp://\\1\" target=\"_blank\">ftp://\\1</a>",$text);
    	$text = preg_replace("/\[url\]http:\/\/([^\[]*?)\[\/url\]/i","<a href=\"http://\\1\" target=\"_blank\">http://\\1</a>",$text);
    	$text = preg_replace("/\[url\]https:\/\/([^\[]*?)\[\/url\]/i","<a href=\"https://\\1\" target=\"_blank\">https://\\1</a>",$text);
    	$text = preg_replace("/\[url\]([^\[]*?)\[\/url\]/i","<a href=\"http://\\1\" target=\"_blank\">\\1</a>",$text);
    	$text = preg_replace("/\[url=https:\/\/(.*?)\](.*?)\[\/url\]/i","<a href=\"https://\\1\" target=\"_blank\">\\2</a>",$text);
    	$text = preg_replace("/\[url=(.*?)\](.*?)\[\/url\]/i","<a href=\"\\1\" target=\"_blank\">\\2</a>",$text);

	// Convert IMG tags to HTML
    	$text = preg_replace("/\[img\]([^\[]*?)\[\/img\]/i","<img src=\"\\1\">",$text);

    	// Convert bolds,italics,underline and strike
    	$text = str_replace("[b]","<b>",$text);
    	$text = str_replace("[/b]","</b>",$text);
    	$text = str_replace("[i]","<i>",$text);
    	$text = str_replace("[/i]","</i>",$text);
    	$text = str_replace("[u]","<u>",$text);
    	$text = str_replace("[/u]","</u>",$text);
    	$text = str_replace("[s]","<strike>",$text);
    	$text = str_replace("[/s]","</strike>",$text);

	// Alignment
    	$text = str_replace("[right]","<div style=\"text-align:right\">",$text);
    	$text = str_replace("[/right]","</div>",$text);
    	$text = str_replace("[justify]","<div style=\"text-align:justify;\">",$text);
    	$text = str_replace("[/justify]","</div>",$text);
    	$text = str_replace("[center]","<div style=\"text-align:center\">",$text);
    	$text = str_replace("[/center]","</div>",$text);

    	// Convert the color codes
	$text = preg_replace("/\[color=(.*?)\](.*?)/i","<span style=\"color:\\1\">\\2",$text);
	$text = preg_replace("/\[\/color\]/i","</span>",$text);

	// Convert sizes
	$text = preg_replace("/\[size=(.*?)\](.*?)/i","<span style=\"font-size:\\1pt\">\\2",$text);
	$text = preg_replace("/\[\/size\]/i","</span>",$text);

	// Convert fonts
	$text = preg_replace("/\[font=(.*?)\](.*?)/i","<span style=\"font-family:\\1\">\\2",$text);
	$text = preg_replace("/\[\/font\]/i","</span>",$text);

    	// Do list elements
    	$text = preg_replace("/(\[list\])\n?\r?(.+?)(\[\/list\])/is","<ul type=\"square\">\\2</ul>",$text);
    	$text = preg_replace("/(\[list=)(A|1)(\])\n?\r?(.+?)(\[\/list\])/is","<ol type=\"\\2\">\\4</ol>",$text);
    	$text = preg_replace("/\n?\r?(\[\*\])/is","<li>",$text);

    	// Quote markup
    	$text = str_replace("[quote]","<blockquote>Quote:<hr /><br />",$text);
    	$text = str_replace("[/quote]","<br /><br /><hr /></blockquote>",$text);

    	// Convert email markup to html
    	$text = eregi_replace("\[email\]([^\[]*)\[/email\]","<a href=\"mailto:\\1\">\\1</a>",$text);

	// Convert newlines
	$text = str_replace("\n","<br clear=\"all\">",$text);
	$text = str_replace("\r","",$text);

	return substr($text,1);
	}

//Convert marks to HTML for display
function toEdit($text) {
	// Stripslashes
	$text = stripslashes($text);

	//Replace ' " `
	$text = str_replace("\"","&quot;",$text);
	$text = str_replace("“","&quot;",$text);
	$text = str_replace("”","&quot;",$text);
	$text = str_replace("’","&rsquo;",$text);
	$text = str_replace("‘","&lsquo;",$text);

	return $text;
	}
	
//Create HTML email
function htmlMail($from,$to,$subject,$content) {
	global $SystemOptions,$Languages;

	if($SystemOptions['language'] == "japanese") { $subject = "=?EUC-JP?B?".base64_encode($subject)."?="; }

	$content = toHtml($content,1);
	$striped_content = strip_tags(str_replace("<br clear=\"all\">","\r\n",$content));

	$semi_rand = md5(time());
	$mime_boundary = "==Multipart_Boundary_x".$semi_rand."x";
	$headers = "From: $from\n";
	$headers .= "X-Mailer: BosDates via PHP\n";
	$headers .= "MIME-Version: 1.0\n";
	$headers .= "Content-Type: multipart/alternative;\n";
	$headers .= " boundary=\"{$mime_boundary}\"";
	$message = "This is a multi-part message in MIME format.\n";
	$message .= "\n";
	$message .= "--{$mime_boundary}\n";
	$message .= "Content-Type:text/html; charset=\"{$Languages['global']['charset']}\"\n";
	$message .= "Content-Transfer-Encoding: 7bit\n\n";
	$message .= "<html><head></head><body>\n";
	$message .= $content."\n";
	$message .= "</body></html>\n";
	$message .= "\n";
	$message .= "--{$mime_boundary}\n";
	$message .= "Content-Type:text/plain; charset=\"{$Languages['global']['charset']}\"\n";
	$message .= "Content-Transfer-Encoding: 7bit\n";
	$message .= "\n";
	$message .= $striped_content."\n";
	$message .= "\n";
	$message .= "--{$mime_boundary}--\n";
	mail($to,$subject,$message,$headers);

	return;
	}
	
//Ensure a proper URL
function validateUrl($url) {
	if(trim($url) == "") { return; }

	$urlParts = parse_url($url);
	if($urlParts['host'] == "") { $urlParts = parse_url("http://{$url}"); }

	//Check for http
	if($urlParts['scheme'] == "") { $urlParts['scheme'] = "http"; }

	//Check for www.www.www type host
	if(substr_count($urlParts['host'],".") < 2) { $urlParts['host'] = "www.{$urlParts['host']}"; }

	//Setup new url
	$urlReturn = "{$urlParts['scheme']}://{$urlParts['host']}";
	if($urlParts['path'] != "") { $urlReturn .= $urlParts['path']; }
	if($urlParts['query'] != "") { $urlReturn .= "?".$urlParts['query']; }
	if($urlParts['fragment'] != "") { $urlReturn .= "#".$urlParts['fragment']; }

	return $urlReturn;
	}
	
//Setup the display
function getDisplay($event_id,$event_date,$event_start,$event_end,$event_title,$event_location1,$event_location2,$contact_name,$contact_email,$event_description,$style_font_type,$style_font_style,$style_font_size,$style_font_color,$framed=0) {
	global $SystemOptions,$Languages,$insUrl,$DateFormat;

	//Calendar display items
	if($event_start != "00:00:01") {
		$start = formatTime($event_start);
		$end = formatTime($event_end);
		if((($SystemOptions['events_display'] & 1) != 0) && (($SystemOptions['events_display'] & 2) != 0) && $event_end != "23:59:59") { $display .= "$start-$end<br />"; }
		if((($SystemOptions['events_display'] & 1) != 0) && (($SystemOptions['events_display'] & 2) != 0) && $event_end == "23:59:59") { $display .= "$start<br />"; }
		if((($SystemOptions['events_display'] & 1) != 0) && (($SystemOptions['events_display'] & 2) == 0)) { $display .= "$start<br />"; }
		if((($SystemOptions['events_display'] & 1) == 0) && (($SystemOptions['events_display'] & 2) != 0)) { $display .= "$end<br />"; }
		}
	if(($SystemOptions['events_display'] & 4) != 0 && $event_title != "") { $display .= "$event_title<br />"; }
	if(($SystemOptions['events_display'] & 8) != 0 && $event_description != "") { $display .= toHtml($event_description); }
	if((($SystemOptions['events_display'] & 16) != 0) && (($SystemOptions['events_display'] & 32) != 0) && ($event_location1 != "" && $event_location2 != "")) { $display .= "$event_location1 $event_location2<br />"; }
	if((($SystemOptions['events_display'] & 16) != 0) && (($SystemOptions['events_display'] & 32) == 0) && $event_location1 != "") { $display .= "$event_location1<br />"; }
	if((($SystemOptions['events_display'] & 16) == 0) && (($SystemOptions['events_display'] & 32) != 0) && $event_location2 != "") { $display .= "$event_location2<br />"; }
	if(($SystemOptions['events_display'] & 64) != 0 && $contact_name != "") { $display .= "$contact_name<br />"; }
	if(($SystemOptions['events_display'] & 128) != 0 && $contact_email != "") { $display .= "$contact_email<br />"; }

	//Hover box items
	$hoverOptions = 15;
	if($event_start != "" && $event_start != "00:00:01") {
		$hstart = formatTime($event_start);
		$hend = formatTime($event_end);
		if((($hoverOptions & 1) != 0) && (($hoverOptions & 2) != 0) && $event_end != "23:59:59") { $hover .= "<b>{$Languages['event']['time']}:</b>&nbsp;$hstart-$hend<br />"; }
		if((($hoverOptions & 1) != 0) && (($hoverOptions & 2) != 0) && $event_end == "23:59:59") { $hover .= "<b>{$Languages['event']['time']}:</b>&nbsp;$hstart<br />"; }
		if((($hoverOptions & 1) != 0) && (($hoverOptions & 2) == 0)) { $hover .= "<b>{$Languages['event']['time']}:</b>&nbsp;$hstart<br />"; }
		if((($hoverOptions & 1) == 0) && (($hoverOptions & 2) != 0)) { $hover .= "<b>{$Languages['event']['time']}:</b>&nbsp;$hend<br />"; }
		}
	if(($hoverOptions & 4) != 0 && $event_title != "") { $event_title = ($event_title); $hover .= "<b>{$Languages['event']['title']}:</b>&nbsp;$event_title<br />"; }
	if(($hoverOptions & 8) != 0 && $event_description != "") {
		$display_description = preg_replace("/\[image(.*?)\]/","",$event_description);
		$display_description = str_replace("</p><p>"," ",$display_description);
		$display_description = strip_tags(str_replace("\r\n"," ",$display_description));
		$display_description = str_replace("\r"," ",$display_description);
		$display_description = str_replace("\n"," ",$display_description);
		if(strlen($display_description) > 100) {
			$display_description = substr($display_description,0,100 + strpos(substr($display_description,100)," "))."...";
			}
		$hover .= "<b>{$Languages['event']['description']}:</b><br />$display_description";
		}
	$hover = str_replace("'","&rsquo;",$hover);
	$hover = str_replace("\"","&quot;",$hover);
	$hover = str_replace("&#39;","&rsquo;",$hover);

	//Create the link
	$linkStyle = "$style_font_type $style_font_style $style_font_size $style_font_color";
	if($hover != "") { $hoverDetails = "onMouseOver=\"javascript:eventDetailsBox('$hover');\" onMouseOut=\"javascript:hideEventDetailsBox();\""; }
	if($framed == 1) {
		$hoverDetails = "";
		$target = "target=\"_top\"";
		}
	if($SystemOptions['events_popup'] == 0) { $theLink = "<a $target $hoverDetails style=\"$linkStyle\" href=\"{$insUrl}event.php?event=$event_id&date=$event_date\">"; }
		else { $theLink = "<a $hoverDetails style=\"$linkStyle\" href=\"javascript:popUp('{$insUrl}event.php?event=$event_id&date=$event_date','520','520');\">"; }

	$return =<<<ENDCELL
	<table width="100%" border="0" cellspacing="1" cellpadding="1" style="border:0px; $colorBackground">
	 <tr>
	  <td valign="top" align="{$SystemOptions['events_align']}">{$theLink}{$display}</a></td>
	 </tr>
	</table>
ENDCELL;

	return $return;
	}						

function viewMenu($type,$day,$month,$year) {
	global $insUrl,$Languages;
	
	switch($type) {
		case "day":   $dCSS = "navOn"; $wCSS = "navOff"; $w2CSS = "navOff"; $mCSS = "navOff"; $yCSS = "navOff"; break;
		case "week":  $dCSS = "navOff"; $wCSS = "navOn"; $w2CSS = "navOff"; $mCSS = "navOff"; $yCSS = "navOff"; break;
		case "2week": $dCSS = "navOff"; $wCSS = "navOff"; $w2CSS = "navOn"; $mCSS = "navOff"; $yCSS = "navOff"; break;
		case "month": $dCSS = "navOff"; $wCSS = "navOff"; $w2CSS = "navOff"; $mCSS = "navOn"; $yCSS = "navOff"; break;
		case "year":  $dCSS = "navOff"; $wCSS = "navOff"; $w2CSS = "navOff"; $mCSS = "navOff"; $yCSS = "navOn"; break;
		}
		
	$viewMenu =<<<ENDPRINT
	<table width="300" border="0" cellspacing="0" cellpadding="0" style="border:0px;">
	 <tr>		
          <td width="60" align="center" class="$dCSS" onMouseOver="this.className='navOn'" onMouseOut="this.className='$dCSS'"><a href="{$insUrl}calendar.php?type=day&day=$day&month=$month&year=$year">{$Languages['nav']['day']}</a></td>
          <td width="60" align="center" class="$wCSS" onMouseOver="this.className='navOn'" onMouseOut="this.className='$wCSS'"><a href="{$insUrl}calendar.php?type=week&day=$day&month=$month&year=$year">{$Languages['nav']['week']}</a></td>
          <td width="60" align="center" class="$w2CSS" onMouseOver="this.className='navOn'" onMouseOut="this.className='$w2CSS'"><a href="{$insUrl}calendar.php?type=2week&day=$day&month=$month&year=$year">{$Languages['nav']['2week']}</a></td>
          <td width="60" align="center" class="$mCSS" onMouseOver="this.className='navOn'" onMouseOut="this.className='$mCSS'"><a href="{$insUrl}calendar.php?type=month&day=$day&month=$month&year=$year">{$Languages['nav']['month']}</a></td>
          <td width="60" align="center" class="$yCSS" onMouseOver="this.className='navOn'" onMouseOut="this.className='$yCSS'"><a href="{$insUrl}calendar.php?type=year&day=$day&month=$month&year=$year">{$Languages['nav']['year']}</a></td>
         </tr>
        </table> 
ENDPRINT;

	return $viewMenu;	
	}
	
?>