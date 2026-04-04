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

global $calendar_prefix,$cal_link,$uus_link,$integration_prefix,$int_link;

//Calendar database settings
$calendar_name = "elmentee";
$calendar_host = "dc2-mysql-01.kattare.com";
$calendar_username = "elmentee";
$calendar_password = "db-godhelp1";
$calendar_prefix = "3306";

//BosDevUUS database settings
$uus_name = "elmentee";
$uus_host = "dc2-mysql-01.kattare.com";
$uus_username = "elmentee";
$uus_password = "db-godhelp1";

//Integration database settings
$integration_name = "";
$integration_host = "";
$integration_username = "";
$integration_password = "";
$integration_prefix = "";

//Cookie data settings
$cookie_prefix = "mmiCookie";
$cookie_path = "/calendar";
$cookie_domain = ".menteemedicalinstitute.org";

//Installation location settings
$insUrl = "http://www.menteemedicalinstitute.org/calendar/";
$insPath = "/home3/e/elmentee/menteemedicalinstitute_org/calendar/";

//DO NOT EDIT ANYTHING BELOW
$cal_link = mysql_connect("$calendar_host", "$calendar_username", "$calendar_password") or die("I cannot connect to the calendar database.");
mysql_select_db ("$calendar_name",$cal_link) or die("Could not select the calendar database.");

$uus_link = mysql_connect("$uus_host", "$uus_username", "$uus_password") or die("I cannot connect to the BosDev UUS database.");
mysql_select_db ("$uus_name",$uus_link) or die("Could not select the BosDev UUS database.");

if($integration_name != "") {
	$int_link = mysql_connect("$integration_host", "$integration_username", "$integration_password") or die("I cannot connect to the integration database.");
	mysql_select_db ("$integration_name",$int_link) or die("Could not select the integration database.");
	}

function protect($nonprotected) {
	$protected = mysql_escape_string($nonprotected);
	return $protected;
	}
function query($query,$database) {
    	$mysql_error="";
    	$mysql_result = @mysql_query($query,$database);
    	if ( !$mysql_result ) {
    		$mysql_result_error = @mysql_error();
    		die("<div align=left><b>MySQL error!</b><br />Database: <i>$database</i><br />The query: <i>$query</i><br />The result: <i>$mysql_result_error</i><br /></div>" );
    		}
		else { return $mysql_result; }
	}
?>