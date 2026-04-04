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
	case "database":
		//Repair/Optimize the tables
		$result = query("REPAIR TABLE {$calendar_prefix}calendars_text_color,{$calendar_prefix}calendars_text_font, {$calendar_prefix}calendars_text_size,{$calendar_prefix}calendars_text_style,{$calendar_prefix}dates,{$calendar_prefix}events,{$calendar_prefix}system",$cal_link);
		$result = query("REPAIR TABLE bosdevUUS",$uus_link);
		$result = query("OPTIMIZE TABLE {$calendar_prefix}calendars_text_color,{$calendar_prefix}calendars_text_font, {$calendar_prefix}calendars_text_size,{$calendar_prefix}calendars_text_style,{$calendar_prefix}dates,{$calendar_prefix}events,{$calendar_prefix}system",$cal_link);
		$result = query("OPTIMIZE TABLE bosdevUUS",$uus_link);

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menudatabase']}</td>
		 </tr>
		 <tr>
		  <td>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		   <form method="post" action="{$insUrl}admin/index.php">
		   <input type="hidden" name="action" value="databaseDownload">
		    <tr>
		     <td class="headtd">{$Languages['admin']['databasebackup']}</td>
		    </tr>
		    <tr>
		     <td>
	              {$Languages['admin']['databasebackupintro']}<br>
	              <br>
		      <select name="dbBackup"><option value="1">BosDates Lite</option><option value="2">BosDev Universal User System</option><option value="9">{$Languages['admin']['databaseboth']}</select> <input type="submit" value="{$Languages['admin']['process']}"><br>
		      <br>
		     </td>
		    </tr>
		   </form>
		   </table>
		   <br>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		   <form method="post" action="{$insUrl}admin/index.php" enctype="multipart/form-data">
		   <input type="hidden" name="action" value="databaseRestore">
		    <tr>
		     <td class="headtd">{$Languages['admin']['databaserestore']}</td>
		    </tr>
		    <tr>
		     <td>
		      {$Languages['admin']['databaserestoreintro']}<br>
		      <br>
		      <input type="file" name="dbRestore"> <input type="submit" value="{$Languages['admin']['process']}"><br>
		      <br>
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

	case "databaseDownload":
		function getDatabaseDef($dbname,$table,$link) {
    			$def = "DROP TABLE IF EXISTS $table;#%%\n";
    			$def .= "CREATE TABLE $table (\n";
    			$result = mysql_db_query($dbname, "SHOW FIELDS FROM `$table`",$link);
    			while($row = mysql_fetch_array($result)) {
        			$def .= "    `$row[Field]` $row[Type]";
        			if ($row["Default"] != "") $def .= " DEFAULT '$row[Default]'";
        			if ($row["Null"] != "YES") $def .= " NOT NULL";
       				if ($row[Extra] != "") $def .= " $row[Extra]";
        			$def .= ",\n";
     				}
     			$def = ereg_replace(",\n$","", $def);
     			$result = mysql_db_query($dbname, "SHOW KEYS FROM `$table`",$link);
     			while($row = mysql_fetch_array($result)) {
          			$kname=$row[Key_name];
          			if(($kname != "PRIMARY") && ($row[Non_unique] == 0)) $kname="UNIQUE|$kname";
          			if(!isset($index[$kname])) $index[$kname] = array();
          			$index[$kname][] = $row[Column_name];
     				}
    			while(list($x, $columns) = @each($index)) {
          			$def .= ",\n";
          			if($x == "PRIMARY") $def .= "   PRIMARY KEY (" . implode($columns, ", ") . ")";
          			else if (substr($x,0,6) == "UNIQUE") $def .= "   UNIQUE ".substr($x,7)." (" . implode($columns, ", ") . ")";
          			else $def .= "   KEY $x (" . implode($columns, ", ") . ")";
     				}

			$def .= "\n);#%%";
     			return (stripslashes($def));
			}

		function getDatabaseContent($dbname,$table,$link) {
     			$content="";
     			$result = mysql_db_query($dbname, "SELECT * FROM `$table`",$link);
     			while($row = mysql_fetch_row($result)) {
         			$insert = "INSERT INTO `{$table}` VALUES (";
         			for($j=0; $j<mysql_num_fields($result);$j++) {
            				if(!isset($row[$j])) $insert .= "NULL,";
            				else if($row[$j] != "") $insert .= "'".addslashes($row[$j])."',";
            				else $insert .= "'',";
         				}
         			$insert = ereg_replace(",$","",$insert);
         			$insert .= ");#%%\n";
         			$content .= $insert;
     				}
     			return $content;
			}

		$cur_time=date("Y-m-d-Hi");
		$filename = $cur_time.".sql";
		$data = "# BosDates Lite calendar backup created on $cur_time\r\n";

		if($dbBackup == 1 || $dbBackup == 9) {
			$tables = mysql_list_tables($calendar_name,$cal_link);
			$num_tables = @mysql_num_rows($tables);
			$i = 0;
			while($i < $num_tables) {
				$table = mysql_tablename($tables, $i);
				if(($calendar_prefix != "" && strstr($table,$calendar_prefix)) || $calendar_prefix == "") {
					$data .= "\n# ----------------------------------------------------------\n#\n";
					$data .= "# structure for table '$table'\n#\n";
					$data .= getDatabaseDef($calendar_name,$table,$cal_link);
	   				$data .= "\n\n";
	   				$data .= "#\n# data for table '$table'\n#\n";
	   				$data .= getDatabaseContent($calendar_name,$table,$cal_link);
	   				$data .= "\n\n";
	   				}
	   			$i++;
				}
			}

		if($dbBackup == 2 || $dbBackup == 9) {
			$data .= "\n# ----------------------------------------------------------\n#\n";
			$data .= "# structure for table bosdevUUS\n#\n";
			$data .= getDatabaseDef($uus_name,"bosdevUUS",$uus_link);
			$data .= "\n\n";
			$data .= "#\n# data for table bosdevUUS\n#\n";
			$data .= getDatabaseContent($uus_name,"bosdevUUS",$uus_link);
			$data .= "\n\n";
			}


		$len = strlen($data);
		header("Content-Length: $len");
		header("Content-Type: text/plain");
		header("Content-Disposition: attachment; filename=$filename");
		header("Content-Transfer-Encoding: binary");
		print "$data";
		die();

		break;

	case "databaseRestore":
		//Move the file to the /images directory so we can work on it
		if(is_uploaded_file($_FILES['dbRestore']['tmp_name'])) {
			move_uploaded_file($_FILES['dbRestore']['tmp_name'],"{$insPath}images/events/{$_FILES['dbRestore']['name']}");

			//Make sure we have enough time to process
			@set_time_limit(0);

			//Read the file in and create queries
			$file=fread(fopen("{$insPath}images/events/{$_FILES['dbRestore']['name']}", "r"), filesize("{$insPath}images/events/{$_FILES['dbRestore']['name']}"));
			$queries=explode(";#%%",$file);
			while(list(,$val) = each($queries)) {
				if(trim($val) != "") {
					if(strstr($val,"bosdevUUS")) { $link = $uus_link; }
						else { $link = $cal_link; }
					$result = query("$val",$link);
					}
				}

			//Remove the file
			@unlink("{$insPath}images/events/{$_FILES['dbRestore']['name']}");

			$displayData =<<<ENDPRINT
			<div id="generalBox">
			<table width="100%" cellspacing="1" cellpadding="3">
			 <tr>
		  	  <td class="headtd">{$Languages['admin']['menudatabase']}</td>
			 </tr>
			 <tr>
			  <td>
			   <table width="100%" border="0" cellspacing="1" cellpadding="3">
			    <tr>
			     <td class="headtd">{$Languages['admin']['databaserestore']}</td>
			    </tr>
			    <tr>
			     <td>
			      {$Languages['admin']['databaserestored']}<br>
			     </td>
			    </tr>
			   </table>
			  </td>
			 </tr>
			</table>
			</div>
ENDPRINT;
			}

		break;
	}

?>