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
define ('InAdmin',TRUE);
include("../connect.php");
include("../functions.php");

//Check to ensure the user is logged in
$passThrough = array("login","loginProcess","forgot","forgotSend","forgotProcess");
if(!authenticateUser() && !in_array("$action",$passThrough)) {
	$action = "login";	
	}

if(authenticateUser()) {
	//Check to ensure the user has admin panel permissions
	$userInfo = getUserInfo();
	if($userInfo['admPanel'] == 0) {
		header("Location: {$insUrl}calendar.php");
		die();
		}		
	}

//What are we supposed to be doing...
switch($action) {
	
	case "events":
	case "eventsSearch":
	case "eventDelete":
	case "eventDeleteProcess":
	case "eventsScreen":
	case "eventProcess":
	case "eventEdit":
		include("events.php");
		break;

			
	//Show the login screen
	case "login":
		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		<form method="post" action="{$insUrl}admin/index.php" onSubmit="return checkLogin(this);">
		<input type="hidden" name="action" value="loginProcess">
		 <tr>
  		  <td colspan="2" class="headtd">{$Languages['admin']['logforlogin']}</td>
 		 </tr>
		 <tr>
  		  <td colspan="2">{$Languages['admin']['logforloginintro1']}</td>
 		 </tr>
 		 <tr>
 		  <td align="right" width="50%">{$Languages['admin']['logforusername']}</td>
 		  <td width="50%"><input type="text" name="username"></td>
 		 </tr>
 		 <tr>
 		  <td align="right" width="50%">{$Languages['admin']['logforpassword']}</td>
 		  <td width="50%"><input type="password" name="password"></td>
 		 </tr>
		 <tr>
  		  <td colspan="2" align="center"><input type="submit" value="{$Languages['admin']['logforloginbutton']}"></td>
 		 </tr>
 		 <tr>
 		  <td colspan="2" align="right"><a href="{$insUrl}admin/index.php?action=forgot">[{$Languages['admin']['logforforgot']}]</a></td>
 		 </tr>
 		</form>
		</table>
		</div>
ENDPRINT;
		break;

	//Process the login
	case "loginProcess":
		$chkLogin = validateLogin($username,$password);
		if($chkLogin != "") {
			$username = protect(trim($username));
			$password = protect(trim($password));
			setLogin($chkLogin,$username,$password);

			$displayData =<<<ENDPRINT
			<div id="generalBox">
			<table width="100%" border="0" cellspacing="1" cellpadding="3">
			 <tr>
  			  <td><META HTTP-EQUIV="refresh" CONTENT=2;URL="{$insUrl}admin/index.php?action=events"><span class="error">{$Languages['admin']['logforloggingin']}</span></td>
  			 </tr>
  			</table>
  			</div>
ENDPRINT;
			}
			else {
				$displayData =<<<ENDPRINT
				<div id="generalBox">
				<table width="100%" border="0" cellspacing="1" cellpadding="3">
				<form method="post" action="{$insUrl}admin/index.php" onSubmit="return checkLogin(this);">
				<input type="hidden" name="action" value="loginProcess">
				 <tr>
  				  <td colspan="2" class="headtd">{$Languages['admin']['logforlogin']}</td>
		 		 </tr>
				 <tr>
		  		  <td colspan="2">
		  		   {$Languages['admin']['logforloginintro1']}<br>
		  		   <br>
		  		   <div align="center" class="error">{$Languages['admin']['logforloginerror']}</div>
		  		  </td>
		 		 </tr>
		 		 <tr>
		 		  <td align="right" width="50%">{$Languages['admin']['logforusername']}</td>
		 		  <td width="50%"><input type="text" name="username"></td>
		 		 </tr>
		 		 <tr>
		 		  <td align="right" width="50%">{$Languages['admin']['logforpassword']}</td>
		 		  <td width="50%"><input type="password" name="password"></td>
		 		 </tr>
				 <tr>
		  		  <td colspan="2" align="center"><input type="submit" value="{$Languages['admin']['logforloginbutton']}"></td>
		 		 </tr>
		 		 <tr>
		 		  <td align="right" colspan="2"><a href="{$insUrl}admin/index.php?action=forgot">[{$Languages['admin']['logforforgot']}]</a></td>
		 		 </tr>
		 		</form>
				</table>
				</div>
ENDPRINT;
				}
		break;

	case "logout":
		clearLogin();
		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td><META HTTP-EQUIV="refresh" CONTENT=2;URL="{$insUrl}calendar.php"><span class="error">{$Languages['admin']['logforloggingout']}</span></td>
		 </tr>
		</table>
		</div>
ENDPRINT;
		break;

	//Forgot password
	case "forgot":
		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		<form method="post" action="{$insUrl}admin/index.php">
		<input type="hidden" name="action" value="forgotSend">
		 <tr>
  		  <td colspan="2" class="headtd">{$Languages['admin']['logforforgot']}</td>
 		 </tr>
		 <tr>
  		  <td colspan="2">{$Languages['admin']['logforforgotintro']}</td>
 		 </tr>
 		 <tr>
 		  <td align="right" width="50%">{$Languages['admin']['logfornewemail']}</td>
 		  <td width="50%"><input type="text" name="email"></td>
 		 </tr>
		 <tr>
  		  <td colspan="2" align="center"><input type="submit" value="{$Languages['admin']['logforforgotbutton']}"></td>
 		 </tr>
 		</form>
		</table>
		</div>
ENDPRINT;
		break;

	case "forgotSend":
		$email = protect($email);
		$checkID = getUserIDEmail($email);
		if($checkID != "" && $checkID != 0) {
			$verificationCode = substr(md5($checkID.$email),0,16);
			$emailMessage = sprintf($Languages['admin']['logforforgotmessage'],$verificationCode);
			$fromEmail = $CalendarInfo['calendar_admin_email'];
			htmlMail($fromEmail,$email,$Languages['admin']['logforforgottopic'],$emailMessage);

			$displayData =<<<ENDPRINT
			<div id="generalBox">
			<table width="100%" border="0" cellspacing="1" cellpadding="3">
			<form method="post" action="{$insUrl}admin/index.php" onSubmit="return checkForgot(this);">
			<input type="hidden" name="action" value="forgotProcess">
			<input type="hidden" name="email" value="$email">
			 <tr>
  			  <td colspan="2" class="headtd">{$Languages['admin']['logforforgot']}</td>
	 		 </tr>
			 <tr>
  			  <td colspan="2">{$Languages['admin']['logforforgotsent']}</td>
	 		 </tr>
 			 <tr>
 			  <td align="right" width="50%">{$Languages['admin']['logforforgotcode']}</td>
	 		  <td width="50%"><input type="text" name="code"></td>
 			 </tr>
 			 <tr>
 			  <td align="right" width="50%">{$Languages['admin']['logfornewpassword1']}</td>
	 		  <td width="50%"><input type="password" name="pwd1"></td>
 			 </tr>
 			 <tr>
 			  <td align="right" width="50%">{$Languages['admin']['logfornewpassword2']}</td>
	 		  <td width="50%"><input type="password" name="pwd2"></td>
 			 </tr>
			 <tr>
	  		  <td colspan="2" align="center"><input type="submit" value="{$Languages['admin']['logforforgotbutton']}"></td>
 			 </tr>
 			</form>
			</table>
			</div>
ENDPRINT;
			}
			else {
				$displayData =<<<ENDPRINT
				<div id="generalBox">
				<table width="100%" border="0" cellspacing="1" cellpadding="3">
				<form method="post" action="{$insUrl}admin/index.php">
				<input type="hidden" name="action" value="forgotSend">
				 <tr>
		  		  <td colspan="2" class="headtd">{$Languages['admin']['logforforgot']}</td>
		 		 </tr>
				 <tr>
		  		  <td colspan="2">
		  		   {$Languages['admin']['logforforgotintro']}<br>
		  		   <br>
  		   		   <div align="center" class="error">{$Languages['admin']['logforforgotfail']}</div>
  		   		  </td>
		 		 </tr>
		 		 <tr>
		 		  <td align="right" width="50%">{$Languages['admin']['logfornewemail']}</td>
		 		  <td width="50%"><input type="text" name="email"></td>
		 		 </tr>
				 <tr>
		  		  <td colspan="2" align="center"><input type="submit" value="{$Languages['admin']['logforforgotbutton']}"></td>
		 		 </tr>
		 		</form>
				</table>
				</div>
ENDPRINT;
				}
		break;

	case "forgotProcess":
		$email = protect(trim($email));
		$code = protect(trim($code));
		$pwd1 = protect(trim($pwd1));
		$checkID = getUserIDEmail($email);
		$checkCode = substr(md5($checkID.$email),0,16);

		if($checkCode == $code) {
			resetPassword($checkID,$pwd1);
			$userInfo = getUserInfo($checkID);
			$displayData =<<<ENDPRINT
			<div id="generalBox">
			<table width="100%" border="0" cellspacing="1" cellpadding="3">
			<form method="post" action="{$insUrl}admin/index.php" onSubmit="return checkLogin(this);">
			<input type="hidden" name="action" value="loginProcess">
			 <tr>
	  		  <td colspan="2" class="headtd">{$Languages['admin']['logforforgot']}</td>
		 	 </tr>
			 <tr>
  			  <td colspan="2">{$Languages['admin']['logforforgotupdated']}</td>
		 	 </tr>
		 	 <tr>
		 	  <td align="right" width="50%">{$Languages['admin']['logforusername']}</td>
		 	  <td width="50%"><input type="text" name="username" value="{$userInfo['name']}"></td>
		 	 </tr>
		 	 <tr>
		 	  <td align="right" width="50%">{$Languages['admin']['logforpassword']}</td>
		 	  <td width="50%"><input type="password" name="password"></td>
		 	 </tr>
			 <tr>
		  	  <td colspan="2" align="center"><input type="submit" value="{$Languages['admin']['logforloginbutton']}"></td>
		 	 </tr>
		 	</form>
			</table>
			</div>
ENDPRINT;
			}
			else {
				$displayData =<<<ENDPRINT
				<div id="generalBox">
				<table width="100%" border="0" cellspacing="1" cellpadding="3">
				<form method="post" action="{$insUrl}admin/index.php" onSubmit="return checkForgot(this);">
				<input type="hidden" name="action" value="forgotProcess">
				<input type="hidden" name="email" value="$email">
				 <tr>
  				  <td colspan="2" class="headtd">{$Languages['admin']['logforforgot']}</td>
				 </tr>
				 <tr>
		  		  <td colspan="2">{$Languages['admin']['logforforgotfailed']}</td>
	 			 </tr>
		 		 <tr>
 				  <td align="right" width="50%">{$Languages['admin']['logforforgotcode']}</td>
				  <td width="50%"><input type="text" name="code"></td>
 				 </tr>
		 		 <tr>
 				  <td align="right" width="50%">{$Languages['admin']['logfornewpassword1']}</td>
				  <td width="50%"><input type="password" name="pwd1"></td>
 				 </tr>
		 		 <tr>
 				  <td align="right" width="50%">{$Languages['admin']['logfornewpassword2']}</td>
				  <td width="50%"><input type="password" name="pwd2"></td>
 				 </tr>
				 <tr>
	  			  <td colspan="2" align="center"><input type="submit" value="{$Languages['admin']['logforforgotbutton']}"></td>
		 		 </tr>
 				</form>
				</table>
				</div>
ENDPRINT;
				}
		break;		
	}

$CalendarInfo['calendar_header'] = "";
$CalendarInfo['calendar_footer'] = "";
$CalendarInfo['calendar_title'] = "";
include("../header.php");

echo<<<ENDPRINT
<div id="nav" style="text-align:left; padding:2px;"><a href="{$insUrl}calendar.php">{$Languages['nav']['return']}</a></div>
<br>
<div id="generalBox">
<table width="90%" border="0" cellspacing="1" cellpadding="3">
 <tr>
  <td valign="top" width="200">
   <a href="{$insUrl}admin/index.php?action=events">{$Languages['admin']['menuevents']}</a><br>
   <br>
   <br>
   <a href="{$insUrl}admin/index.php?action=logout">{$Languages['admin']['menulogout']}</a><br><br>
   <br>
   <br>
  </td>
  <td valign="top">
   $displayData
  </td>
 </tr>
</table> 
</div>
<br>
<div id="copyright" align="center">
 BosDates Lite v3.0<br>
</div>
ENDPRINT;

include("../footer.php");

?>