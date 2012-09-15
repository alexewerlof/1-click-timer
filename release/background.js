//** holds a pointer to the last notification window
var currNotificationToast = null;

// Run this every second
function intervalFn() {
	var t = timer.getTimer();
	timer.setTimer( t - 1 );
	console.log( "Interval running. timer: " + timer.getTimer() );

	//show the notification if the timer is up
	if ( timer.getTimer() == 0 ) {
		timer.stop();
		//if there's already a notification showing, hide it
		if ( currNotificationToast ) {
			currNotificationToast.cancel();
		}
		currNotificationToast = webkitNotifications.createHTMLNotification( 'notification.html' );
		currNotificationToast.show();
		console.log( "Showing notification!" );
	}
}


//** this class manages the timer and its numbering
Timer = function () {
	/** Sets the timer
	 * @param seconds the timer value in seconds (integer number or string)
	 */
	this.setTimer = function ( seconds ) {
		var t = parseInt( seconds );
		if ( t == null ) {
			console.log( "Error: setTimer(): could not convert parameter to a number: " + seconds );
			return;
		}
		while( t < 0 ) {
			t += 3600;
		}
		if ( t > 3600 ) {
			t = t % 3600;
		}
		localStorage[ "timer" ] = t;
		console.log( "Timer set to " + t );
		this.m = Math.floor( t / 60 );
		this.s = t % 60;
		this.mStr = this.m < 10? "0" + this.m : this.m;
		this.sStr = this.s < 10? "0" + this.s : this.s;
		this.updateBadge();
		
		// if popup is open update it
		var popup = chrome.extension.getViews( { type: "popup" } );
		if( popup.length == 1 ) {
			popup[0].updateCounter();
			popup[0].updateMuteButton();
			popup[0].updatePlayButton();
		}
	}
	
	//** sets the timer value with an offset to the current value. offset should be an integer number (NOT a string)
	this.setTimerOffset = function ( offset ) {
		this.setTimer( this.getTimer() + offset );
	}
	
	//** returns the number of remaining seconds. 0 <= result <= 3600
	this.getTimer = function () {
		//TODO: it will be more smart to returnt the difference between the time the timer was set and now
		return parseInt( localStorage[ "timer" ] );
	}

	//** Returns a boolean indicating the status of the mute
	this.isMute = function () {
		return localStorage[ "mute" ] == "true";
	}

	//** Sets the mute
	this.setMute = function ( mute ) {
		console.log( "Set mute to " + mute );
		if ( mute ) {
			chrome.browserAction.setIcon( { path: "images/popupicon_mute.png" } );
			localStorage[ "mute" ] = "true";
		} else {
			chrome.browserAction.setIcon( { path: "images/popupicon.png" } );
			localStorage[ "mute" ] = "false";
		}
	}

	//** start counting
	this.start = function () {
		if ( this.isCounting() ) {
			console.log( "Timer is already counting so no need to start again" );
			return;
		}
		//setup the interval function to tick every second
		this.intervalId = setInterval( intervalFn, 1000 );
		console.log( "Counting started" );
	}
	
	//** stops counting
	this.stop = function () {
		if ( this.intervalId ) {
			clearInterval( this.intervalId );
			this.intervalId = null;
			console.log( "Counting stopped" );
		} else {
			console.log( "Warning: there is no interval id to stop" );
		}
	}
	//** returns a boolean that indicates if the timer is running
	this.isCounting = function () {
		return this.intervalId != null;
	}

	//** takes care of the number shown in the badge, its background and the tooltip
	this.updateBadge = function () {
		//take care of the badge
		if ( this.getTimer() > 0 && this.isCounting() ) {
			if ( this.m < 1 ) {
				//less than a minute? show the seconds
				chrome.browserAction.setBadgeBackgroundColor( { color : [ 255, 0, 0, 255 ] } );
				chrome.browserAction.setBadgeText( { text: this.s + "s" } );
			} else {
				//more than a minute? show minutes
				//set a background between yellow to green depending on the minute
				var red = Math.floor( ( 60 - this.m ) * 255 / 60 );
				chrome.browserAction.setBadgeBackgroundColor( { color : [ red, 128, 0, 255 ] } );
				chrome.browserAction.setBadgeText( { text: this.m + "m" } );
			}
			chrome.browserAction.setTitle( { title: this.mStr + ":" + this.sStr + " remaining" } );
		} else {
			//hide badge and set the tooltip to sofware name
			chrome.browserAction.setTitle( { title: "1-click timer" } );
			chrome.browserAction.setBadgeText( { text: "" });
		}
	}

	//this code runs when the timer is just created
	if ( localStorage[ "timer" ] == null ) {
		this.setTimer( 0 );
	} else {
		this.setTimer( localStorage[ "timer" ] );
	}
	if ( localStorage[ "mute" ] == "false" ) {
		this.setMute( false );
	} else {
		this.setMute( true );
	}
}


//this code runs when the extension is loaded into the browser
var timer = new Timer();