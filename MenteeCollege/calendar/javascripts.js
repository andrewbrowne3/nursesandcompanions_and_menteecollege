function popUp(URL,w,h) {
	winl = (screen.width - w) / 2;
	wint = (screen.height - h) / 2;
	day = new Date();
	id = day.getTime();
	eval("eventPage" + id + " = window.open(URL, '" + id + "', 'toolbar=0,scrollbars=1,location=0,status=1,menubar=0,resizable=1,width="+w+",height="+h+",top="+wint+",left="+winl+"');");
	}


var offsetxpoint=-60;
var offsetypoint=20;



var ie=document.all;
var ns6=document.getElementById && !document.all;
var enabletip=false;
if (ie||ns6) { var tipobj=document.all? document.all["eventDetails"] : document.getElementById? document.getElementById("eventDetails") : "" }

function ietruebody(){
	return (document.compatMode && document.compatMode!="BackCompat")? document.documentElement : document.body
	}

function eventDetailsBox(theText){
	if (ns6||ie){
		tipobj.innerHTML=theText;
		enabletip=true;
		return false;
		}
	}

function positiontip(e){
	if (enabletip){
		var curX=(ns6)?e.pageX : event.x+ietruebody().scrollLeft;
		var curY=(ns6)?e.pageY : event.y+ietruebody().scrollTop;
		var rightedge=ie&&!window.opera? ietruebody().clientWidth-event.clientX-offsetxpoint : window.innerWidth-e.clientX-offsetxpoint-20
		var bottomedge=ie&&!window.opera? ietruebody().clientHeight-event.clientY-offsetypoint : window.innerHeight-e.clientY-offsetypoint-20

		var leftedge=(offsetxpoint<0)? offsetxpoint*(-1) : -1000

		if (rightedge<tipobj.offsetWidth)
			tipobj.style.left=ie? ietruebody().scrollLeft+event.clientX-tipobj.offsetWidth+"px" : window.pageXOffset+e.clientX-tipobj.offsetWidth+"px"
		else if (curX<leftedge)
			tipobj.style.left="5px"
		else
			tipobj.style.left=curX+offsetxpoint+"px"

		if (bottomedge<tipobj.offsetHeight)
			tipobj.style.top=ie? ietruebody().scrollTop+event.clientY-tipobj.offsetHeight-offsetypoint+"px" : window.pageYOffset+e.clientY-tipobj.offsetHeight-offsetypoint+"px"
		else
			tipobj.style.top=curY+offsetypoint+"px"
			tipobj.style.visibility="visible"
			}
	}

function hideEventDetailsBox(){
	if (ns6||ie){
		enabletip=false
		tipobj.style.visibility="hidden"
		tipobj.style.left="-1000px"
		tipobj.style.backgroundColor=''
		tipobj.style.width=''
		}
	}

document.onmousemove=positiontip

function checkLogin(form) {
	if (trim(form.username.value) == "") {
		form.username.focus();
		return false;
		}
	if (trim(form.password.value) == "") {
		form.password.focus();
		return false;
		}
	return true;
	}
	
function checkForgot(form) {
	if (trim(form.code.value) == "") {
		form.code.focus();
		return false;
		}
	if (trim(form.pwd1.value) == "") {
		form.pwd1.focus();
		return false;
		}
	if (trim(form.pwd1.value) == "") {
		form.pwd1.focus();
		return false;
		}
	if(form.pwd1.value != form.pwd2.value) {
		form.pwd1.focus();
		return false;
		}
	return true;
	}	