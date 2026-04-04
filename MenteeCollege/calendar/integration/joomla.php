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

$intUserTable = "users";
$intUserID = "id";
$intUserName = "username";
$intUserEmail = "email";

//Special variables required to read Joomla cookies
$sitename = "";  //Example: http://www.bosdev.com/joomla
$secret = "";    //Example: hVEVtenirMMtQ8Ua




$cookie = md5("site".$sitename);

//See if the user is logged in
function authenticateUser() {
	global $secret,$cookie,$integration_prefix,$int_link,$cookie_path,$cookie_domain;

	if($_COOKIE[$cookie] != "" && $_COOKIE[$cookie] != "-") {
		$ip = $_SERVER['REMOTE_ADDR'];
		$browser = @$_SERVER['HTTP_USER_AGENT'];

		$dbSession = md5($secret.md5($_COOKIE[$cookie].$ip.$browser));

		$result = query("SELECT userid FROM {$integration_prefix}session WHERE session_id='$dbSession'",$int_link);
		list($chkUserID) = mysql_fetch_row($result);

		if(intval($chkUserID) != 0) { return true; }
			else { return false; }
		}
		else { return false; }
	}

//Check the username/password
function validateLogin($user,$pass) {
	Global $int_link,$integration_prefix;
	$user = protect($user);
	$result = query("SELECT id,password FROM {$integration_prefix}users WHERE username='$user' AND block=0",$int_link);
	list($check_id,$check_password) = mysql_fetch_row($result);
	if (md5(trim($pass)) != $check_password) { $return = ""; }
		else { return $check_id; }
	}


//Set the cookie
function setLogin($chkLogin,$username,$password) {
	global $int_link,$integration_prefix,$cookie_path,$cookie_domain,$secret,$cookie;

	$randnum = md5(uniqid(microtime(),1));
	$ip = $_SERVER['REMOTE_ADDR'];
	$browser = @$_SERVER['HTTP_USER_AGENT'];
	$dbSession = md5($secret.md5($randnum.$ip.$browser));

	//Get usertype/gid
	$result = query("SELECT usertype,gid FROM {$integration_prefix}users WHERE id=$chkLogin",$int_link);
	list($usertype,$gid) = mysql_fetch_row($result);

	//Remove old sessions
	$result = query("DELETE FROM {$integration_prefix}session WHERE userid=$chkLogin",$int_link);

	//Add new session
	$time = time();
	$result = query("INSERT INTO {$integration_prefix}session (username,time,session_id,guest,userid,usertype,gid) VALUES('$username',$time,'$dbSession',0,$chkLogin,'$usertype',$gid)",$int_link);

	//Set cookie
	setcookie( $cookie, $randnum, 0,$cookie_path,$cookie_domain);
	}

//Clear the cookie
function clearLogin() {
	global $int_link,$integration_prefix,$cookie_path,$cookie_domain,$secret,$cookie;

	//Remove old sessions
	$userID = getUserID();
	$result = query("DELETE FROM {$integration_prefix}session WHERE userid=$userID",$int_link);

	setcookie( $cookie, '', -1,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."myDates","",time()-86400,$cookie_path,$cookie_domain);
	return;
	}

//Check username availability
function checkAvailable($username,$email,$userID=0) {
	global $int_link,$integration_prefix;

	$username = protect(trim($username));
	$email = strtolower(protect(trim($email)));

	$result = query("SELECT id FROM {$integration_prefix}users WHERE id != $userID AND(username='$username' OR email='$email')",$int_link);
	list($chkID) = mysql_fetch_row($result);

	if($chkID != "") { return false; }
		else { return true; }

	}

//Create a new account
function createAccount($username,$email,$password) {
	global $int_link,$integration_prefix,$uus_link;

	$username = stripslashes(protect(trim($username)));
	$password = md5(protect(trim($password)));
	$email = strtolower(protect(trim($email)));
	$date = date("Y-m-d H:i:s");

	//Add user to Joomla
	$result = query("INSERT INTO {$integration_prefix}users (id,name,username,email,password,usertype,block,sendEmail,gid,registerDate,lastvisitDate,activation,params) VALUES (NULL,'$username','$username','$email','$password','',1,0,18,'$date','','','')",$int_link);
	$newID = mysql_insert_id($int_link);

	//Add user to BosDev UUS
	$result = query("INSERT INTO bosdevUUS (id,status,bd1) VALUES ($newID,0,1)",$uus_link);

	return $newID;
	}

//Activate the new account
function activateAccount($userID) {
	global $int_link,$integration_prefix,$uus_link;

	//Update Joomla
	$result = query("UPDATE {$integration_prefix}users SET block=0 WHERE id=$userID",$int_link);

	//Update BosDev UUS
	$result = query("UPDATE bosdevUUS SET status=1 WHERE id=$userID",$uus_link);
	}

//Reset the users password
function resetPassword($userID,$password) {
	global $int_link,$integration_prefix;

	$password = strip_tags(protect(trim($password)));
	$password = md5($password);
	$result = query("UPDATE {$integration_prefix}users SET password='$password' WHERE id=$userID",$int_link);
	}

//Get user id from email
function getUserIDEmail($email) {
	global $int_link,$integration_prefix;

	$email = protect($email);
	$result = query("SELECT id FROM {$integration_prefix}users WHERE email='$email'",$int_link);
	list($chkID) = mysql_fetch_row($result);

	return $chkID;
	}

//Get the user id
function getUserID() {
	global $secret,$cookie,$integration_prefix,$int_link,$cookie_path,$cookie_domain;

	$ip = $_SERVER['REMOTE_ADDR'];
	$browser = @$_SERVER['HTTP_USER_AGENT'];
	$dbSession = md5($secret.md5($_COOKIE[$cookie].$ip.$browser));
	$result = query("SELECT userid FROM {$integration_prefix}session WHERE session_id='$dbSession'",$int_link);
	list($chkUserID) = mysql_fetch_row($result);

	return $chkUserID;
	}

//Get the users info
function getUserInfo($userID=0) {
	global $int_link,$integration_prefix,$cookie_path,$cookie_domain,$uus_link,$secret,$cookie;
	if($userID == 0) {
		$ip = $_SERVER['REMOTE_ADDR'];
		$browser = @$_SERVER['HTTP_USER_AGENT'];
		$dbSession = md5($secret.md5($_COOKIE[$cookie].$ip.$browser));
		$result = query("SELECT userid FROM {$integration_prefix}session WHERE session_id='$dbSession'",$int_link);
		list($userID) = mysql_fetch_row($result);
		}
	$userID = intval(protect($userID));
	$result = query("SELECT username,email FROM {$integration_prefix}users WHERE id=$userID",$int_link);
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
	global $int_link,$integration_prefix,$cookie_path,$cookie_domain,$uus_link,$secret,$cookie;
	if($userID == 0) {
		$ip = $_SERVER['REMOTE_ADDR'];
		$browser = @$_SERVER['HTTP_USER_AGENT'];
		$dbSession = md5($secret.md5($_COOKIE[$cookie].$ip.$browser));
		$result = query("SELECT userid FROM {$integration_prefix}session WHERE session_id='$dbSession'",$int_link);
		list($userID) = mysql_fetch_row($result);
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