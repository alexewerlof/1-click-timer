//called by background to update the counter value
function updateCounter () {
	document.getElementById( "minute-counter" ).innerHTML =  timer.mStr ;
	document.getElementById( "second-counter" ).innerHTML =  timer.sStr ;
	
	// update the #minute-selector
	var m = timer.m;
	for ( var j = 1; j <= 60; j++ ) {
		if ( j <= m ) {
			document.getElementById( "li-" + j ).classList.add( "included" );
		} else {
			document.getElementById( "li-" + j ).classList.remove( "included" );
		}
	}
}

//** updates the play button
function updatePlayButton () {
	var target = document.getElementById( "pause-play" ).classList;
	if ( timer.isCounting() ) {
		target.add( "pause" );
		target.remove( "play" );
	} else {
		target.add( "play" );
		target.remove( "pause" );
	}
}

//** updates the mute button
function updateMuteButton () {
	var target = document.getElementById( "mute-sound" ).classList;
	if ( timer.isMute() ) {
		target.add( "mute" );
		target.remove( "sound" );
	} else {
		target.add( "sound" );
		target.remove( "mute" );
	}
}

//** changes the value of the counter with an offset
function changeCounter ( offset ) {
	timer.setTimerOffset( offset );
	updateCounter();
}
//** toggles stop status
function onPlayPause() {
	if ( timer.isCounting() ) {
		timer.stop();
	} else {
		timer.start();
	}
	updatePlayButton();
}

//** triggers when user presses the rest button
function onReset() {
	timer.stop();
	timer.setTimer( 0 );
}

//** toggles sound
function onMuteSound() {
	timer.setMute( !timer.isMute() );
	updateMuteButton();
}

//** fires when the user uses mouse wheel over the minute counter
function onMinuteWheel( event) {
	if ( event.wheelDelta > 0 ) {
		changeCounter( 60 );
	} else {
		changeCounter( -60 );
	}
	return false;
}

//** fires when the user uses mouse wheel over the second counter
function onSecondWheel( event ) {
	if ( event.wheelDelta > 0 ) {
		changeCounter( 1 );
	} else {
		changeCounter( -1 );
	}
	return false;
}

//this code runs when the popup window just opens
var minuteSelector = document.getElementById( "minute-selector" );
for ( var i = 60; i >= 1; i-- ) {
	var li = document.createElement( "li" );
	li.id = "li-" + i;
	li.innerHTML = '<span class= "minute-number">' + i + '</span>';
	(function ( i ) {
		li.onclick = function () {
			timer.setTimer( i * 60 );
			timer.start();
			updatePlayButton();
		}
	})( i, li );
	if ( i % 10 == 0 ) {
		li.classList.add( "tio" );
	}else if ( i % 5 == 0 ) {
		li.classList.add( "fem" );
	}
	minuteSelector.appendChild( li );
}

var timer = chrome.extension.getBackgroundPage().timer;
updateCounter();
updateMuteButton();
updatePlayButton();