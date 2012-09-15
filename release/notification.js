//event listener for the close button
function onClose ( evt ) {
	window.close();
}

//snoozes the alarm for the specified number of seconds
function onSnooze ( evt ) {
	timer.setTimerOffset( parseInt( evt.target.getAttribute( "data-sec" ) ) );
	timer.start();
	window.close();
}

//this code runs when the notification is just created (every notification is created from scratch)
var timer;

document.addEventListener('DOMContentLoaded', function () {
	//the timer from the backgorund page
	timer = chrome.extension.getBackgroundPage().timer;
	//window close button
	document.getElementById( "close-window" ).addEventListener( "click", onClose );
	//set the handler for snooze buttons
	var snoozeButtons = document.getElementsByClassName( "snooze-time" );
	for ( var i = 0; i < snoozeButtons.length; i++ ) {
		var b = snoozeButtons[i];
		b.addEventListener( "click", onSnooze );
	}
	//audio playback
	if ( !timer.isMute() ) {
		document.getElementById( "sound" ).setAttribute( "autoplay", "autoplay" );
	}
});
