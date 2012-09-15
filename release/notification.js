
//snoozes the alarm for the specified number of seconds
function snooze( sec ) {
	timer.setTimerOffset( sec );
	timer.start();
	window.close();
}

//this code runs when the notification is just created (every notification is created from scratch)
var timer = chrome.extension.getBackgroundPage().timer;
if ( !timer.isMute() ) {
	document.getElementById( "sound" ).setAttribute( "autoplay", "autoplay" );
}
