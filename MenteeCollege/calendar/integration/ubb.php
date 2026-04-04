<?php
//////////////////////////// COPYRIGHT NOTICE //////////////////////////////
// This script is part of BosDates, a software application by BosDev, Inc //
// Use of any kind of part or all of this script or modification of this  //
// script requires a license from BosDev, Inc. Use or modification of     //
// this script without a license constitutes Software Piracy and will     //
// result in legal action from BosDev, Inc.  All rights reserved.         //
//            http://www.bosdev.com      sales@bosdev.com                 //
//                                                                        //
//            BosDates 4.51 Copyright 2003, BosDev, Inc.                  //
////////////////////////////////////////////////////////////////////////////

//Setup variables for the database information
$intUserTable = "Users";
$intUserID = "U_Number";
$intUserName = "U_LoginName";
$intUserEmail = "U_Email";

//See if the user is logged in
function authenticateUser() {
	global $integration_prefix,$int_link,$cookie_prefix,$cookie_path,$cookie_domain;
	if($_COOKIE[$cookie_prefix."w3t_myid"] != "") {
        	$uid = $_COOKIE[$cookie_prefix."w3t_myid"];
		$result = query("SELECT U_Password FROM {$integration_prefix}Users WHERE U_Number='$uid'",$int_link);
		list($check_password) = mysql_fetch_row($result);
		$db6password = md5($uid.$check_password);
		if($_COOKIE[$cookie_prefix."w3t_key"] == $db6password) { return true; }
			else { return false; }
		}
		else { return false; }
}

//Check the username/password
function validateLogin($user,$pass) {
	global $integration_prefix,$int_link;
	$user = protect($user);
	$pass = md5(protect($pass));
	$result = query("SELECT U_Number FROM {$integration_prefix}Users WHERE U_LoginName='$user' AND U_Password='$pass'",$int_link);
	list($userID) = mysql_fetch_row($result);
	return $userID;
	}

//Set the cookie
function setLogin($chkLogin,$username,$password) {
	global $cookie_prefix,$cookie_path,$cookie_domain;
	$db6password = md5($chkLogin.md5($password));
    	srand((double)microtime()*1000000);
    	$newsessionid = md5(rand(0,32767));
    	$date = time()+($Globals['gmtoffset']*3600);
	setcookie($cookie_prefix."w3t_myid",$chkLogin,time() + 2592000,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."w3t_key",$db6password,time() + 2592000,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."w3t_mysess","$newsessionid","0",$cookie_path,$cookie_domain);
	}

//Clear out the users cookies so they can logout
function clearLogin() {
	Global $integration_prefix,$int_link,$cookie_prefix,$cookie_path,$cookie_domain;
	$uid = $_COOKIE[$cookie_prefix."w3t_myid"];
	$result = query("UPDATE {$integration_prefix}Users SET U_SessionId = '' WHERE U_Number='$uid'",$int_link);
	setcookie($cookie_prefix."w3t_myid","",time() - 3600,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."w3t_key","",time() - 3600,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."w3t_mysess","",time() - 3600,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."w3t_visit","",time() - 3600,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."myDates","",time()-86400,$cookie_path,$cookie_domain);
	}

//Check username availability
function checkAvailable($username,$email,$userID=0) {
	global $int_link,$integration_prefix;

	$username = protect(trim($username));
	$email = strtolower(protect(trim($email)));

	$result = query("SELECT U_Number FROM {$integration_prefix}Users WHERE U_Number != $userID AND (U_LoginName='$username' OR U_Email='$email')",$int_link);
	list($chkID) = mysql_fetch_row($result);

	if($chkID != "") { return false; }
		else { return true; }
	}

//Create a new account
function createAccount($username,$email,$password) {
	global $uus_link,$int_link,$integration_prefix;

	$username = stripslashes(protect(trim($username)));
	$password = md5(protect(trim($password)));
	$email = strtolower(protect(trim($email)));
	$datestamp = time();
	$dotquad_ip = getenv("REMOTE_ADDR");
    	$ip_sep = explode('.', $dotquad_ip);
    	$ipaddr = sprintf('%02x%02x%02x%02x', $ip_sep[0], $ip_sep[1], $ip_sep[2], $ip_sep[3]);

	//Add user to UBB.Threads
	$result = query("INSERT INTO {$integration_prefix}Users (U_LoginName,U_Username,U_Password,U_Email,U_Totalposts,U_Laston,U_Status,U_Display,U_View,U_PostsPer,U_EReplies,U_Registered,U_Visible,U_PicturePosts,U_AcceptPriv,U_RegEmail,U_RegIP,U_Groups,U_Title,U_Color,U_Privates,U_StartPage,U_Favorites,U_Rating,U_Rates,U_SessionId,U_Approved,U_WhichForums,U_Categories,U_Banned,U_CoppaUser,U_Birthday,U_ShowBday) VALUES ('$username','$username','$password','$email',0,$datestamp,'User','flat','collapsed',10,'Off',$datestamp,'yes','on','yes','$email','$ipaddr','-3-','','',1,'cp','-','0',0,'0','no','all','-',0,0,'0',0)",$int_link);
	$newID = mysql_insert_id($int_link);

	//Add user to BosDev UUS
	$result = query("INSERT INTO bosdevUUS (id,status,bd1) VALUES ($newID,0,1)",$uus_link);

	return $newID;
	}

//Activate the new account
function activateAccount($userID) {
	global $uus_link,$int_link,$integration_prefix;

	$result = query("UPDATE {$integration_prefix}Users SET U_Approved='yes' WHERE U_Number=$userID",$int_link);
	$result = query("UPDATE bosdevUUS SET status=1 WHERE id=$userID",$uus_link);
	}

//Reset the users password
function resetPassword($userID,$password) {
	global $int_link,$integration_prefix;

	$password = md5($password);
	$result = query("UPDATE {$integration_prefix}Users SET U_Password='$password' WHERE U_Number=$userID",$int_link);
	}

//Get user id from email
function getUserIDEmail($email) {
	global $int_link,$integration_prefix;

	$email = protect($email);
	$result = query("SELECT U_Number FROM {$integration_prefix}Users WHERE U_Email='$email'",$int_link);
	list($chkID) = mysql_fetch_row($result);

	return $chkID;
	}

//Get the user id
function getUserID() {
	global $cookie_prefix;
	$userID = $_COOKIE[$cookie_prefix."w3t_myid"];
	return $userID;
	}

//Get the users info
function getUserInfo($userID=0) {
	global $uus_link,$cookie_prefix,$cookie_prefix,$int_link,$integration_prefix;

	if($userID == 0) {
		if($_COOKIE[$cookie_prefix."w3t_myid"] == "") { return false; }
		$userID = $_COOKIE[$cookie_prefix."w3t_myid"];
		}
	$userID = intval(protect($userID));

	$result = query("SELECT U_LoginName,U_Email FROM {$integration_prefix}Users WHERE U_Number=$userID",$int_link);
	list($username,$email) = mysql_fetch_row($result);

	$result = query("SELECT bdl FROM bosdevUUS WHERE id=$userID",$uus_link);
	list($isAdmin) = mysql_fetch_row($result);
	$userInfo['name'] = $username;
	$userInfo['email'] = $email;
	$userInfo['admPanel'] = $isAdmin;

	return $userInfo;
	}

//Get the extra users info
function getExtendedUserInfo($userID=0) {
	global $uus_link,$cookie_prefix;

	if($userID == 0) {
		if($_COOKIE[$cookie_prefix."w3t_myid"] == "") { return false; }
		$userID = $_COOKIE[$cookie_prefix."w3t_myid"];
		}
	$userID = intval(protect($userID));

	$result = query("SELECT extraFName,extraLName,extraAddr1,extraAddr2,extraCity,extraState,extraPostal,extraHPhone,extraMPhone FROM bosdevUUS WHERE id=$userID",$uus_link);
	list($fName,$lName,$addr1,$addr2,$city,$state,$postal,$hPhone,$mPhone) = mysql_fetch_row($result);
	$userExtraInfo['fname'] = $fName;
	$userExtraInfo['lname'] = $lName;
	$userExtraInfo['addr1'] = $addr1;
	$userExtraInfo['addr2'] = $addr2;
	$userExtraInfo['city'] = $city;
	$userExtraInfo['state'] = $state;
	$userExtraInfo['postal'] = $postal;
	$userExtraInfo['hphone'] = $hPhone;
	$userExtraInfo['mphone'] = $mPhone;
	return $userExtraInfo;
	}

?>