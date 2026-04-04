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
$intUserID = "id";
$intUserName = "name";
$intUserEmail = "email";

//Special variables needed for IPB
$authgroup = 1;
$membergroup = 3;
$lang = "en";

//See if the user is logged in
function authenticateUser() {
	global $integration_prefix,$int_link,$cookie_prefix,$cookie_path,$cookie_domain;

	if($_COOKIE[$cookie_prefix."member_id"] != "") {
		$id = $_COOKIE[$cookie_prefix."member_id"];
		$hash = $_COOKIE[$cookie_prefix."pass_hash"];

		$result = query("SELECT id FROM {$integration_prefix}members WHERE id=$id AND member_login_key='$hash'",$int_link);
		list($checkUsr) = mysql_fetch_row($result);

		if($id == $checkUsr) { return true; }
			else { return false; }
		}
		else { return false; }
	}

//Check the username/password
function validateLogin($user,$pass) {
	global $integration_prefix,$int_link;

	$user = trim(protect($user));
	$pass = trim(protect($pass));

	$result = query("SELECT c.converge_id,c.converge_pass_salt FROM {$integration_prefix}members_converge c LEFT JOIN {$integration_prefix}members m ON c.converge_id=m.id WHERE m.name='$user'",$int_link);
	list($userID,$salt) = mysql_fetch_row($result);

	$passhash = md5(md5($salt) . md5($pass));

	if($userID != "") {
		$result = query("SELECT converge_id FROM {$integration_prefix}members_converge WHERE converge_pass_hash='$passhash' AND converge_id=$userID",$int_link);
		list($chkID) = mysql_fetch_row($result);

		return $chkID;
		}
		else { return; }
	}

//Set the cookie
function setLogin($chkLogin,$username,$password) {
	Global $int_link,$integration_prefix,$cookie_prefix,$cookie_path,$cookie_domain;

	$chkLogin = intval(protect($chkLogin));
	$result = query("SELECT name,mgroup,member_login_key FROM {$integration_prefix}members WHERE id=$chkLogin",$int_link);
	list($name,$mgroup,$loginKey) = mysql_fetch_row($result);

	$sid = md5(uniqid(microtime()));

	setcookie($cookie_prefix."member_id",$chkLogin,time()+604800,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."pass_hash",$loginKey,time()+604800,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."session_id",$sid,time()+604800,$cookie_path,$cookie_domain);

	// Create/Destroy Session
	$time = time();
	$browser = substr($_SERVER['HTTP_USER_AGENT'], 0, 64);
	$ip = substr($_SERVER['REMOTE_ADDR'], 0, 16);
	$result = query("DELETE FROM {$integration_prefix}sessions WHERE ip_address='{$_SERVER['REMOTE_ADDR']}'",$int_link);
	$result = query("INSERT INTO {$integration_prefix}sessions (id,member_name,member_id,running_time,member_group,ip_address,browser,login_type) VALUES ('$sid','$name',$chkLogin,$time,$mgroup,'$ip','$browser','0')",$int_link);
	}

//Clear the cookie
function clearLogin() {
	global $cookie_prefix,$cookie_path,$cookie_domain,$integration_prefix,$int_link;

	$id = getUserID();

	$result = query("DELETE FROM {$integration_prefix}sessions WHERE member_id=$id",$int_link);

	setcookie($cookie_prefix."member_id","",time()-604800,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."pass_hash","",time()-604800,$cookie_path,$cookie_domain);
	setcookie($cookie_prefix."session_id","",time()-604800,$cookie_path,$cookie_domain);
    	setcookie($cookie_prefix."myDates","",time()-86400,$cookie_path,$cookie_domain);
	}

//Check username availability
function checkAvailable($username,$email,$userID=0) {
	global $int_link,$integration_prefix,$uus_link;

	$username = strtolower(protect(trim($username)));
	$email = strtolower(protect(trim($email)));

	$result = query("SELECT id FROM {$integration_prefix}members WHERE id != $userID AND (LOWER(name)='$username' OR email='$email')",$int_link);
	list($chkID) = mysql_fetch_row($result);

	if($chkID != "") { return false; }
		else { return true; }
	}

//Create a new account
function createAccount($username,$email,$password) {
	global $int_link,$integration_prefix,$uus_link,$authgroup,$lang;

	$username = stripslashes(protect(trim($username)));
	$password = protect(trim($password));
	$email = strtolower(protect(trim($email)));
	$salt = protect(salt(5));
	$loginKey = protect(loginKey());
	$joined = time();
	$ip = $REMOTE_ADDR;
	$passhash = md5(md5($salt) . md5($password));

	//Add user into the converge
	$result = query("INSERT INTO {$integration_prefix}members_converge (converge_id,converge_email,converge_joined,converge_pass_hash,converge_pass_salt) VALUES (NULL,'$email',$joined,'$passhash','$salt')",$int_link);
	$newID = mysql_insert_id();

	//Add user into the members
	$result = query("INSERT INTO {$integration_prefix}members (id,name,member_login_key,email,mgroup,posts,joined,ip_address,time_offset,view_sigs,email_pm,view_img,view_avs,restrict_post,view_pop,msg_total,new_msg,coppa_user,language,dst_in_use,allow_admin_mails,hide_email,subs_pkg_chosen,members_display_name) VALUES ($newID,'$username','$loginKey','$email',$authgroup,0,$joined,'$ip','',1,1,1,1,0,1,0,0,0,'$lang',0,1,0,0,'$username')",$int_link);
	$result = query("INSERT INTO {$integration_prefix}member_extra (id,vdirs) VALUES ($newID,'in:Inbox|sent:Sent Items')",$int_link);

	//Add user to BosDev UUS
	$result = query("INSERT INTO bosdevUUS (id,status,bd1) VALUES ($newID,0,1)",$uus_link);

	return $newID;
	}

//Activate the new account
function activateAccount($userID) {
	global $int_link,$integration_prefix,$uus_link,$membergroup;

	$userID = intval(protect($userID));

	$result = query("UPDATE {$integration_prefix}members SET mgroup=$membergroup WHERE id=$userID",$int_link);
	$result = query("UPDATE bosdevUUS SET status=1 WHERE id=$userID",$uus_link);
	}

//Reset the users password
function resetPassword($userID,$password) {
	global $int_link,$integration_prefix;

	$result = query("SELECT converge_pass_salt FROM {$integration_prefix}members_converge WHERE converge_id=$userID",$int_link);
	list($salt) = mysql_fetch_row($result);

	$passhash = md5(md5($salt) . md5($password));

	$result = query("UPDATE {$integration_prefix}members_converge SET converge_pass_hash='$passhash' WHERE converge_id=$userID",$int_link);
	}

//Get user id from email
function getUserIDEmail($email) {
	global $int_link,$integration_prefix;

	$email = trim(protect($email));
	$result = query("SELECT id FROM {$integration_prefix}members WHERE email='$email'",$int_link);
	list($chkID) = mysql_fetch_row($result);

	return $chkID;
	}

//Get the user id
function getUserID() {
	global $cookie_prefix,$cookie_path,$cookie_domain;

	$userID = $_COOKIE[$cookie_prefix."member_id"];

	return $userID;
	}

//Get the users info
function getUserInfo($userID=0) {
	Global $int_link,$integration_prefix,$cookie_prefix,$cookie_path,$cookie_domain,$uus_link;

	if($userID == 0) {
        	$userID = getUserID();
        	if($userID == "") { return false; }
		}

	$userID = intval(protect($userID));
	$result = query("SELECT name,email FROM {$integration_prefix}members WHERE id=$userID",$int_link);
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
        	$userID = getUserID();
        	if($userID == "") { return false; }
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

//Salt routine for IPB
function salt($len=5){
	$salt = '';
	for ( $i = 0; $i < $len; $i++ ){
		$num   = rand(33, 126);
		if ( $num == '92' ){ $num = 93; }
		$salt .= chr( $num );
		}
	return $salt;
	}

function loginKey() {
	$return = salt(60);
	return md5($return);
	}


?>