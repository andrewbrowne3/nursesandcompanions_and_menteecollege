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

if($userInfo['admPanel'] == 0) {
	header("Location: {$insUrl}calendar.php");
	die();
	}

switch($action) {
	case "users":
		//Add a user boxes
		if($SystemOptions['integration'] == "uus" || $SystemOptions['integration'] == "uus-intranet") {
			//If we're using the bosdevUUS, we need to present a full screen
			$addScreen =<<<ENDPRINT
			<script language="JavaScript" type="text/javascript">
			function checkAdd(form) {
				if (trim(form.newUserName.value) == "") {
					form.newUserName.focus();
					return false;
					}
				if (trim(form.newUserPass.value) == "") {
					form.newUserPass.focus();
					return false;
					}
				if (trim(form.newUserEmail.value) == "") {
					form.newUserEmail.focus();
					return false;
					}
				return true;
				}
			</script>
			<div id="generalBox">
			<table width="100%" border="0" cellspacing="1" cellpadding="3">
			<form method="post" action="{$insUrl}admin/index.php" name="newUser" onSubmit="return checkAdd(this);">
			<input type="hidden" name="action" value="usersAdd">
			 <tr>
			  <td class="headtd">{$Languages['admin']['useradd']}</td>
			 </tr>
			 <tr>
			  <td valign="top" width="50%">
			   {$Languages['admin']['userusername']}: <input type="text" name="newUserName"><br>
			   {$Languages['admin']['userpassword']}: <input type="text" name="newUserPass"><br>
			   {$Languages['admin']['useremail']}: <input type="text" name="newUserEmail"><br>
			   {$Languages['admin']['usertype']}: <select name="newUserGroup"><option value="0" selected>{$Languages['admin']['usernormal']}</option><option value="1">{$Languages['admin']['useradmin']}</option></select><br>
			   <input type="submit" value="{$Languages['admin']['process']}">
			  </td>
			 </tr>
			</form>
			</table>
			</div>
ENDPRINT;
			}
			else {
				//We're using an outside database
				if(isset($errMsg)) {
					$errMsg = "<tr><td align=\"center\">{$Languages['admin']['usernosuchuser']}</td></tr>";
					}
				$addScreen =<<<ENDPRINT
				<script language="JavaScript" type="text/javascript">
				function checkAdd(form) {
					if (trim(form.newUserName.value) == "") {
						form.newUserName.focus();
						return false;
						}
					return true;
					}
				</script>
				<div id="generalBox">
				<table width="100%" border="0" cellspacing="1" cellpadding="3">
				<form method="post" action="{$insUrl}admin/index.php" name="newUser" onSubmit="return checkAdd(this);">
				<input type="hidden" name="action" value="usersAdd">
				 <tr>
				  <td class="headtd">{$Languages['admin']['useradd']}</td>
				 </tr>
				 $errMsg
				 <tr>
				  <td valign="top" width="50%">
				   {$Languages['admin']['userusername']}: <input type="text" name="newUserName"><br>
				   {$Languages['admin']['usertype']}: <select name="newUserGroup"><option value="0" selected>{$Languages['admin']['no']}</option><option value="1">{$Languages['admin']['yes']}</option></select><br>
				   <input type="submit" value="{$Languages['admin']['process']}">
				  </td>
				 </tr>
				</form>
				</table>
				</div>
ENDPRINT;
				}

		//Get list of users, by alpha
		if(!isset($show) || $show == "") { $show = "a"; }
		$count = 0; $rowCount = 0;
		$count_array = array("a"=>0,"b"=>0,"c"=>0,"d"=>0,"e"=>0,"f"=>0,"g"=>0,"h"=>0,"i"=>0,"j"=>0,"k"=>0,"l"=>0,"m"=>0,"n"=>0,"o"=>0,"p"=>0,"q"=>0,"r"=>0,"s"=>0,"t"=>0,"u"=>0,"v"=>0,"w"=>0,"x"=>0,"y"=>0,"z"=>0,"oth"=>0);

		if($SystemOptions['integration'] == "uus" || $SystemOptions['integration'] == "uus-intranet") {
			//Using the bosdevUUS, so let's get our counts and display

			//Get counts
			$result = query("SELECT username FROM bosdevUUS ORDER BY username",$uus_link);
			while(list($uname) = mysql_fetch_row($result)) {
				$count++;
				$var = strtolower(substr($uname,0,1));
				if(trim($var) != "") {
					if(strstr("abcdefghijklmnopqrstuvwxyz",$var)) { $count_array[$var] = $count_array[$var] + 1; }
						else { $count_array['oth'] = $count_array['oth'] + 1; }
					}
				}

			if($show != "oth") { $query = "SELECT id,username,email,bdl FROM bosdevUUS WHERE username LIKE '$show%' ORDER BY bdl DESC,username"; }
				else { $query = "SELECT id,username,email,bdl FROM bosdevUUS WHERE username NOT REGEXP '^[A-Z]|^[a-z]' ORDER BY bdl DESC,username"; }

			$result = query($query,$uus_link);
			while(list($userID,$userName,$userEmail,$ugrp) = mysql_fetch_row($result)) {
				$email = "<a href=\"mailto:$userEmail\">$userEmail</a>";
				if($rowCount%2 != 0) { $class = "class=\"alttd\""; }
					else { $class = ""; }
				if($ugrp == 1) { $adminFlag = $Languages['admin']['useradmin']; }
					else { $adminFlag = ""; }
				$userList .=<<<ENDPRINT
				<tr>
				 <td $class width="100%">$userName [$email] <span class="small">$adminFlag</span></td>
				 <td $class width="100"><a href="index.php?action=usersEdit&user=$userID">{$Languages['admin']['useredit']}</a>|<a href="index.php?action=usersDelete&user=$userID">{$Languages['admin']['userdelete']}</a></td>
				</tr>
ENDPRINT;
				$rowCount++;
				}
			if($userList == "") { $userList = "<tr><td>{$Languages['admin']['usernousers']}</td></tr>"; }
			}
			else {
				//We're using an external system, so let's do a little more complicated listing

				//First get all the users from the external system
				$externalUser = array();
				$externalEmail = array();
				$result = query("SELECT {$intUserID},{$intUserName},{$intUserEmail} FROM {$integration_prefix}{$intUserTable} ORDER BY {$intUserName}",$int_link);
				while(list($userID,$userName,$userEmail) = mysql_fetch_row($result)) {
					$externalUser[$userID] = stripslashes($userName);
					$externalEmail[$userID] = stripslashes($userEmail);
					}

				//Now grab every ID from the bosdevUUS, and match them up
				$result = query("SELECT id,bdl FROM bosdevUUS",$uus_link);
				while(list($userID,$ugrp) = mysql_fetch_row($result)) {
					$count++;

					//Adjust user counts
					$var = trim(strtolower(substr($externalUser[$userID],0,1)));
					if($var == "") { continue; }
					if(strstr("abcdefghijklmnopqrstuvwxyz",$var)) { $count_array[$var] = $count_array[$var] + 1; }
						else { $count_array['oth'] = $count_array['oth'] + 1; }

					//Show this user now?
					if((strstr("abcdefghijklmnopqrstuvwxyz",$var) && $show == $var) || (!strstr("abcdefghijklmnopqrstuvwxyz",$var) && $show == "oth")) {
						$email = "<a href=\"mailto:{$externalEmail[$userID]}\">{$externalEmail[$userID]}</a>";
						if($rowCount%2 != 0) { $class = "class=\"alttd\""; }
							else { $class = ""; }
						if($ugrp == 1) { $adminFlag = $Languages['admin']['useradmin']; }
							else { $adminFlag = ""; }							
						$userList .=<<<ENDPRINT
						<tr>
				 		 <td $class width="100%">{$externalUser[$userID]} [$email] <span class="small">$adminFlag</span></td>
				 		 <td $class width="100"><a href="index.php?action=usersEdit&user=$userID">{$Languages['admin']['useredit']}</a>|<a href="index.php?action=usersDelete&user=$userID">{$Languages['admin']['userdelete']}</a></td>
						</tr>
ENDPRINT;
						$rowCount++;
						}
					}
				}

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menuusers']}</td>
		 </tr>
		 <tr>
		  <td>
		   $addScreen<br>
		   <br>
		   <table width="100%" border="0" cellspacing="0" cellpadding="3">
		    <tr>
		     <td class="headtd" colspan="2">{$Languages['admin']['usercurrent']} - $count</td>
		    </tr>
		    <tr>
		     <td width="100" valign="top">
		      <table width="100" border="0" cellspacing="1" cellpadding="3">
		       <tr><td><a href="index.php?action=users&show=a">A</a> ({$count_array['a']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=b">B</a> ({$count_array['b']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=c">C</a> ({$count_array['c']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=d">D</a> ({$count_array['d']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=e">E</a> ({$count_array['e']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=f">F</a> ({$count_array['f']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=g">G</a> ({$count_array['g']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=h">H</a> ({$count_array['h']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=i">I</a> ({$count_array['i']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=j">J</a> ({$count_array['j']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=k">K</a> ({$count_array['k']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=l">L</a> ({$count_array['l']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=m">M</a> ({$count_array['m']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=n">N</a> ({$count_array['n']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=o">O</a> ({$count_array['o']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=p">P</a> ({$count_array['p']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=q">Q</a> ({$count_array['q']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=r">R</a> ({$count_array['r']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=s">S</a> ({$count_array['s']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=t">T</a> ({$count_array['t']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=u">U</a> ({$count_array['u']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=v">V</a> ({$count_array['v']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=w">W</a> ({$count_array['w']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=x">X</a> ({$count_array['x']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=y">Y</a> ({$count_array['y']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=z">Z</a> ({$count_array['z']})</td></tr>
		       <tr><td><a href="index.php?action=users&show=oth">?</a> ({$count_array['oth']})</td></tr>
		      </table>
		     </td>
		     <td valign="top">
		      <table width="100%" border="0" cellspacing="1" cellpadding="3">
		       $userList
		      </table>
		     </td>
		    </tr>
		   </table>
		  </td>
		 </tr>
		</table>
		</div>
ENDPRINT;
		break;

	case "usersAdd":
		//Protect the variables
		$newUserName = protect($newUserName);
		$newUserPass = md5(protect($newUserPass));
		$newUserEmail = protect($newUserEmail);
		$newUserGroup = intval(protect($newUserGroup));

		$returnTo = strtolower(substr($newUserName,0,1));
		if(ord($returnTo) < 97 || ord($returnTo) > 122) { $returnTo = "?"; }

		if($SystemOptions['integration'] == "uus" || $SystemOptions['integration'] == "uus-intranet") {
			//We're using the bosdevUUS, so just insert the data
			$result = query("INSERT INTO bosdevUUS (id,username,password,email,bdl,status) VALUES (NULL,'$newUserName','$newUserPass','$newUserEmail',$newUserGroup,1)",$uus_link);
			$displayData =<<<ENDPRINT
			<div id="generalBox">
			<table width="100%" border="0" cellspacing="1" cellpadding="3">
			 <tr>
			  <td class="headtd">{$Languages['admin']['menuusers']}</td>
			 </tr>
			 <tr>
			  <td>
		  	   <table width="100%" border="0" cellspacing="1" cellpadding="3">
			    <tr>
			     <td class="headtd">{$Languages['admin']['useradd']}</td>
			    </tr>
			    <tr>
			     <td>
			      {$Languages['admin']['useradded']}
			     </td>
			    </tr>
			   </table>
			  </td>
			 </tr>
			</table>
			</div>
			<META HTTP-EQUIV="refresh" CONTENT=2;URL="{$insUrl}admin/index.php?action=users&show=$returnTo">
ENDPRINT;
			}
			else {
				//We're using an external system, let's verify the user.
				$result = query("SELECT $intUserID FROM {$integration_prefix}{$intUserTable} WHERE {$intUserName}='$newUserName'",$int_link);
				list($newUserID) = mysql_fetch_row($result);
				if($newUserID != "") {
					//User is valid, proceed
					$result = query("INSERT INTO bosdevUUS (id,bdl,status) VALUES ($newUserID,$newUserGroup,1)",$uus_link);
					$displayData =<<<ENDPRINT
					<div id="generalBox">
					<table width="100%" border="0" cellspacing="1" cellpadding="3">
					 <tr>
					  <td class="headtd">{$Languages['admin']['useradd']}</td>
					 </tr>
					 <tr>
					  <td>
					   {$Languages['admin']['useradded']}
					  </td>
					 </tr>
					</table>
					</div>
					<META HTTP-EQUIV="refresh" CONTENT=2;URL="{$insUrl}admin/index.php?action=users&show=$returnTo">
ENDPRINT;
					}
					else {
						//User is not valid, abort
						header("Location: index.php?action=users&errMsg=1"); die();
						}
				}
		break;

	case "usersEdit":
		$user = intval(protect($user));

		if($SystemOptions['integration'] == "uus" || $SystemOptions['integration'] == "uus-intranet") {
			//Using the bosdevUUS, so present complete screen
			$result = query("SELECT username,email,bdl,status FROM bosdevUUS WHERE id=$user",$uus_link);
			list($userName,$userEmail,$ugrp,$userStatus) = mysql_fetch_row($result);
			$userName = stripslashes($userName);
			$userEmail = stripslashes($userEmail);

			switch($userStatus) {
				case 0: $userStatus = "<option value=\"0\" selected>{$Languages['admin']['no']}</option><option value=\"1\">{$Languages['admin']['yes']}</option>"; break;
				case 1: $userStatus = "<option value=\"0\">{$Languages['admin']['no']}</option><option value=\"1\" selected>{$Languages['admin']['yes']}</option>"; break;
				}
			switch($ugrp) {
				case 0: $userAdmin = "<option value=\"0\" selected>{$Languages['admin']['usernormal']}</option><option value=\"1\">{$Languages['admin']['useradmin']}</option>"; break;
				case 1: $userAdmin = "<option value=\"0\">{$Languages['admin']['usernormal']}</option><option value=\"1\" selected>{$Languages['admin']['useradmin']}</option>"; break;
				}

			$displayData =<<<ENDPRINT
			<script language="JavaScript" type="text/javascript">
			function checkAdd(form) {
				if (trim(form.newUserName.value) == "") {
					form.newUserName.focus();
					return false;
					}
				if (trim(form.newUserEmail.value) == "") {
					form.newUserEmail.focus();
					return false;
					}
				return true;
				}
			</script>
			<div id="generalBox">
			<table width="100%" border="0" cellspacing="1" cellpadding="3">
			 <tr>
			  <td class="headtd">{$Languages['admin']['menuusers']}</td>
			 </tr>
			 <tr>
			  <td>
 			   <table width="100%" border="0" cellspacing="1" cellpadding="3">
			   <form method="post" action="{$insUrl}admin/index.php" name="newUser" onSubmit="return checkAdd(this);">
			   <input type="hidden" name="action" value="usersEditProcess">
			   <input type="hidden" name="user" value="$user">
			    <tr>
			     <td class="headtd">{$Languages['admin']['useredituser']}</td>
			    </tr>
			    <tr>
			     <td>{$Languages['admin']['useredituserintro']}</td>
			    </tr>
			    <tr>
			     <td valign="top">
			      {$Languages['admin']['userusername']}: <input type="text" name="newUserName" value="$userName"><br>
			      {$Languages['admin']['userpassword']}: <input type="text" name="newUserPass"><br>
			      {$Languages['admin']['useremail']}: <input type="text" name="newUserEmail" value="$userEmail"><br>
			      {$Languages['admin']['userstatus']}: <select name="newUserStatus">$userStatus</select><br>
			      {$Languages['admin']['usertype']}: <select name="newUserGroup">$userAdmin</select><br>
			     </td>
			    </tr>
		            <tr>
		             <td align="center"><input type="submit" value="{$Languages['admin']['process']}"></td>
		            </tr>
			   </form>
			   </table>
			  </td>
			 </tr>
			</table>
		        </div>
ENDPRINT;
			}
			else {
				//Using external database, only present a few options
				$result = query("SELECT bdl FROM bosdevUUS WHERE id=$user",$uus_link);
				list($ugrp) = mysql_fetch_row($result);

				$userInfo = getUserInfo($user);

				$displayData =<<<ENDPRINT
				<script language="JavaScript" type="text/javascript">
				function checkAdd(form) {
					if (trim(form.newUserName.value) == "") {
						form.newUserName.focus();
						return false;
						}
					if (trim(form.newUserEmail.value) == "") {
						form.newUserEmail.focus();
						return false;
						}
					return true;
					}
				</script>
				<div id="generalBox">
				<table width="100%" border="0" cellspacing="1" cellpadding="3">
				 <tr>
				  <td class="headtd">{$Languages['admin']['menuusers']}</td>
				 </tr>
				 <tr>
				  <td>
	 			   <table width="100%" border="0" cellspacing="1" cellpadding="3">
				   <form method="post" action="{$insUrl}admin/index.php" name="newUser" onSubmit="return checkAdd(this);">
				   <input type="hidden" name="action" value="usersEditProcess">
				   <input type="hidden" name="user" value="$user">
				    <tr>
				     <td class="headtd">{$Languages['admin']['useredituser']}</td>
				    </tr>
				    <tr>
				     <td>{$Languages['admin']['useredituserintroexternal']}</td>
				    </tr>
				    <tr>
				     <td valign="top" width="50%">
				      {$Languages['admin']['userusername']}: <input type="text" name="newUserName" value="{$userInfo['name']}" disabled><br>
				      {$Languages['admin']['usertype']}: <select name="newUserGroup">$userAdmin</select><br>
				     </td>
				    </tr>
			            <tr>
			             <td align="center"><input type="submit" value="{$Languages['admin']['process']}"></td>
			            </tr>
		            	   </form>
				   </table>
				  </td>
				 </tr>
				</table>
			        </div>
ENDPRINT;
				}
		break;

	case "usersEditProcess":
		//Protect the variables
		if($SystemOptions['integration'] == "uus" || $SystemOptions['integration'] == "uus-intranet") {
			$newUserName = protect($newUserName);
			if($newUserPass != "") {
				$newPass = 1;
				$newUserPass = md5(protect($newUserPass));
				}
			$newUserEmail = protect($newUserEmail);
			}
		$user = intval(protect($user));
		$newUserStatus = intval(protect($newUserStatus));
		$newUserGroup = intval(protect($newUserGroup));

		if($SystemOptions['integration'] == "uus" || $SystemOptions['integration'] == "uus-intranet") {
			//Update the bosdevUUS with, or without a new password
			if($newPass == 1) { $result = query("UPDATE bosdevUUS SET username='$newUserName',password='$newUserPass',email='$newUserEmail',bdl=$newUserGroup,status=$newUserStatus WHERE id=$user",$uus_link); }
				else { $result = query("UPDATE bosdevUUS SET username='$newUserName',email='$newUserEmail',bdl=$newUserGroup,status=$newUserStatus WHERE id=$user",$uus_link); }
			}
			else {
				//Update the bosdevUUS for external applications
				$result = query("UPDATE bosdevUUS SET bdl=$newUserGroup WHERE id=$user",$uus_link);
				}

		$editedUserInfo = getUserInfo($user);
		$returnTo = strtolower(substr($editedUserInfo['name'],0,1));
		if(ord($returnTo) < 97 || ord($returnTo) > 122) { $returnTo = "?"; }

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menuusers']}</td>
		 </tr>
		 <tr>
		  <td>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		    <tr>
		     <td class="headtd">{$Languages['admin']['useredituser']}</td>
		    </tr>
		    <tr>
		     <td>{$Languages['admin']['usereditupdated']}</td>
		    </tr>
		   </table>
		  </td>
		 </tr>
		</table>
		</div>
		<META HTTP-EQUIV="refresh" CONTENT=2;URL="{$insUrl}admin/index.php?action=users&show=$returnTo">
ENDPRINT;
		break;

	case "usersDelete":
		$user = intval(protect($user));
		$userDeleteInfo = getUserInfo($user);

		$msg = sprintf($Languages['admin']['userdeleteintro'],"<b>{$userDeleteInfo['name']}</b>");

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menuusers']}</td>
		 </tr>
		 <tr>
		  <td>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		   <form method="post" action="{$insUrl}admin/index.php" onReset="javascript:history.go(-1);">
		   <input type="hidden" name="action" value="usersDeleteProcess">
		   <input type="hidden" name="user" value="$user">
		    <tr>
		     <td class="headtd">{$Languages['admin']['userdeleteuser']}</td>
		    </tr>
		    <tr>
		     <td>
		      $msg<br>
		      <br>
		      <input type="reset" value="{$Languages['admin']['cancel']}"> <input type="submit" value="{$Languages['admin']['process']}">
		     </td>
		    </tr>
		   </form>
		   </table>
		  </td>
		 </tr>
		</table>
		</div>
ENDPRINT;
		break;

	case "usersDeleteProcess":
		$user = intval(protect($user));
		$userDeleteInfo = getUserInfo($user);
		$returnTo = strtolower(substr($userDeleteInfo['name'],0,1));
		if(ord($returnTo) < 97 || ord($returnTo) > 122) { $returnTo = "?"; }

		$result = query("DELETE FROM bosdevUUS WHERE id=$user",$uus_link);

		$displayData =<<<ENDPRINT
		<div id="generalBox">
		<table width="100%" border="0" cellspacing="1" cellpadding="3">
		 <tr>
		  <td class="headtd">{$Languages['admin']['menuusers']}</td>
		 </tr>
		 <tr>
		  <td>
		   <table width="100%" border="0" cellspacing="1" cellpadding="3">
		    <tr>
		     <td class="headtd">{$Languages['admin']['userdeleteuser']}</td>
		    </tr>
		    <tr>
		     <td>
		      {$Languages['admin']['userdeleteuserdeleted']}
		     </td>
		    </tr>
		   </table>
		  </td>
		 </tr>
		</table>
		</div>
		<META HTTP-EQUIV="refresh" CONTENT=2;URL="{$insUrl}admin/index.php?action=users&show=$returnTo">
ENDPRINT;
		break;

	}

?>