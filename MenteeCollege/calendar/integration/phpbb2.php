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
$intUserTable = "users";
$intUserID = "user_id";
$intUserName = "username";
$intUserEmail = "user_email";

if($cookie_prefix == "") { $cookie_prefix = "phpbb2mysql"; }

//See if the user is logged in
function authenticateUser() {
	global $integration_prefix,$int_link,$cookie_prefix,$cookie_path,$cookie_domain;

	if($_COOKIE[$cookie_prefix."_data"] != "") {
		$cookie = $_COOKIE[$cookie_prefix."_data"];
		$cookie_data = unserialize(preg_replace("'\\\'", "", $cookie));
        	$uid = $cookie_data['userid'];
        	if($uid == "" || $uid == "-1") { return false; }
		$result = query("SELECT session_user_id FROM {$integration_prefix}sessions WHERE session_id='{$_COOKIE[$cookie_prefix."_sid"]}'",$int_link);
		list($checkUsr) = mysql_fetch_row($result);
		if($uid == $checkUsr) { return true; }
			else { return false; }
		}
		else { return false; }
	}

//Check the username/password
function validateLogin($user,$pass) {
	global $integration_prefix,$int_link;
	$user = protect($user);
	$pass = md5(protect($pass));
	$result = query("SELECT user_id FROM {$integration_prefix}users WHERE username='$user' AND user_password='$pass'",$int_link);
	list($userID) = mysql_fetch_row($result);
	return $userID;
	}

//Set the cookie
function setLogin($chkLogin,$username,$password) {
	Global $int_link,$integration_prefix,$cookie_prefix,$cookie_path,$cookie_domain;

	$result = query("SELECT user_id FROM {$integration_prefix}users WHERE username='$username'",$int_link);
	list($check_id) = mysql_fetch_row($result);

	$dotquad_ip = getenv("REMOTE_ADDR");
    	$ip_sep = explode('.', $dotquad_ip);
    	$ipaddr = sprintf('%02x%02x%02x%02x', $ip_sep[0], $ip_sep[1], $ip_sep[2], $ip_sep[3]);

    	$sessiondata = array();
	$sessiondata['autologinid'] = md5($password);
	$sessiondata['userid'] = $chkLogin;

    	$sesstime = time();
	$session_id = md5(uniqid($ipaddr));

    	$result = query("DELETE FROM {$integration_prefix}sessions WHERE session_ip='$ipaddr'",$int_link);
    	$result = query("INSERT INTO {$integration_prefix}sessions (session_id,session_user_id,session_start,session_time,session_ip,session_page,session_logged_in) VALUES ('$session_id',$check_id, $sesstime, $sesstime, '$ipaddr', '0', '1')",$int_link);
	$result = query("UPDATE {$integration_prefix}users SET user_session_time='$sesstime',user_session_page='0',user_lastvisit='$sesstime' WHERE user_id=$check_id",$int_link);

    	setcookie($cookie_prefix."_data",serialize($sessiondata),$sesstime + 31536000,$cookie_path,$cookie_domain);
    	setcookie($cookie_prefix."_sid",$session_id,$sesstime + 31536000,$cookie_path,$cookie_domain);
	}

//Clear the cookie
function clearLogin() {
	global $cookie_prefix,$cookie_path,$cookie_domain,$integration_prefix,$int_link;
	$cookie = $_COOKIE[$cookie_prefix."_data"];
	$cookie_data = unserialize(preg_replace("'\\\'", "", $cookie));
        $uid = $cookie_data['userid'];
	$result = query("DELETE FROM {$integration_prefix}sessions WHERE session_user_id='$uid'",$int_link);
	$result = query("DELETE FROM {$integration_prefix}sessions_keys WHERE user_id='$uid'",$int_link);
	setcookie($cookie_prefix."_data","",time()-31536000,$cookie_path,$cookie_domain);
    	setcookie($cookie_prefix."_sid","",time()-31536000,$cookie_path,$cookie_domain);
    	setcookie($cookie_prefix."myDates","",time()-86400,$cookie_path,$cookie_domain);
	}

//Check username availability
function checkAvailable($username,$email,$userID=0) {
	global $int_link,$integration_prefix,$uus_link;

	$username = protect(trim($username));
	$email = strtolower(protect(trim($email)));

	$result = query("SELECT user_id FROM {$integration_prefix}users WHERE user_id != $userID AND (username='$username' OR user_email='$email')",$int_link);
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
	$datestamp = time();

	//Determine the next userID
	$result = query("SELECT MAX(user_id) FROM {$integration_prefix}users",$int_link);
	list($newID) = mysql_fetch_row($result);
	$newID++;

	//Add user to phpBB2
	$result = query("INSERT INTO {$integration_prefix}users (user_id,user_active,username,user_password,user_session_time,user_session_page,user_lastvisit,user_regdate,user_level,user_posts,user_timezone,user_style,user_lang,user_dateformat,user_new_privmsg,user_unread_privmsg,user_last_privmsg,user_login_tries,user_last_login_try,user_emailtime,user_viewemail,user_attachsig,user_allowhtml,user_allowbbcode,user_allowsmile,user_allowavatar,user_allow_pm,user_allow_viewonline,user_notify,user_notify_pm,user_popup_pm,user_rank,user_avatar,user_avatar_type,user_email,user_icq,user_website,user_from,user_sig,user_sig_bbcode_uid,user_aim,user_yim,user_msnm,user_occ,user_interests,user_actkey,user_newpasswd) VALUES ($newID,0,'$username','$password',0,0,0,$datestamp,0,0,'0.00',1,'english','D M d, Y g:i a',0,0,0,0,0,0,0,1,0,1,1,1,1,1,0,0,0,0,'',0,'$email','','','','','','','','','','','','')",$int_link);

	//Add user to BosDev UUS
	$result = query("INSERT INTO bosdevUUS (id,status,bd1) VALUES ($newID,0,0)",$uus_link);

	return $newID;
	}

//Activate the new account
function activateAccount($userID) {
	global $int_link,$integration_prefix,$uus_link;

	$userID = intval(protect($userID));

	$result = query("UPDATE {$integration_prefix}users SET user_active=1 WHERE user_id=$userID",$int_link);
	$result = query("UPDATE bosdevUUS SET status=1 WHERE id=$userID",$uus_link);
	}

//Reset the users password
function resetPassword($userID,$password) {
	global $int_link,$integration_prefix;

	$password = md5($password);
	$result = query("UPDATE {$integration_prefix}users SET user_password='$password' WHERE user_id=$userID",$int_link);
	}

//Get user id from email
function getUserIDEmail($email) {
	global $int_link,$integration_prefix;

	$email = protect($email);
	$result = query("SELECT user_id FROM {$integration_prefix}users WHERE user_email='$email'",$int_link);
	list($chkID) = mysql_fetch_row($result);

	return $chkID;
	}

//Get the user id
function getUserID() {
	global $cookie_prefix,$cookie_path,$cookie_domain;
	$cookie = $_COOKIE[$cookie_prefix."_data"];
	$cookie_data = unserialize(preg_replace("'\\\'", "", $cookie));
        $userID = $cookie_data['userid'];
	return $userID;
	}

//Get the users info
function getUserInfo($userID=0) {
	Global $int_link,$integration_prefix,$cookie_prefix,$cookie_path,$cookie_domain,$uus_link;
	if($userID == 0) {
		$cookie = $_COOKIE[$cookie_prefix."_data"];
		$cookie_data = unserialize(preg_replace("'\\\'", "", $cookie));
        	$userID = $cookie_data['userid'];
        	if($userID == "") { return false; }
		}
	$userID = intval(protect($userID));
	$result = query("SELECT username,user_email FROM {$integration_prefix}users WHERE user_id=$userID",$int_link);
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
		$cookie = $_COOKIE[$cookie_prefix."_data"];
		$cookie_data = unserialize(preg_replace("'\\\'", "", $cookie));
        	$userID = $cookie_data['userid'];
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