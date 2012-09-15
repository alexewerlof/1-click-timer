//called by background to update the counter value
function updateCounter () {
	minuteCounterDigit.innerHTML =  timer.mStr ;
	secondCounterDigit.innerHTML =  timer.sStr ;
	
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
function onPlayPause ( evt ) {
	if ( timer.isCounting() ) {
		timer.stop();
	} else {
		timer.start();
	}
	updatePlayButton();
}

//** triggers when user presses the rest button
function onReset ( evt ) {
	timer.stop();
	timer.setTimer( 0 );
}

//** toggles sound
function onMuteSound ( evt ) {
	timer.setMute( !timer.isMute() );
	updateMuteButton();
}

//** fires when the user uses mouse wheel over the minute counter
function onMinuteWheel ( evt ) {
	if ( evt.wheelDelta > 0 ) {
		changeCounter( 60 );
	} else {
		changeCounter( -60 );
	}
	return false;
}

//** fires when the user uses mouse wheel over the second counter
function onSecondWheel ( evt ) {
	if ( evt.wheelDelta > 0 ) {
		changeCounter( 1 );
	} else {
		changeCounter( -1 );
	}
	return false;
}

function onMinuteUp ( evt ) {
	changeCounter( 60 );
}

function onMinuteDown ( evt ) {
	changeCounter( -60 );
}

function onSecondUp ( evt ) {
	changeCounter( 1 );
}

function onSecondDown ( evt ) {
	changeCounter( -1 );
}

var timer;
var pausePlayBtn;
var resetBtn;
var muteSoundBtn;
var minuteUpBtn;
var minuteDownBtn;
var secondUpBtn;
var secondDownBtn;
var minuteCounterDigit;
var secondCounterDigit;
var minuteSelector;

document.addEventListener('DOMContentLoaded', function () {
	//the timer from the backgorund page
	timer = chrome.extension.getBackgroundPage().timer;

	//id assignment
	pausePlayBtn = document.getElementById( "pause-play" );
	resetBtn = document.getElementById( "reset" );
	muteSoundBtn = document.getElementById( "mute-sound" );
	minuteUpBtn = document.getElementById( "minute-up" );
	minuteDownBtn = document.getElementById( "minute-down" );
	secondUpBtn = document.getElementById( "second-up" );
	secondDownBtn = document.getElementById( "second-down" );
	minuteCounterDigit = document.getElementById( "minute-counter" );
	secondCounterDigit = document.getElementById( "second-counter" );
	minuteSelector = document.getElementById( "minute-selector" );

	//adding event listeners
	pausePlayBtn.addEventListener( "click", onPlayPause );
	resetBtn.addEventListener( "click", onReset );
	muteSoundBtn.addEventListener( "click", onMuteSound );
	minuteUpBtn.addEventListener( "click", onMinuteUp );
	minuteDownBtn.addEventListener( "click", onMinuteDown );
	secondUpBtn.addEventListener( "click", onSecondUp );
	secondDownBtn.addEventListener( "click", onSecondDown );
	minuteCounterDigit.addEventListener( "mousewheel", onMinuteWheel );
	secondCounterDigit.addEventListener( "mousewheel", onSecondWheel );
	minuteSelector.addEventListener( "mousewheel", onMinuteWheel );
	
	//this code runs when the popup window just opens
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
	
	updateCounter();
	updateMuteButton();
	updatePlayButton();
});