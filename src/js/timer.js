/**
 * Timer is bound to a hidden HTML input element.
 * The reason is that Zepto's event handling mechanism only works with nodes
 * (unlike jQuery which can accept plain objects. But Zepto was chosen because it is light weight).
 * Standard properties of this input element are used for controlling the functionality of the timer.
 * For example the current timer remaining seconds is the ".value".
 */
timer = $( document.createElement( 'input' ) );

timer.MAX_SEC = 3600;

//noinspection JSUnresolvedFunction
timer._audio = new Audio( 'audio/song.ogg' );
timer._audio.loop=true;

/** sets the timer counter in seconds */
timer.set = function ( sec ) {
    if ( typeof sec !== 'number' ) {
        throw new Error( 'Invalid type for sec: ' + typeof sec );
    }
    //normalize sec to be between 0 to MAX_SEC
    if ( sec < 0 ) {
        sec = 0;
    } else if ( sec > this.MAX_SEC ) {
        sec = this.MAX_SEC;
    }
    if ( sec !== this.value ) {
        this.value = sec;
        this.trigger( 'set', sec );
    }
};

timer.get = function () {
    return this.value;
};

timer.getM = function () {
    return Math.floor( this.get() / 60 );
};

timer.getS = function () {
    return this.get() % 60;
};

timer.getSS = function () {
    var s = this.getS();
    return s < 10 ? '0' + s.toString() : s.toString();
};

/** sets the timer to 0 and stops it */
timer.reset = function () {
    this.set( 0 );
    this.stop();
    this.trigger( 'reset' );
};

/** Stops the interval function call */
timer.stop = function () {
    if ( this.isRunning() ) {
        clearInterval( this.intervalId );
        delete this.intervalId;
        //the stop event fires only when the timer is stopped from running state
        this.trigger( 'stop' );
    }
};

/** starts the interval function call. optionally sets the timer too */
timer.start = function ( sec ) {
    if ( typeof sec !== 'undefined' ) {
        this.set( sec );
    }
    if ( !this.isRunning() && this.get() > 0 ) {
        this.intervalId = setInterval( timer._intervalFunction, 1000 );
        this.trigger( 'start' );
    }
};

/** is the timer started and counting? */
timer.isRunning = function () {
    return !!this.intervalId;
};

/** the interval function that'll be called every second while the timer is running */
timer._intervalFunction = $.proxy(function () {
    this.trigger( 'tick', this.get() );
    this.set( this.get() - 1 );
    if ( this.get() === 0 ) {
        //jump to the beginning of the _audio file
        this._audio.currentTime = 0;
        this._audio.play();

        this.trigger( 'timeup' );
        this.stop();
    }
}, timer );

/** is the alarm sound playing? */
timer.isAlarming = function () {
    return !this._audio.paused;
};

/** turns off the alarm audio */
timer.silent = function () {
    if ( this.isAlarming() ) {
        this._audio.pause();
        this.trigger( 'silent' );
    }
};

timer.reset();