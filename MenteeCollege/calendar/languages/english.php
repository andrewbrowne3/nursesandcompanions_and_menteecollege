<?php

//-------------------------------------------------------------------------------------
//
// English language file for BosDates Lite by BosDev
//
// Translation by: BosDev  sales@bosdev.com
//
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//
// Instructions to produce your own translation
//
// Replace the text below, leaving the $Languages[''][''] section alone.  Only translate
// text which is between the " " marks.  DO NOT CHANGE the %s or \r\n portions of the
// text as it will break the scripts
//
// If your language require a special charset to be sent to the browser, make sure to
// change it below or your translation will not show up properly.
//
// After creating your translation file, save it to the languages directory and then
// you will be able to activate it in the system admin menu.
//
//--------------------------------------------------------------------------------------

//meta-tag
$Languages['global']['charset'] = "iso-8859-1";

//Global
$Languages['global']['days'] = array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
$Languages['global']['daysupershort'] = array("S","M","T","W","T","F","S");
$Languages['global']['months'] = array("","January","February","March","April","May","June","July","August","September","October","November","December");
$Languages['global']['monthshort'] = array("","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");

//Date/Time format
$Languages['dateformat'] = "d,m,y"; //m=month, d=day, y=year DO NOT TRANSLATE THIS LINE, JUST MAKE THE CHANGE NEEDED
$Languages['timeformat'] = "12"; //12=am/pm, 24=24h DO NOT TRANSLATE THIS LINE, JUST MAKE THE CHANGE NEEDED

//Navigation
$Languages['nav']['2week'] = "2 Week";
$Languages['nav']['admin'] = "admin";
$Languages['nav']['and'] = "and";
$Languages['nav']['day'] = "Day";
$Languages['nav']['go'] = "go";
$Languages['nav']['menu'] = "menu";
$Languages['nav']['month'] = "Month";
$Languages['nav']['nextsyb'] = ">>";
$Languages['nav']['prevsyb'] = "<<";
$Languages['nav']['print'] = "print";
$Languages['nav']['return'] = "return to calendar";
$Languages['nav']['search'] = "search";
$Languages['nav']['today'] = "today";
$Languages['nav']['week'] = "Week";
$Languages['nav']['weekof'] = "Week of";
$Languages['nav']['weeksof'] = "Weeks of";
$Languages['nav']['year'] = "Year";

//Event display
$Languages['event']['allday'] = "All day";
$Languages['event']['close'] = "close window";
$Languages['event']['contact'] = "Contact";
$Languages['event']['date'] = "Date";
$Languages['event']['description'] = "Description";
$Languages['event']['link'] = "Link";
$Languages['event']['time'] = "Time";
$Languages['event']['title'] = "Title";
$Languages['event']['where'] = "Where";

//Search screen
$Languages['search']['button'] = "search!";
$Languages['search']['criteria'] = "Search for";
$Languages['search']['date'] = "Date range";
$Languages['search']['fields'] = "Search fields";
$Languages['search']['fieldscontact'] = "Contact";
$Languages['search']['fieldsdesc'] = "Description";
$Languages['search']['fieldsloc'] = "Location";
$Languages['search']['fieldstitle'] = "Title";
$Languages['search']['noresults'] = "Sorry, your search did not produce any results";
$Languages['search']['results'] = "Search results";
$Languages['search']['search'] = "Search";

//Admin screens
$Languages['admin']['databasebackup'] = "Create backup";
$Languages['admin']['databasebackupintro'] = "To create a backup of the database, select which database you wish to backup below and click process.  You will be prompted to download the backup file to your computer for safe keeping.  Please keep in mind that this backup does not store any images for events, it is only a backup of the database itself.";
$Languages['admin']['databaseboth'] = "Both databases";
$Languages['admin']['databaserestore'] = "Restore backup";
$Languages['admin']['databaserestored'] = "The database has been restored.";
$Languages['admin']['databaserestoreintro'] = "To restore your calendar system using a backup file you have on your local computer, use the file selector below to locate the file and then click Process to restore the database.";
$Languages['admin']['menudatabase'] = "::Manage Database::";
$Languages['admin']['menuevents'] = "::Manage Events::";
$Languages['admin']['menulogout'] = "::Logout::";
$Languages['admin']['menustyle'] = "::Manage Stylesheets::";
$Languages['admin']['menusystem'] = "::Manage System::";
$Languages['admin']['menuusers'] = "::Manage Users::";
$Languages['admin']['no'] = "No";
$Languages['admin']['process'] = "Process";
$Languages['admin']['systemadmin'] = "Show admin link";
$Languages['admin']['systemalign'] = "Display alignment";
$Languages['admin']['systemcaltitle'] = "Calendar title";
$Languages['admin']['systemcenter'] = "Center";
$Languages['admin']['systemcss'] = "CSS";
$Languages['admin']['systemdescription'] = "Meta description";
$Languages['admin']['systemdisplay'] = "Event display";
$Languages['admin']['systemeventitems'] = "Display items";
$Languages['admin']['systemfontcolors'] = "Font colors";
$Languages['admin']['systemfonts'] = "Fonts";
$Languages['admin']['systemfontsizes'] = "Font sizes";
$Languages['admin']['systemfontstyles'] = "Font styles";
$Languages['admin']['systemfooter'] = "Calendar footer";
$Languages['admin']['systemfullscreen'] = "Fullscreen";
$Languages['admin']['systemheader'] = "Calendar header";
$Languages['admin']['systemitemcont'] = "Contact";
$Languages['admin']['systemitemdesc'] = "Description";
$Languages['admin']['systemitememail'] = "Email";
$Languages['admin']['systemitemend'] = "End time";
$Languages['admin']['systemitemloc1'] = "Location 1";
$Languages['admin']['systemitemloc2'] = "Location 2";
$Languages['admin']['systemitemstart'] = "Start time";
$Languages['admin']['systemitemtitle'] = "Title";
$Languages['admin']['systemkeywords'] = "Meta keywords";
$Languages['admin']['systemlanguage'] = "Language";
$Languages['admin']['systemleft'] = "Left";
$Languages['admin']['systempopup'] = "Pop-up";
$Languages['admin']['systemprint'] = "Print CSS";
$Languages['admin']['systemright'] = "Right";
$Languages['admin']['systemtitle'] = "Page title";
$Languages['admin']['systemupdated'] = "Your system options have been updated.";
$Languages['admin']['systemview'] = "Default view";
$Languages['admin']['useradd'] = "Add user";
$Languages['admin']['useradded'] = "New user has been added.";
$Languages['admin']['useradmin'] = "Admin";
$Languages['admin']['usercurrent'] = "Current users";
$Languages['admin']['userdelete'] = "delete";
$Languages['admin']['userdeleteintro'] = "Are you sure you wish to delete the user %s from the Universal User System?  This action will affect all BosDev products you use on your web site.";
$Languages['admin']['userdeleteuser'] = "Delete user";
$Languages['admin']['userdeleteuserdeleted'] = "User has been deleted.";
$Languages['admin']['useredit'] = "edit";
$Languages['admin']['usereditupdated'] = "User has been updated.";
$Languages['admin']['useredituser'] = "Edit user";
$Languages['admin']['useredituserintro'] = "Make your changes to this user below, and click Process to store the new information.  To keep the users current password, do not enter anything into the password box.";
$Languages['admin']['useredituserintroexternal'] = "Make your changes to this user below, and click Process to store the new information.  You may not change this users username, password, or email address.  If you need to change those items, you must use your external application.";
$Languages['admin']['useremail'] = "Email";
$Languages['admin']['usernormal'] = "Normal user";
$Languages['admin']['usernosuchuser'] = "We could not find the user you specified in your existing database. Please check the name and try again.";
$Languages['admin']['usernousers'] = "No matching users";
$Languages['admin']['userpassword'] = "Password";
$Languages['admin']['userstatus'] = "Verified user";
$Languages['admin']['usertype'] = "User type";
$Languages['admin']['userusername'] = "Username";
$Languages['admin']['yes'] = "Yes";
$Languages['admin']['stylecreate'] = "Create new stylesheet";
$Languages['admin']['stylecreated'] = "Your new stylesheet has been saved and is ready to be assigned to a calendar.";
$Languages['admin']['stylecreateintro'] = "Please build your stylesheet in the box below.  Please note that the required class names and ids have already been inserted for your convience.";
$Languages['admin']['stylecreatenoprint'] = "Please note, if you are building a print stylesheet, you must include the following code into the stylesheet: .noprint { display:none; visibility:hidden; }";
$Languages['admin']['stylecurrent'] = "Current stylesheets";
$Languages['admin']['styledelete'] = "delete";
$Languages['admin']['styledeleted'] = "Stylesheet has been deleted.";
$Languages['admin']['styledirerror'] = "Sorry, the script cannot create a new file in the /themes directory.  Please make sure you have the permissions for this directory set properly.";
$Languages['admin']['styleedit'] = "edit";
$Languages['admin']['styleedited'] = "Your stylesheet has been updated, and is now active on the calendar.";
$Languages['admin']['styleedithead'] = "Edit stylesheet";
$Languages['admin']['styleeditintro'] = "Make your changes to your stylesheet below. Once you are satisfied with your changes, click the Proceed button to store those changes and update the calendars assigned to this stylesheet.";
$Languages['admin']['styleintro'] = "Click the button to create a new stylesheet to use on the calendar.";
$Languages['admin']['styleinuse'] = "You cannot delete a stylesheet which is currently being used by the calendar.";
$Languages['admin']['stylename'] = "Filename for new stylesheet";
$Languages['admin']['stylenotdeleted'] = "Cannot delete the stylesheet, please check the file permissions.";
$Languages['admin']['systemlabel'] = "Label";

$Languages['admin']['cancel'] = "Cancel";
$Languages['admin']['eventappearance'] = "Event Appearance";
$Languages['admin']['eventcontact'] = "Contact Name";
$Languages['admin']['eventdate'] = "Date";
$Languages['admin']['eventdatetime'] = "Event Date/Time";
$Languages['admin']['eventdescription'] = "Event Description";
$Languages['admin']['eventemail'] = "Contact Email";
$Languages['admin']['eventend'] = "End time";
$Languages['admin']['eventfontcolor'] = "Color";
$Languages['admin']['eventfontface'] = "Font";
$Languages['admin']['eventfontsize'] = "Size";
$Languages['admin']['eventfontstyle'] = "Style";
$Languages['admin']['eventinformation'] = "Event Information";
$Languages['admin']['eventlink'] = "Web Link";
$Languages['admin']['eventlocation'] = "Location";
$Languages['admin']['eventnumdays'] = "Number of days";
$Languages['admin']['eventorclickhere'] = "Or, click here for an all day event";
$Languages['admin']['eventposted'] = "Thank you, your event has been posted as outlined below";
$Languages['admin']['eventsadd'] = "Add event";
$Languages['admin']['eventsaddintro'] = "To add an event, click the button below.";
$Languages['admin']['eventsaddnoendtime'] = "No end time";
$Languages['admin']['eventsallday'] = "All day";
$Languages['admin']['eventscurrent'] = "Current events";
$Languages['admin']['eventscurrentnone'] = "There are no events for this month.";
$Languages['admin']['eventsdelete'] = "delete";
$Languages['admin']['eventsdeletehead'] = "Delete event";
$Languages['admin']['eventsdeleteintro'] = "Are you sure you wish to delete this event?";
$Languages['admin']['eventsdonotrepeat'] = "Do not repeat";
$Languages['admin']['eventsedit'] = "edit";
$Languages['admin']['eventsedited'] = "Edit event";
$Languages['admin']['eventsevents'] = "events";
$Languages['admin']['eventsevery180'] = "Every 180 days";
$Languages['admin']['eventsevery30'] = "Every 30 days";
$Languages['admin']['eventsevery60'] = "Every 60 days";
$Languages['admin']['eventsevery90'] = "Every 90 days";
$Languages['admin']['eventsposted'] = "Event has been added to the following dates";
$Languages['admin']['eventsrepeat'] = "Repeat";
$Languages['admin']['eventssame2week'] = "Same day every 2 weeks";
$Languages['admin']['eventssamebiyearly'] = "Biyearly";
$Languages['admin']['eventssamedaily'] = "Daily";
$Languages['admin']['eventssamedate'] = "Same date every month, ie. 25th";
$Languages['admin']['eventssameday'] = "Same day every month, ie. 3rd Thursday";
$Languages['admin']['eventssamequarter'] = "Quarterly";
$Languages['admin']['eventssameweek'] = "Same day every week";
$Languages['admin']['eventssameyearly'] = "Yearly";
$Languages['admin']['eventsshowhide'] = "show/hide";
$Languages['admin']['eventstart'] = "Start time";
$Languages['admin']['eventstime'] = "Time";
$Languages['admin']['eventstimesoruntil'] = "times -OR- until";
$Languages['admin']['eventtitle'] = "Title";

$Languages['admin']['logforforgot'] = "Forgot password?";
$Languages['admin']['logforforgotbutton'] = "Verify";
$Languages['admin']['logforforgotcode'] = "Verification code";
$Languages['admin']['logforforgotfail'] = "Sorry, that email address does not exist in our records, please try again.";
$Languages['admin']['logforforgotfailed'] = "Sorry, but that verification code is not correct.  Please try again.";
$Languages['admin']['logforforgotintro'] = "In order to reset your password, we must first reverify your account.  Please enter your email address below, and click verify.";
$Languages['admin']['logforforgotmessage'] = "We have received a request to reset your password for the calendar.  If it was not you who made this request, then do nothing and your password will not be reset.\r\n\r\nIf you did request to reset your password, enter the following verification code and your desired password into the form you were just viewing.\r\n\r\nVerification code: %s";
$Languages['admin']['logforforgotsent'] = "We have sent instructions to the email address you supplied.  Please check your email now to receive the verification code.";
$Languages['admin']['logforforgottopic'] = "Request to reset your password";
$Languages['admin']['logforforgotupdated'] = "Thank you, we have updated your password. You may now login to your account below.";
$Languages['admin']['logforloggingin'] = "Logging in...";
$Languages['admin']['logforloggingout'] = "Logging out...";
$Languages['admin']['logforlogin'] = "Login to your account";
$Languages['admin']['logforloginbutton'] = "Login";
$Languages['admin']['logforloginerror'] = "Invalid username or password, please try again.";
$Languages['admin']['logforloginintro1'] = "To login, enter your username and password below.  If you do not have an account, you can create one by clicking the \"Create an account\" link below.  If you have an account, but you have forgotten your password, click the \"Forgot password\" link.";
$Languages['admin']['logfornewemail'] = "Your email address";
$Languages['admin']['logfornewpassword1'] = "Desired password";
$Languages['admin']['logfornewpassword2'] = "Re-enter password";
$Languages['admin']['logforpassword'] = "Password";
$Languages['admin']['logforusername'] = "Username";





?>