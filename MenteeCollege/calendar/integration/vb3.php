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

//Special variable required by vBulletin 3
global $vblicense;
$vblicense = ""; //UPDATE THIS FIELD WITH YOUR VBULLETIN LICENSE NUMBER

$creationUserGroup = 3; //SET THIS TO THE USERGROUP TO PLACE THE USER IN, WHEN THEY CREATE THEIR ACCOUNT
$activationUserGroup = 2;  //SET THIS TO THE USERGROUP TO PLACE THE USER IN, WHEN THEY ACTIVATE THEIR ACCOUNT

$intUserTable = "user";
$intUserID = "userid";
$intUserName = "username";
$intUserEmail = "email";

//See if the user is logged in
function authenticateUser() {
	global $integration_prefix,$int_link,$cookie_prefix,$cookie_path,$cookie_domain,$vblicense;

	if($_COOKIE[$cookie_prefix."userid"] != "" && $_COOKIE[$cookie_prefix."password"] != "") {
        	$uid = $_COOKIE[$cookie_prefix."userid"];
        	if($uid == "") { $uid = 0; }

		$result = query("SELECT password,salt FROM {$integration_prefix}user WHERE userid=$uid",$int_link);
		list($check_password,$check_salt) = mysql_fetch_row($result);
		$cookiepass = md5($check_password . $vblicense);

		if($cookiepass == $_COOKIE[$cookie_prefix."password"]) { return true; } else { return false; }
		}
	}

//Check the username/password
function validateLogin($user,$pass) {
	Global $int_link,$integration_prefix,$vblicense;
	$user = protect($user);
	$result = query("SELECT userid,password,salt FROM {$integration_prefix}user WHERE username='$user'",$int_link);
	list($check_id,$check_password,$check_salt) = mysql_fetch_row($result);
	$md5cookpass = md5(md5(md5($pass) . $check_salt) . $vblicense);
	$md5dbpass = md5($check_password . $vblicense);
	$return = $check_id;
	if ($md5cookpass != $md5dbpass) { $return = ""; }
	return $return;
	}


//Set the cookie
function setLogin($chkLogin,$username,$password) {
	global $int_link,$integration_prefix,$cookie_prefix,$cookie_path,$cookie_domain,$vblicense;
	$username = protect($username);
	$result = query("SELECT userid,password,salt FROM {$integration_prefix}user WHERE username='$username'",$int_link);
	list($check_id,$check_password,$check_salt) = mysql_fetch_row($result);
 	$dbpassword = md5(md5($password) . $check_salt);
	$cookiepass = md5($dbpassword . $vblicense);
	setcookie( $cookie_prefix."userid", $check_id, time()+2592000,$cookie_path,$cookie_domain);
    	setcookie( $cookie_prefix."password", $cookiepass, time()+2592000,$cookie_path,$cookie_domain);
	}

//Clear the cookie
function clearLogin() {
	Global $cookie_prefix,$cookie_path,$cookie_domain;
	setcookie( $cookie_prefix."userid", "", time()-3600,$cookie_path,$cookie_domain);
	setcookie( $cookie_prefix."password", "", time()-3600,$cookie_path,$cookie_domain);
	setcookie( $cookie_prefix."sessionhash", "", time()-3600,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."myDates","",time()-86400,$cookie_path,$cookie_domain);
	return;
	}

//Check username availability
function checkAvailable($username,$email,$userID=0) {
	global $int_link,$integration_prefix;

	$username = protect(trim($username));
	$email = strtolower(protect(trim($email)));

	$result = query("SELECT userid FROM {$integration_prefix}user WHERE userid != $userID AND (username='$username' OR email='$email')",$int_link);
	list($chkID) = mysql_fetch_row($result);

	if($chkID != "") { return false; }
		else { return true; }

	}

//Create a new account
function createAccount($username,$email,$password) {
	global $int_link,$integration_prefix,$uus_link,$creationUserGroup;

	//Create salt
	$salt = '';
	for ($i = 0; $i < 3; $i++) { $salt .= chr(rand(32, 126)); }

	$datestamp = time();
	$date = date("Y-m-d");
	$username = strip_tags(protect(trim($username)));
	$email = strip_tags(protect(trim($email)));
	$password = strip_tags(protect(trim($password)));
	$dbpassword = md5(md5($password).$salt);

	//Add user to vBulletin
	$result = query("INSERT INTO {$integration_prefix}user (userid,usergroupid,membergroupids,displaygroupid,username,password,passworddate,email,styleid,parentemail,homepage,icq,aim,yahoo,showvbcode,usertitle,customtitle,joindate,daysprune,lastvisit,lastactivity,lastpost,posts,reputation,reputationlevelid,timezoneoffset,pmpopup,avatarid,avatarrevision,options,birthday,birthday_search,maxposts,startofweek,ipaddress,referrerid,languageid,msn,emailstamp,threadedmode,autosubscribe,pmtotal,pmunread,salt,profilepicrevision,showbirthday,skype) VALUES (NULL,$creationUserGroup,'',0,'$username','$dbpassword','$date','$email',0,'','','','','',1,'','',$datestamp,$datestamp,$datestamp,$datestamp,0,0,10,5,0,0,0,0,3159,'','$date',-1,-1,'$IP',0,1,'',0,0,-1,0,0,'$salt',0,0,'')",$int_link);
	$newID = mysql_insert_id($int_link);
	$result = query("INSERT INTO {$integration_prefix}userfield (userid,temp,field1,field2,field3,field4) VALUES ($newID,'','','','','')",$int_link);

	//Add user to BosDev UUS
	$result = query("INSERT INTO bosdevUUS (id,status,bd1) VALUES ($newID,0,1)",$uus_link);

	return $newID;

	}

//Activate the new account
function activateAccount($userID) {
	global $int_link,$integration_prefix,$uus_link,$activationUserGroup;

	//Update vBulletin
	$result = query("UPDATE {$integration_prefix}user SET usergroupid=$activationUserGroup WHERE userid=$userID",$int_link);

	//Update BosDev UUS
	$result = query("UPDATE bosdevUUS SET status=1 WHERE id=$userID",$uus_link);
	}

//Reset the users password
function resetPassword($userID,$password) {
	global $int_link,$integration_prefix;

	$result = query("SELECT salt FROM {$integration_prefix}user WHERE userid=$userID",$int_link);
	list($salt) = mysql_fetch_row($result);

	$password = strip_tags(protect(trim($password)));
	$dbpassword = md5(md5($password).$salt);
	$result = query("UPDATE {$integration_prefix}user SET password='$dbpassword' WHERE userid=$userID",$int_link);
	}

//Get user id from email
function getUserIDEmail($email) {
	global $int_link,$integration_prefix;

	$email = protect($email);
	$result = query("SELECT userid FROM {$integration_prefix}user WHERE email='$email'",$int_link);
	list($chkID) = mysql_fetch_row($result);

	return $chkID;
	}

//Get the user id
function getUserID() {
	global $cookie_prefix;
	$userID = $_COOKIE[$cookie_prefix."userid"];
	return $userID;
	}

//Get the users info
function getUserInfo($userID=0) {
	global $int_link,$integration_prefix,$cookie_prefix,$cookie_path,$cookie_domain,$vblicense,$uus_link;
	if($userID == 0) {
		if($_COOKIE[$cookie_prefix."userid"] == "") { return false; }
		$userID = $_COOKIE[$cookie_prefix."userid"];
		}
	$userID = intval(protect($userID));
	$result = query("SELECT username,email FROM {$integration_prefix}user WHERE userid=$userID",$int_link);
	list($username,$email) = mysql_fetch_row($result);
	$result = query("SELECT bd1,bd2,bd3 FROM bosdevUUS WHERE id=$userID",$uus_link);
	list($usergroup,$adminCalendars,$myCalendars) = mysql_fetch_row($result);
	$userInfo['name'] = $username;
	$userInfo['email'] = $email;
	if(intval($usergroup) == 0) { $usergroup = 1; }
	$userInfo['usergroup'] = $usergroup;
	$userInfo['adminCalendars'] = $adminCalendars;
	$userInfo['myDatesCalendars'] = $myCalendars;
	return $userInfo;
	}

//Get the extra users info
function getExtendedUserInfo($userID=0) {
	global $uus_link,$cookie_prefix;
	if($userID == 0) {
		if($_COOKIE[$cookie_prefix."userid"] == "") { return false; }
		$userID = $_COOKIE[$cookie_prefix."userid"];
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