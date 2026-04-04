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

//See if user is logged in
function authenticateUser() {
	global $uus_link,$cookie_prefix;

	if(!isset($_COOKIE[$cookie_prefix."bdUserID"])) { return false; }
	$chkData = substr($_COOKIE[$cookie_prefix."bdUserID"],0,8).substr($_COOKIE[$cookie_prefix."bdUserID"],-8);
	$userID = intval(substr($_COOKIE[$cookie_prefix."bdUserID"],8,strlen($_COOKIE[$cookie_prefix."bdUserID"])-16));
	$result = query("SELECT username,password FROM bosdevUUS WHERE id=$userID",$uus_link);
	list($chkUsr,$chkPass) = mysql_fetch_row($result);
	if($chkData == substr(md5($chkUsr),0,8).substr($chkPass,0,8)) {
		return true;
		}
		else { return false; }
	}

//Check the username/password
function validateLogin($user,$pass) {
	global $uus_link;

	$user = protect(trim($user));
	$pass = md5(protect(trim($pass)));
	$result = query("SELECT id FROM bosdevUUS WHERE username='$user' AND password='$pass' AND status=1",$uus_link);
	list($userID) = mysql_fetch_row($result);
	return $userID;
	}

//Set the cookie
function setLogin($chkLogin,$username,$password) {
	global $cookie_prefix,$cookie_path,$cookie_domain;

	$cookieData = substr(md5($username),0,8).$chkLogin.substr(md5($password),0,8);
	setcookie($cookie_prefix."bdUserID",$cookieData,time() + 604800,$cookie_path,$cookie_domain);
	}

//Clear the cookie
function clearLogin() {
	global $cookie_prefix,$cookie_path,$cookie_domain;

	setcookie($cookie_prefix."bdUserID","",time() - 604800,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."myDates","",time()-86400,$cookie_path,$cookie_domain);
	}

//Check username availability
function checkAvailable($username,$email,$userID=0) {
	global $uus_link;

	$username = protect(trim($username));
	$email = strtolower(protect(trim($email)));

	$result = query("SELECT id FROM bosdevUUS WHERE id != $userID AND (username='$username' OR email='$email')",$uus_link);
	list($chkID) = mysql_fetch_row($result);

	if($chkID != "") { return false; }
		else { return true; }
	}

//Create a new account
function createAccount($username,$email,$password) {
	global $uus_link;

	$username = stripslashes(protect(trim($username)));
	$password = md5(protect(trim($password)));
	$email = strtolower(protect(trim($email)));

	$result = query("INSERT INTO bosdevUUS (username,password,email,status,bdl) VALUES ('$username','$password','$email',0,1)",$uus_link);
	$newID = mysql_insert_id($uus_link);

	return $newID;
	}

//Activate the new account
function activateAccount($userID) {
	global $uus_link;

	$result = query("UPDATE bosdevUUS SET status=1 WHERE id=$userID",$uus_link);
	}

//Reset the users password
function resetPassword($userID,$password) {
	global $uus_link;

	$password = md5($password);
	$result = query("UPDATE bosdevUUS SET password='$password' WHERE id=$userID",$uus_link);
	}

//Get user id from email
function getUserIDEmail($email) {
	global $uus_link;

	$email = protect($email);
	$result = query("SELECT id FROM bosdevUUS WHERE email='$email'",$uus_link);
	list($chkID) = mysql_fetch_row($result);

	return $chkID;
	}

//Get the user id from cookie
function getUserID() {
	global $cookie_prefix;

	$userID = protect(substr($_COOKIE[$cookie_prefix."bdUserID"],8,-8));
	return $userID;
	}

//Get the users info
function getUserInfo($userID=0) {
	global $uus_link,$cookie_prefix;

	if($userID == 0) {
		if($_COOKIE[$cookie_prefix."bdUserID"] == "") { return false; }
		$userID = protect(substr($_COOKIE[$cookie_prefix."bdUserID"],8,-8));
		}
	$userID = intval(protect($userID));
	$result = query("SELECT username,email,bdl FROM bosdevUUS WHERE id=$userID",$uus_link);
	list($username,$email,$isAdmin) = mysql_fetch_row($result);
	$userInfo['name'] = $username;
	$userInfo['email'] = $email;
	$userInfo['admPanel'] = $isAdmin;

	return $userInfo;
	}

//Get the extra users info
function getExtendedUserInfo($userID=0) {
	global $uus_link,$cookie_prefix;

	if($userID == 0) {
		if($_COOKIE[$cookie_prefix."bdUserID"] == "") { return false; }
		$userID = protect(substr($_COOKIE[$cookie_prefix."bdUserID"],8,-8));
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