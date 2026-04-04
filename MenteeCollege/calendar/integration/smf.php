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
$intUserTable = "members";
$intUserID = "ID_MEMBER";
$intUserName = "memberName";
$intUserEmail = "emailAddress";

//See if the user is logged in
function authenticateUser() {
	global $integration_prefix,$int_link,$cookie_prefix,$cookie_path,$cookie_domain;

	if($_COOKIE[$cookie_prefix] != "") {
		$cookie = $_COOKIE[$cookie_prefix];
		$cookie_data = unserialize(preg_replace("'\\\'", "", $cookie));
		$uid = $cookie_data[0];
		$passHash = $cookie_data[1];
        	if($uid == "" || $uid == "-1") { return false; }

		$result = query("SELECT passwd,passwordSalt FROM {$integration_prefix}members WHERE ID_MEMBER=$uid",$int_link);
		list($checkPass,$checkSalt) = mysql_fetch_row($result);

		if($passHash == sha1($checkPass.$checkSalt)) { return true; }
			else { return false; }

		}
		else { return false; }
	}

//Check the username/password
function validateLogin($user,$pass) {
	global $integration_prefix,$int_link;
	$user = protect($user);
	$pass = sha1(strtolower($user) . protect($pass));
	$result = query("SELECT ID_MEMBER FROM {$integration_prefix}members WHERE memberName='$user' AND passwd='$pass'",$int_link);
	list($userID) = mysql_fetch_row($result);
	return $userID;
	}

//Set the cookie
function setLogin($chkLogin,$username,$password) {
	global $int_link,$integration_prefix,$cookie_prefix,$cookie_path,$cookie_domain;

	$result = query("SELECT passwordSalt,passwd FROM {$integration_prefix}members WHERE ID_MEMBER=$chkLogin",$int_link);
	list($salt,$passwd) = mysql_fetch_row($result);

	$passHash = sha1($passwd.$salt);
	$cookieData = serialize(array($chkLogin,$passHash,time()+31536000));

    	setcookie($cookie_prefix,$cookieData,time() + 31536000,$cookie_path,$cookie_domain);
	}

//Clear the cookie
function clearLogin() {
	global $cookie_prefix,$cookie_path,$cookie_domain,$integration_prefix,$int_link;

	//Clear any session which SMF may have set
	$session = @session_id();
	$result = query("DELETE FROM {$integration_prefix}sessions WHERE session_id='$session'",$int_link);

	setcookie($cookie_prefix,"",time()-31536000,$cookie_path,$cookie_domain);
    	setcookie($cookie_prefix."myDates","",time()-86400,$cookie_path,$cookie_domain);
	}

//Check username availability
function checkAvailable($username,$email,$userID=0) {
	global $int_link,$integration_prefix,$uus_link;

	$username = protect(trim($username));
	$email = strtolower(protect(trim($email)));

	$result = query("SELECT ID_MEMBER FROM {$integration_prefix}members WHERE ID_MEMBER != $userID AND (memberName='$username' OR emailAddress='$email')",$int_link);
	list($chkID) = mysql_fetch_row($result);

	if($chkID != "") { return false; }
		else { return true; }
	}

//Create a new account
function createAccount($username,$email,$password) {
	global $int_link,$integration_prefix,$uus_link;

	$username = stripslashes(protect(trim($username)));
	$password = sha1(strtolower($username) . protect(trim($password)));
	$email = strtolower(protect(trim($email)));
	$datestamp = time();
	$salt = substr(md5(rand()), 0, 4);
	$ip = $_SERVER['REMOTE_ADDR'];

	//Add user to SMF
	$result = query("INSERT INTO {$integration_prefix}members (ID_MEMBER,memberName,emailAddress,passwd,passwordSalt,posts,dateRegistered,memberIP,memberIP2,realName,personalText,pm_email_notify,ID_THEME,ID_POST_GROUP,hideEmail,is_activated) VALUES (NULL,'$username','$email','$password','$salt',0,$datestamp,'$ip','$ip','$username','',1,0,4,1,0)",$int_link);
	$newID = mysql_insert_id($int_link);

	//Add user to BosDev UUS
	$result = query("INSERT INTO bosdevUUS (id,status,bd1) VALUES ($newID,0,1)",$uus_link);

	return $newID;
	}

//Activate the new account
function activateAccount($userID) {
	global $int_link,$integration_prefix,$uus_link;

	$userID = intval(protect($userID));

	$result = query("UPDATE {$integration_prefix}members SET is_activated=1 WHERE ID_MEMBER=$userID",$int_link);
	$result = query("UPDATE bosdevUUS SET status=1 WHERE id=$userID",$uus_link);
	}

//Reset the users password
function resetPassword($userID,$password) {
	global $int_link,$integration_prefix;

	$result = query("SELECT memberName FROM {$integration_prefix}members WHERE ID_MEMBER=$userID",$int_link);
	list($username) = mysql_fetch_row($result);

	$password = sha1(strtolower($username) . protect(trim($password)));

	$result = query("UPDATE {$integration_prefix}members SET passwd='$password' WHERE ID_MEMBER=$userID",$int_link);
	}

//Get user id from email
function getUserIDEmail($email) {
	global $int_link,$integration_prefix;

	$email = protect($email);
	$result = query("SELECT ID_MEMBER FROM {$integration_prefix}members WHERE emailAddress='$email'",$int_link);
	list($chkID) = mysql_fetch_row($result);

	return $chkID;
	}

//Get the user id
function getUserID() {
	global $cookie_prefix,$cookie_path,$cookie_domain;
	$cookie = $_COOKIE[$cookie_prefix];
	$cookie_data = unserialize(preg_replace("'\\\'", "", $cookie));
	$userID = $cookie_data[0];
	return $userID;
	}

//Get the users info
function getUserInfo($userID=0) {
	Global $int_link,$integration_prefix,$cookie_prefix,$cookie_path,$cookie_domain,$uus_link;
	if($userID == 0) {
		$cookie = $_COOKIE[$cookie_prefix];
		$cookie_data = unserialize(preg_replace("'\\\'", "", $cookie));
		$userID = $cookie_data[0];
        	if($userID == "") { return false; }
		}
	$userID = intval(protect($userID));
	$result = query("SELECT memberName,emailAddress FROM {$integration_prefix}members WHERE ID_MEMBER=$userID",$int_link);
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
		$cookie = $_COOKIE[$cookie_prefix];
		$cookie_data = unserialize(preg_replace("'\\\'", "", $cookie));
		$userID = $cookie_data[0];
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