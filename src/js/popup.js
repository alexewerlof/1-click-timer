//noinspection JSUnresolvedVariable,JSUnresolvedFunction
var timer = chrome.extension.getBackgroundPage().timer;

var $resetButton = $( '#reset-button' );
var $face = $( '#face' );
var $needle = $( '#needle' );
var $digits = $( '#digits' );
var $minutesValue = $( '#minutes-value' );
var $ringing = $( '#ringing' );
var $body = $( 'body' );

var _PI = Math.PI;
var _2PI = 2 * _PI;

function getDegreeFromCenter ( x , y, r ) {
    x -= r / 2;
    y = ( r / 2 ) - y;
    return rad2deg( Math.atan2( x, y ) );
}

function rad2deg ( rad ) {
    if ( rad < 0 ) {
        rad += _2PI;
    }
    return rad * 180 / _PI;
}

function min2deg ( min ) {
    return min / 60 * 360;
}

function deg2min ( deg ) {
    return Math.round( deg / 360 * 60 );
}

var timerEventListeners = {
    start : function () {
        $digits.show();
    },
    stop : function () {
        $digits.hide();
    },
    timeup : function () {
        $ringing.show();
    },
    set : function () {
        var deg =  min2deg( timer.get() / 60 );
        $needle.css( '-webkit-transform', 'rotate(' + deg.toFixed( 3 ) + 'deg)' );
        $digits.text( timer.getM() + ':' + timer.getSS() );
    }
};

timer.on( timerEventListeners);

$face.on( 'mousemove', function ( e ) {
    var deg = getDegreeFromCenter( e.clientX, e.clientY, $body.width() );
    $minutesValue.text( deg2min( deg ) );
    //setNeedle( deg );
}).on( 'click', function ( e ) {
    var deg = getDegreeFromCenter( e.clientX, e.clientY, $body.width() );
    var min = deg2min( deg ) * 60;
    timer.set( min );
    if ( min > 0 ) {
        timer.start();
    } else {
        timer.stop();
    }
});

$resetButton.on( 'click', function ( e ) {
    timer.reset();
    e.stopPropagation();
});

$ringing.on( 'click', function () {
    timer.silent();
    $ringing.hide();
});

//in order to prevent timer event handling errors, unregister all events when the popup is being closed
$( window ).on( 'unload', function () {
    timer.off( timerEventListeners );
});

//trigger timer event 'set' manually to set the needle initially
timerEventListeners.set();
$digits.toggle( timer.isRunning() );
$ringing.toggle( timer.isAlarming() );
