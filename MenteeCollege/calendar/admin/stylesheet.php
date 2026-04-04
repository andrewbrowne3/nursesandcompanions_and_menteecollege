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
	case "stylesheets":
		$cssArray = array();
		$printArray = array();

		$stylesCount = 0;
		$path = "{$insPath}themes";
		if ($handle = opendir($path)) {
			while (false !== ($theme = readdir($handle))) {
       				if ($theme != "." && $theme != ".." && $theme != "index.htm") {
       					$themeCount = 0;
					reset($cssArray);
					reset($printArray);
					while(list(,$val) = each($cssArray)) {
						if($val == $theme) { $themeCount++; }
						}
					while(list(,$val) = each($printArray)) {
						if($val == $theme) { $themeCount++; }
						}

					if($stylesCount%2 != 0) { $class = "class=\"alttd\""; }
						else { $class = ""; }
						
					if($SystemOptions['css'] == $theme || $SystemOptions['css_print'] == $theme) { $deleteLink = ""; }
						else { $deleteLink = "|<a href=\"index.php?action=stylesheetsDelete&stylesheet=$theme\">{$Languages['admin']['styledelete']}</a></td>"; }

					$themeList .=<<<ENDPRINT
					<tr>
					 <td $class><b>$theme</b></td>
					 <td $class width="100" align="center"><a href="index.php?action=stylesheetsEdit&stylesheet=$theme">{$Languages['admin']['styleedit']}</a>{$deleteLink}
					</tr>
ENDPRINT;
					$stylesCount++;
       					}
   				}
   			closedir($handle);
			}

		$displayData =<<<ENDPRINT
		<div id="generalBox">
	        <table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menustyle']}</td>
		 </tr>
		  <td>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		   <form method="post" action="{$insUrl}admin/index.php">
		   <input type="hidden" name="action" value="stylesheetsAdd">
		    <tr>
		     <td class="headtd">{$Languages['admin']['stylecreate']}</td>
		    </tr>
		    <tr>
		     <td>{$Languages['admin']['styleintro']} <input type="submit" value="{$Languages['admin']['process']}"></td>
		    </tr>
		   </form>
		   </table>
		   <br>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		    <tr>
		     <td class="headtd" colspan="2">{$Languages['admin']['stylecurrent']}</td>
		    </tr>
		   $themeList
		   </table>
		  </td>
		 </tr>
		</table>
		</div>
ENDPRINT;
		break;

	case "stylesheetsAdd":
		//Check to make sure we can write to the /themes directory
		$path = "{$insPath}themes";
		if(!is_writable($path)) {
			echo $Languages['admin']['styledirerror'];
			die();
			}

		//Create blank template
		$displayData =<<<ENDPRINT
                <script language="JavaScript1.2" type="text/javascript">
                 function checkName(form) {
                 	var fname=form.styleName.value;
			var check_dot = fname.indexOf('.');
			if (check_dot == -1) {
				form.styleName.focus();
	       			return false;
	       			}
   			return true;
                 	}
		</script>
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menustyle']}</td>
		 </tr>
		 <tr>
		  <td>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		   <form method="post" action="{$insUrl}admin/index.php" onSubmit="return checkName(this);">
		   <input type="hidden" name="action" value="stylesheetsAddProcess">
		    <tr>
		     <td class="headtd">{$Languages['admin']['stylecreate']}</td>
		    </tr>
		    <tr>
		     <td>
		      {$Languages['admin']['stylecreateintro']}<br>
		      <br>
		      {$Languages['admin']['stylecreatenoprint']}<br>
		      <br>
		      <textarea name="newStylesheet" wrap="off" style="overflow:scroll; width:550px; height:500px;">
BODY { background-color:#FFFFFF; margin-bottom:0px; margin-left:0px; margin-right:0px; margin-top:0px; padding:0px; padding-left:0px; padding-bottom:0px; padding-right:0px; padding-top:0px; }
INPUT { background-color:#B7C7EF; font-family:Verdana,Tahoma,Arial; font-size:8pt; color:#000000; }
SELECT { background-color:#B7C7EF; font-family:Verdana,Tahoma,Arial; font-size:8pt; color:#000000; }

#title { font-family: Verdana, Tahoma, Arial; font-size:11pt; color:#FFFFFF; font-weight: bold; }
#title a { font-family: Verdana, Tahoma, Arial; font-size:11pt; color:#FFFFFF; font-weight: bold; text-decoration:none; }
#title a:hover { font-family: Verdana, Tahoma, Arial; font-size:11pt; color:#FFB31A; font-weight: bold; text-decoration:none; }

#menu { font-family:Verdana,Tahoma,Arial; font-size:8pt; font-weight: bold; color:#FFF; }
#menu a { text-decoration: none; }
#menu a:hover { text-decoration: underline; }

#nav { background-color:#6487DC; }
#nav input { font-family:Verdana,Tahoma,Arial; font-size:8pt; font-weight:bold; color:#222222; background-color:#A4BEF3; }
#nav select { font-family:Verdana,Tahoma,Arial; font-size:8pt; font-weight:normal; color:#222222; background-color:#A4BEF3; }
#nav .navOn { background-color:#003399; padding: 2px 1px 2px 1px; border-right:1px solid #333333; border-top:1px solid #AAAAAA; border-left:1px solid #AAAAAA; }
#nav .navOff { background-color:#6487DC; padding: 2px 1px 2px 1px; border-right:1px solid #333333; border-top:1px solid #AAAAAA; border-left:1px solid #AAAAAA; }
#nav a { font-family:Verdana,Tahoma,Arial; font-size:8pt; font-weight: bold; color:#FFFFFF; text-decoration:none; }
#nav a:hover { font-family:Verdana,Tahoma,Arial; font-size:8pt; font-weight: bold; color:#FFFFFF; text-decoration:none; }

#calnav { background-color:#003399; }

#date { font-family: Verdana, Tahoma, Arial; font-size:11pt; color:#000000; font-weight: bold; text-decoration:none; }
#date a { font-family: Verdana, Tahoma, Arial; font-size:11pt; color:#000000; font-weight: bold; text-decoration:none; }
#date a:hover { font-family: Verdana, Tahoma, Arial; font-size:11pt; color:#FFB31A; font-weight: bold; text-decoration:underline; }
#date .month { font-size:8pt; }

#dateCells td.active { background-color:#FFFFFF; border:1px solid #003399; }
#dateCells td.empty { background-color:#FFFFFF; border:1px solid #DDDDDD; }
#dateCells td.today { background-color:#FFEFCE; border:1px solid #FFB31A; }
#dateCells td.weekend { background-color:#DDDDDD; border:1px solid #003399; }
#dateCells td.calendar_header { background-color:#FFB31A; font-family: Verdana,Tahoma,Arial; font-size:10pt; color:#000000; font-weight: bolder; border:1px solid #003399; }
#dateCells .weeknum { font-family: Verdana, Tahoma, Arial; font-size:8pt; color:#000000; }
#dateCells .daynum { font-family: Verdana, Tahoma, Arial; font-size:8pt; color:#000000; }
#dateCells a { text-decoration:none; }
#dateCells a:hover { text-decoration:underline; }
#dateCells .dayhead { font-family: Verdana, Tahoma, Arial; font-size:7pt; font-weight:bold; color:#000000; background-color:#FFB31A; height:100%; }
#dateCells .daycell { font-family: Verdana, Tahoma, Arial; font-size:7pt; color:#000000; background-color:#FFFFFF; }
#dateCells .daytime { font-family: Verdana, Tahoma, Arial; font-size:7pt; color:#000000; background-color:#A4BEF3; }

#miniDateCells table { border:1px solid #003399; }
#miniDateCells td.active { background-color:#FFFFFF; border:1px solid #003399; }
#miniDateCells td.empty { background-color:#CCCCCC; border:1px solid #DDDDDD; }
#miniDateCells td.full { font-family: Verdana, Tahoma, Arial; font-size:8pt; color:#000000; background-color:#FFEFCE; border:1px solid #FFB31A; }
#miniDateCells td.header { background-color:#FFB31A; font-family: Verdana, Tahoma, Arial; font-size:8pt; color:#000000; font-weight: bold; }
#miniDateCells td.monthHeader { background-color:#003399; }
#miniDateCells .month { font-family: Verdana, Tahoma, Arial; font-size:8pt; color:#FFFFFF; font-weight: bold; text-decoration:none; }
#miniDateCells .month:hover { font-family: Verdana, Tahoma, Arial; font-size:8pt; color:#FFFFFF; font-weight: bold; text-decoration:none; }
#miniDateCells a { font-family: Verdana, Tahoma, Arial; font-size:8pt; color:#000000; text-decoration:none; }
#miniDateCells a:hover { font-family: Verdana, Tahoma, Arial; font-size:8pt; color:#FFB31A; text-decoration:underline; }
#miniDateCells .day { font-family: Verdana, Tahoma, Arial; font-size:8pt; color:#000000; text-decoration:none; }
#miniDateCells .day:hover { font-family: Verdana, Tahoma, Arial; font-size:8pt; color:#000000; text-decoration:underline; }

#midDateCells td.active { background-color:#FFFFFF; border:1px solid #003399; }
#midDateCells td.empty { background-color:#CCCCCC; border:1px solid #DDDDDD; }
#midDateCells td.full { background-color:#FFEFCE; border:1px solid #FFB31A; }
#midDateCells td.header { background-color:#FFB31A; font-family: Verdana, Tahoma, Arial; font-size:10pt; color:#000000; font-weight: bold; }
#midDateCells td.monthHeader { background-color:#003399; }
#midDateCells .month { font-family: Verdana, Tahoma, Arial; font-size:12pt; color:#FFFFFF; font-weight: bold; text-decoration:none; }
#midDateCells .month:hover { font-family: Verdana, Tahoma, Arial; font-size:12pt; color:#FFFFFF; font-weight: bold; text-decoration:none; }
#midDateCells a { font-family: Verdana, Tahoma, Arial; font-size:10pt; color:#000000; font-weight:bold; text-decoration:none; }
#midDateCells a:hover { font-family: Verdana, Tahoma, Arial; font-size:10pt; color:#FFB31A; font-weight:bold; text-decoration:underline; }
#midDateCells .day { font-family: Verdana, Tahoma, Arial; font-size:10pt; color:#000000; font-weight:bold; text-decoration:none; }

#eventDetails{ position:absolute; top:0px; left:0px; width:300px; border:1px solid #000000; padding:2px; background-color:#FFFFFF; visibility:hidden; z-index:1000; font-family:Verdana,Tahoma; font-size:9pt; color:#000000; }

#generalBox table { font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#000000; background-color:#FFFFFF; border:1px solid #000000; }
#generalBox td { font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#000000; background-color:#FFFFFF; }
#generalBox .alttd { font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#000000; background-color:#CFCFCF; }
#generalBox .headtd { font-family:Verdana,Tahoma,Arial; font-size:10pt; font-weight:bold; color:#FFFFFF; background-color:#003399; }
#generalBox INPUT { font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#000000; background-color:#DDDDDD; }
#generalBox SELECT { background-color:#DDDDDD; font-family:Verdana,Tahoma,Arial; font-size:8pt; color:#000000; }
#generalBox a { font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#000000; text-decoration:none; }
#generalBox a:hover { font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#FFB31A; text-decoration:underline; }
#generalBox .error { color:#F00000; font-weight:bold; }
#generalBox .menuLink { font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#FFFFFF; text-decoration:none; }
#generalBox .menuLink:hover { font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#FFB31A; text-decoration:underline; }
#generalBox .small { font-family:Verdana,Tahoma,Arial; font-size:8pt; color:#000000; }

#events .calendar { background-color:#003399; font-family:Verdana,Tahoma,Arial; font-size:12pt; color:#FFFFFF; font-weight:bold; }
#events .title { background-color:#6487DC; font-family:Verdana,Tahoma,Arial; font-size:12pt; color:#FFFFFF; font-weight:bold; }
#events .heading { text-align:right; background-color:#CCCCCC; font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#000000; font-weight:bold; }
#events .data { background-color:#FFFFFF; font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#000000; }
#events a { font-family: Verdana, Tahoma, Arial; font-size:10pt; color:#000000; text-decoration:underline; }
#events a:hover { font-family: Verdana, Tahoma, Arial; font-size:10pt; color:#FFB31A; text-decoration:underline; }

#editorBox table { font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#000000; background-color:#FFFFFF; border:none; }
#editorBox .button { font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#000000; background-color:#CCCCCC; border-right:1px solid #BBBBBB; border-bottom:1px solid #BBBBBB; cursor:pointer; }
#editorBox TEXTAREA { font-family:Verdana,Tahoma,Arial; font-size:10pt; color:#000000; background-color:#DDDDDD; }

#copyright { font-family:Verdana,Tahoma,Arial; font-size:7pt; color:#BBBBBB; }
#copyright a { font-family:Verdana,Tahoma,Arial; font-size:7pt; color:#BBBBBB; text-decoration:none; }
#copyright a:hover { font-family:Verdana,Tahoma,Arial; font-size:7pt; color:#FFB31A; text-decoration:underline; }
		      </textarea><br>
		      <br>
		      {$Languages['admin']['stylename']}: <input type="text" name="styleName"><br>
		      <input type="submit" value="{$Languages['admin']['process']}">
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

	case "stylesheetsAddProcess":
		//Check to make sure we can write to the /themes directory
		$path = "{$insPath}themes";
		if(!is_writable($path) || $styleName == "") {
			echo $Languages['admin']['styledirerror'];
			die();
			}

		//See if there is a bad name for the file
		$notAllowed = array("php","php3","php4","pl","cgi","asp","cfm","htm","html","shtml","js","exe","com","bat","pjpeg","net","java","jsp","hta","jse","mdb","msi","vbs","vbe");
		$fileExt = strtolower(substr($styleName,strrpos($styleName,".")+1));
		if(in_array($fileExt,$notAllowed)) { die(); }

		//Open the new file, and save it.
		$newStylesheet = str_replace("\r","",$newStylesheet);
		$fp = @fopen("{$path}/$styleName", "w+");
		if(!@fwrite($fp, $newStylesheet)) {
			echo $Languages['admin']['styledirerror'];
			die();
			}
		fclose($fp);

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menustyle']}</td>
		 </tr>
		 <tr>
		  <td>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		    <tr>
		     <td class="headtd">{$Languages['admin']['stylecreate']}</td>
		    </tr>
		    <tr>
		     <td>
		      {$Languages['admin']['stylecreated']}
		     </td>
		    </tr>
		   </table>
		  </td>
		 </tr>
		</table>
		</div>
ENDPRINT;
		break;

	case "stylesheetsDelete":
		//Check to make sure we can write to the /themes directory
		$path = "{$insPath}themes";
		if(!is_writable($path)) {
			echo $Languages['admin']['stylenotdeleted'];
			die();
			}

		//Double check that it is safe to remove this stylesheet
		if($SystemOptions['css'] != '$stylesheet' && $SystemOptions['css'] != '$stylesheet') {
			if(@unlink("{$path}/$stylesheet")) {
				$msg = $Languages['admin']['styledeleted'];
				}
				else { $msg = $Languages['admin']['stylenotdeleted']; }
			}
			else { $msg = $Languages['admin']['styleinuse']; }

		header("Location: index.php?action=stylesheets"); die();
		break;

	case "stylesheetsEdit":
		//Check to make sure we can write to the /themes directory
		$path = "{$insPath}themes";
		if(!is_writable("{$path}/$stylesheet")) {
			@chmod("{$path}/$stylesheet",0777);
			if(!is_writable("{$path}/$stylesheet")) {
				echo $Languages['admin']['styledirerror'];
				die();
				}
			}

		//Get the file info
		$fp = @fopen("{$path}/$stylesheet", "r");
		while(!feof($fp)) {
   			$data .= fgets($fp, 4096);
			}

		//Create blank template
		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menustyle']}</td>
		 </tr>
		 <tr>
		  <td>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		   <form method="post" action="{$insUrl}admin/index.php">
		   <input type="hidden" name="action" value="stylesheetsEditProcess">
		   <input type="hidden" name="stylesheet" value="$stylesheet">
		    <tr>
		     <td class="headtd">{$Languages['admin']['styleedithead']}</td>
		    </tr>
		    <tr>
		     <td>
		      {$Languages['admin']['styleeditintro']}<br>
		      <br>
		      <textarea name="newStylesheet" wrap="off" style="overflow:scroll; width:550px; height:500px;">$data</textarea><br>
		      <br>
		      <input type="submit" value="{$Languages['admin']['process']}">
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

	case "stylesheetsEditProcess":
		//Check to make sure we can write to the /themes directory
		$path = "{$insPath}themes";
		if(!is_writable("{$path}/$stylesheet")) {
			echo $Languages['admin']['styledirerror'];
			die();
			}

		//Open the new file, and save it.
		$newStylesheet = str_replace("\r","",$newStylesheet);
		$fp = @fopen("{$path}/$stylesheet", "w+");
		if(!@fwrite($fp, $newStylesheet)) {
			echo $Languages['admin']['styledirerror'];
			die();
			}
		fclose($fp);

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menustyle']}</td>
		 </tr>
		 <tr>
	          <td>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		    <tr>
		     <td class="headtd">{$Languages['admin']['styleedithead']}</td>
		    </tr>
		    <tr>
		     <td>
		      {$Languages['admin']['styleedited']}
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