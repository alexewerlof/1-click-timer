function setBadge ( text ) {
    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    chrome.browserAction.setBadgeText({
        text: text
    });
}

function setColor ( r, g, b ) {
    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    chrome.browserAction.setBadgeBackgroundColor({
        color : [ r, g, b, 255 ]
    });
}

function setTitle ( title ) {
    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    chrome.browserAction.setTitle({
        title: title
    });
}

function setIcon ( name ) {
    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    chrome.browserAction.setIcon({
        path : 'images/' + name + '.png'
    });
}

function bellAnimationInterval () {
    bellAnimationInterval.inverse = !bellAnimationInterval.inverse;
    setIcon( bellAnimationInterval.inverse ? 'logo19_bell_inverse' : 'logo19_bell' );
}

//** takes care of the number shown in the badge, its background and the tooltip
timer.on( 'set', function () {
    //take care of the badge
    if ( timer.getM() > 0 ) {
        //more than a minute? show minutes
        //set a background between yellow to green depending on the minute
        setBadge( timer.getM() + 'm' );
        setColor( Math.floor( ( 60 - timer.getM() ) * 255 / 60 ), 128, 0 );
    } else {
        //less than a minute? show the seconds. toggle it every second to get user's attention.
        if ( timer.getS() ) {
            setBadge( timer.getS().toString() );
            setColor( 255, 0, 0 );
            setIcon( timer.getS() % 2 ? 'logo19_inverse' : 'logo19' );
        } else {
            setBadge( '' );
            setIcon( 'logo19' );
        }
    }
    setTitle( timer.getM() + ':' + timer.getSS() );
});

timer.on( 'timeup', function () {
    //hide the badge
    setBadge( '' );
    setIcon( 'logo19_bell' );
    bellAnimationInterval.handle = setInterval( bellAnimationInterval, 100 );
});

timer.on( 'silent', function () {
    //hide badge and set the tooltip to sofware name
    setBadge( '' );
    clearInterval( bellAnimationInterval.handle );
    setIcon( 'logo19' );
    setTitle( '1-click timer' );
});