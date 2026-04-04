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

echo<<<ENDPRINT
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
 <head>
  <title>{$addPageTitle}{$SystemOptions['pagetitle']}</title>
  <meta name="description" content="{$SystemOptions['pagemetadescription']}">
  <meta name="keywords" content="{$SystemOptions['pagemetakeywords']}">
  <meta http-equiv="Content-Type" content="text/html; charset={$Languages['global']['charset']}">
  <meta name="generator" content="BosDates Lite 3.0 by BosDev">
  <meta name="author" content="BosDev http://www.bosdev.com">
  <link rel="stylesheet" media="screen" href="{$insUrl}themes/{$SystemOptions['css']}" type="text/css" >
  <link rel="stylesheet" media="print"  href="{$insUrl}themes/{$SystemOptions['css_print']}" type="text/css" >
 </head>

<body>
<div id="eventDetails"></div>
<script language="JavaScript" src="{$insUrl}javascripts.js"></script>

ENDPRINT;

if(substr($SystemOptions['calendar_header'],0,5) == "file:") {
	$fileToInclude = substr($SystemOptions['calendar_header'],5);
	include("$fileToInclude");
	}
	else { echo stripslashes($SystemOptions['calendar_header']); }

echo<<<ENDPRINT
<div align="center">
ENDPRINT;

?>

