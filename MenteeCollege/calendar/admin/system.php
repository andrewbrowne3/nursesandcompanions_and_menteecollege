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
	case "system":
		//Prep the data
		while(list($key,$val) = each($SystemOptions)) {
			$SystemOptions['$key'] = toEdit($val);
			}

		//Load boxes as needed
		if($SystemOptions['admin_link'] == "1") { $adminLinkBox = "<option value=\"1\" selected>{$Languages['admin']['yes']}</option><option value=\"0\">{$Languages['admin']['no']}</option>"; }
			else { $adminLinkBox = "<option value=\"1\">{$Languages['admin']['yes']}</option><option value=\"0\" selected>{$Languages['admin']['no']}</option>"; }
		switch($SystemOptions['events_align']) {
				case "left": $alignBox = "<option value=\"left\" selected>{$Languages['admin']['systemleft']}</option><option value=\"center\">{$Languages['admin']['systemcenter']}</option><option value=\"right\">{$Languages['admin']['systemright']}</option>"; break;
				case "center": $alignBox = "<option value=\"left\">{$Languages['admin']['systemleft']}</option><option value=\"center\" selected>{$Languages['admin']['systemcenter']}</option><option value=\"right\">{$Languages['admin']['systemright']}</option>"; break;
				case "right": $alignBox = "<option value=\"left\">{$Languages['admin']['systemleft']}</option><option value=\"center\">{$Languages['admin']['systemcenter']}</option><option value=\"right\" selected>{$Languages['admin']['systemright']}</option>"; break;
				}
		if($SystemOptions['events_popup'] == "1") { $popupBox = "<option value=\"1\" selected>{$Languages['admin']['systempopup']}</option><option value=\"0\">{$Languages['admin']['systemfullscreen']}</option>"; }
			else { $popupBox = "<option value=\"1\">{$Languages['admin']['systempopup']}</option><option value=\"0\" selected>{$Languages['admin']['systemfullscreen']}</option>"; }
		switch($SystemOptions['defaultview']) {
			case "day": 	$viewBox = "<option value=\"day\" selected>{$Languages['nav']['day']}</option><option value=\"week\">{$Languages['nav']['week']}</option><option value=\"2week\">{$Languages['nav']['2week']}</option><option value=\"month\">{$Languages['nav']['month']}</option><option value=\"year\">{$Languages['nav']['year']}</option>"; break;
			case "week": 	$viewBox = "<option value=\"day\">{$Languages['nav']['day']}</option><option value=\"week\" selected>{$Languages['nav']['week']}</option><option value=\"2week\">{$Languages['nav']['2week']}</option><option value=\"month\">{$Languages['nav']['month']}</option><option value=\"year\">{$Languages['nav']['year']}</option>"; break;
			case "2week": 	$viewBox = "<option value=\"day\">{$Languages['nav']['day']}</option><option value=\"week\">{$Languages['nav']['week']}</option><option value=\"2week\" selected>{$Languages['nav']['2week']}</option><option value=\"month\">{$Languages['nav']['month']}</option><option value=\"year\">{$Languages['nav']['year']}</option>"; break;
			case "month": 	$viewBox = "<option value=\"day\">{$Languages['nav']['day']}</option><option value=\"week\">{$Languages['nav']['week']}</option><option value=\"2week\">{$Languages['nav']['2week']}</option><option value=\"month\" selected>{$Languages['nav']['month']}</option><option value=\"year\">{$Languages['nav']['year']}</option>"; break;
			case "year": 	$viewBox = "<option value=\"day\">{$Languages['nav']['day']}</option><option value=\"week\">{$Languages['nav']['week']}</option><option value=\"2week\">{$Languages['nav']['2week']}</option><option value=\"month\">{$Languages['nav']['month']}</option><option value=\"year\" selected>{$Languages['nav']['year']}</option>"; break;
			}
		if(($SystemOptions['events_display'] & 1) != 0) { $displayItems .= "<input checked type=\"checkbox\" name=\"newItems[]\" value=\"1\">{$Languages['admin']['systemitemstart']} "; }
			else { $displayItems .= "<input type=\"checkbox\" name=\"newItems[]\" value=\"1\">{$Languages['admin']['systemitemstart']} "; }
		if(($SystemOptions['events_display'] & 2) != 0) { $displayItems .= "<input checked type=\"checkbox\" name=\"newItems[]\" value=\"2\">{$Languages['admin']['systemitemend']} "; }
			else { $displayItems .= "<input type=\"checkbox\" name=\"newItems[]\" value=\"2\">{$Languages['admin']['systemitemend']} "; }
		if(($SystemOptions['events_display'] & 4) != 0) { $displayItems .= "<input checked type=\"checkbox\" name=\"newItems[]\" value=\"4\">{$Languages['admin']['systemitemtitle']} "; }
			else { $displayItems .= "<input type=\"checkbox\" name=\"newItems[]\" value=\"4\">{$Languages['admin']['systemitemtitle']} "; }
		if(($SystemOptions['events_display'] & 8) != 0) { $displayItems .= "<input checked type=\"checkbox\" name=\"newItems[]\" value=\"8\">{$Languages['admin']['systemitemdesc']} "; }
			else { $displayItems .= "<input type=\"checkbox\" name=\"newItems[]\" value=\"8\">{$Languages['admin']['systemitemdesc']} "; }
		if(($SystemOptions['events_display'] & 16) != 0) { $displayItems .= "<input checked type=\"checkbox\" name=\"newItems[]\" value=\"16\">{$Languages['admin']['systemitemloc1']} "; }
			else { $displayItems .= "<input type=\"checkbox\" name=\"newItems[]\" value=\"16\">{$Languages['admin']['systemitemloc1']} "; }
		if(($SystemOptions['events_display'] & 32) != 0) { $displayItems .= "<input checked type=\"checkbox\" name=\"newItems[]\" value=\"32\">{$Languages['admin']['systemitemloc2']} "; }
			else { $displayItems .= "<input type=\"checkbox\" name=\"newItems[]\" value=\"32\">{$Languages['admin']['systemitemloc2']} "; }
		if(($SystemOptions['events_display'] & 64) != 0) { $displayItems .= "<input checked type=\"checkbox\" name=\"newItems[]\" value=\"64\">{$Languages['admin']['systemitemcont']} "; }
			else { $displayItems .= "<input type=\"checkbox\" name=\"newItems[]\" value=\"64\">{$Languages['admin']['systemitemcont']} "; }
		if(($SystemOptions['events_display'] & 128) != 0) { $displayItems .= "<input checked type=\"checkbox\" name=\"newItems[]\" value=\"128\">{$Languages['admin']['systemitememail']} "; }
			else { $displayItems .= "<input type=\"checkbox\" name=\"newItems[]\" value=\"128\">{$Languages['admin']['systemitememail']} "; }
		
		$path = "{$insPath}languages";
		if ($handle = opendir($path)) {
			while (false !== ($file = readdir($handle))) {
       				if ($file != "." && $file != ".." && $file != "index.htm") {
					$lang = substr($file,0,strrpos($file,"."));
					$dispLang = ucfirst($lang);
        				if($lang == $SystemOptions['language']) { $languageBox .= "<option value=\"$lang\" selected>$dispLang</option>"; }
        					else { $languageBox .= "<option value=\"$lang\">$dispLang</option>"; }
       					}
   				}
   			closedir($handle);
			}

		$path = "{$insPath}themes";
		if ($handle = opendir($path)) {
			while (false !== ($style = readdir($handle))) {
       				if ($style != "." && $style != ".." && $style != "index.htm") {
        				if($style == $SystemOptions['css']) { $cssBox .= "<option value=\"$style\" selected>$style</option>"; }
        					else { $cssBox .= "<option value=\"$style\">$style</option>"; }
       					}
   				}
   			closedir($handle);
			}
			
		$path = "{$insPath}themes";
		if ($handle = opendir($path)) {
			while (false !== ($style = readdir($handle))) {
       				if ($style != "." && $style != ".." && $style != "index.htm") {
        				if($style == $SystemOptions['css_print']) { $printBox .= "<option value=\"$style\" selected>$style</option>"; }
        					else { $printBox .= "<option value=\"$style\">$style</option>"; }
       					}
   				}
   			closedir($handle);
			}
						
		$result = query("SELECT text_color_id,text_color,text_color_desc FROM {$calendar_prefix}calendars_text_color ORDER BY text_color_id",$cal_link);
		while(list($id,$color,$desc) = mysql_fetch_row($result)) {
			$fontColors .=<<<ENDPRINT
			<tr>
			 <td width="50%"><input type="text" name="fontColorDesc{$id}" style="100%;" value="$desc"></td>
			 <td width="50%"><input type="text" name="fontColor{$id}" style="width:100%;" value="$color"></td>
			</tr>
ENDPRINT;
			}
		$result = query("SELECT text_font_id,text_font,text_font_desc FROM {$calendar_prefix}calendars_text_font ORDER BY text_font_id",$cal_link);
		while(list($id,$font,$desc) = mysql_fetch_row($result)) {
			$fontFace .=<<<ENDPRINT
			<tr>
			 <td width="50%"><input type="text" name="fontDesc{$id}" style="width:100%;" value="$desc"></td>
			 <td width="50%"><input type="text" name="font{$id}" style="width:100%;" value="$font"></td>
			</tr>
ENDPRINT;
			}
		$result = query("SELECT text_size_id,text_size,text_size_desc FROM {$calendar_prefix}calendars_text_size ORDER BY text_size_id",$cal_link);
		while(list($id,$size,$desc) = mysql_fetch_row($result)) {
			$fontSize .=<<<ENDPRINT
			<tr>
			 <td width="50%"><input type="text" name="fontSizeDesc{$id}" style="width:100%;" value="$desc"></td>
			 <td width="50%"><input type="text" name="fontSize{$id}" style="width:100%;" value="$size"></td>
			</tr>
ENDPRINT;
			}
		$result = query("SELECT text_style_id,text_style,text_style_desc FROM {$calendar_prefix}calendars_text_style ORDER BY text_style_id",$cal_link);
		while(list($id,$style,$desc) = mysql_fetch_row($result)) {
			$fontStyle .=<<<ENDPRINT
			<tr>
			 <td width="50%"><input type="text" name="fontStyleDesc{$id}" style="width:100%;" value="$desc"></td>
			 <td width="50%"><input type="text" name="fontStyle{$id}" style="width:100%;" value="$style"></td>
			</tr>
ENDPRINT;
			}

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		<form method="post" action="{$insUrl}admin/index.php">
		<input type="hidden" name="action" value="systemProcess">
		 <tr>
		  <td class="headtd" colspan="2">{$Languages['admin']['menusystem']}</td>
		 </tr>
		 <tr>
		  <td colspan="2">
		   <b>{$Languages['admin']['systemtitle']}:</b><br>
		   <input style="width:450px;" type="text" name="new_pagetitle" value="{$SystemOptions['pagetitle']}"><br>
		   <br>
		   <b>{$Languages['admin']['systemkeywords']}:</b><br>
		   <textarea style="width:450px;" name="new_pagemetakeywords">{$SystemOptions['pagemetakeywords']}</textarea><br>
		   <br>
		   <b>{$Languages['admin']['systemdescription']}:</b><br>
		   <textarea style="width:450px;" name="new_pagemetadescription">{$SystemOptions['pagemetadescription']}</textarea><br>
		   <br>
		   <b>{$Languages['admin']['systemcaltitle']}:</b><br>
		   <input style="width:450px;" type="text" name="new_caltitle" value="{$SystemOptions['calendar_title']}"><br>
		   <br>
		   <b>{$Languages['admin']['systemadmin']}:</b> <select name="new_admin_link">$adminLinkBox</select><br>
		   <b>{$Languages['admin']['systemview']}:</b> <select name="new_view">$viewBox</select><br>
		   <b>{$Languages['admin']['systemeventitems']}:</b> $displayItems<br>
		   <b>{$Languages['admin']['systemalign']}:</b> <select name="new_events_align">$alignBox</select><br>
		   <b>{$Languages['admin']['systemdisplay']}:</b> <select name="new_events_popup">$popupBox</select><br>
		   <b>{$Languages['admin']['systemlanguage']}:</b> <select name="new_language">$languageBox</select><br>
		   <b>{$Languages['admin']['systemcss']}:</b> <select name="new_css">$cssBox</select><br>
		   <b>{$Languages['admin']['systemprint']}:</b> <select name="new_print">$printBox</select><br>
		   <br>
		   <b>{$Languages['admin']['systemheader']}:</b><br>
		   <textarea name="newHeader" style="width:500px; height:75px;">{$SystemOptions['calendar_header']}</textarea><br>
		   <br>
		   <b>{$Languages['admin']['systemfooter']}:</b><br>
		   <textarea name="newFooter" style="width:500px; height:75px;">{$SystemOptions['calendar_footer']}</textarea><br>
		   <br>		   
		  </td>
		 </tr>
		 <tr>
		  <td width="50%" valign="top">
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		    <tr>
		     <td colspan="2" class="headtd">{$Languages['admin']['systemfontcolors']}</td>
		    </tr>
		    <tr>
		     <td>{$Languages['admin']['systemlabel']}</td>
		     <td>{$Languages['admin']['systemcss']}</td>
		    </tr>
		    $fontColors
		   </table>
		  </td>

		  <td width="50%" valign="top">
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		    <tr>
		     <td colspan="2" class="headtd">{$Languages['admin']['systemfonts']}</td>
		    </tr>
		    <tr>
		     <td>{$Languages['admin']['systemlabel']}</td>
		     <td>{$Languages['admin']['systemcss']}</td>
		    </tr>
		    $fontFace
		   </table>
		   <br>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		    <tr>
		     <td colspan="2" class="headtd">{$Languages['admin']['systemfontsizes']}</td>
		    </tr>
		    <tr>
		     <td>{$Languages['admin']['systemlabel']}</td>
		     <td>{$Languages['admin']['systemcss']}</td>
		    </tr>
		    $fontSize
		   </table>
		   <br>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		    <tr>
		     <td colspan="2" class="headtd">{$Languages['admin']['systemfontstyles']}</td>
		    </tr>
		    <tr>
		     <td>{$Languages['admin']['systemlabel']}</td>
		     <td>{$Languages['admin']['systemcss']}</td>
		    </tr>
		    $fontStyle
		   </table>
		  </td>
		 </tr>
		 <tr>
		  <td align="center" colspan="2"><input type="submit" value="{$Languages['admin']['process']}"></td>
		 </tr>
		</form>
		</table>
		</div>
ENDPRINT;
		break;

	case "systemProcess":
		//Prep variables
		$new_pagetitle = protect($new_pagetitle);
		$new_pagemetakeywords = protect($new_pagemetakeywords);
		$new_pagemetadescription = protect($new_pagemetadescription);
		$new_admin_link = intval(protect($new_admin_link));
		$new_events_align = protect($new_events_align);
		$new_events_popup = intval(protect($new_events_popup));
		$new_language = protect($new_language);
		$new_caltitle = protect($new_caltitle);
		$new_view = protect($new_view);
		$new_css = protect($new_css);
		$new_print = protect($new_print);
		
		if(isset($newItems)) {
			while(list(,$val) = each($newItems)) {
				$items += $val;
				}
			}
		$new_items = intval($items);
		
		if(substr($newHeader,0,5) != "file:") { $newHeader = protect($newHeader); }
			else { $newHeader = addslashes($newHeader); }
		if(substr($newFooter,0,5) != "file:") { $newFooter = protect($newFooter); }
			else { $newFooter = addslashes($newFooter); }

		//Update system table
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_pagetitle' WHERE item='pagetitle'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_pagemetakeywords' WHERE item='pagemetakeywords'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_pagemetadescription' WHERE item='pagemetadescription'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_admin_link' WHERE item='admin_link'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_events_align' WHERE item='events_align'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_events_popup' WHERE item='events_popup'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_language' WHERE item='language'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$newHeader' WHERE item='calendar_header'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$newFooter' WHERE item='calendar_footer'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_caltitle' WHERE item='calendar_title'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_view' WHERE item='defaultview'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_css' WHERE item='css'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_print' WHERE item='css_print'",$cal_link);
		$result = query("UPDATE {$calendar_prefix}system SET value='$new_items' WHERE item='events_display'",$cal_link);
		
		//Update the font choices
		for($i=1;$i<=15;$i++) {
			$color = protect(${"fontColor".$i});
			$desc = protect(${"fontColorDesc".$i});
			$result = query("UPDATE {$calendar_prefix}calendars_text_color SET text_color='$color',text_color_desc='$desc' WHERE text_color_id=$i",$cal_link);
			}
		for($i=1;$i<=3;$i++) {
			$font = protect(${"font".$i});
			$desc = protect(${"fontDesc".$i});
			$result = query("UPDATE {$calendar_prefix}calendars_text_font SET text_font='$font',text_font_desc='$desc' WHERE text_font_id=$i",$cal_link);
			}
		for($i=1;$i<=3;$i++) {
			$size = protect(${"fontSize".$i});
			$desc = protect(${"fontSizeDesc".$i});
			$result = query("UPDATE {$calendar_prefix}calendars_text_size SET text_size='$size',text_size_desc='$desc' WHERE text_size_id=$i",$cal_link);
			}
		for($i=1;$i<=4;$i++) {
			$style = protect(${"fontStyle".$i});
			$desc = protect(${"fontStyleDesc".$i});
			$result = query("UPDATE {$calendar_prefix}calendars_text_style SET text_style='$style',text_style_desc='$desc' WHERE text_style_id=$i",$cal_link);
			}

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		<form method="post" action="{$insUrl}admin/index.php">
		<input type="hidden" name="action" value="systemProcess">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menusystem']}</td>
		 </tr>
		 <tr>
		  <td>
                   {$Languages['admin']['systemupdated']}
		  </td>
		 </tr>
		</table>
		</div>
ENDPRINT;
		break;
	}
?>