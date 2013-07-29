test( 'Timer get/set', function () {
    var values = [
        {
            s : -1,
            g : 0
        },
        {
            s : 60,
            g : 60
        },
        {
            s : 3600,
            g : 3600
        },
        {
            s : 3601,
            g : 3600
        }
    ];
    for ( var i = 0; i < values.length; i++ ) {
        timer.set( values[ i ].s );
        deepEqual( timer.get(), values[ i ].g, 'Set correctly (' + values[i].s + ')' );
    }
});

test( 'Timer reset', function () {
    var values = [ -10, 0, 20, 60, 600, 3600, 99999 ];
    for ( var i = 0; i < values.length; i++ ) {
        val = values[ i ];
        timer.set( val );
        timer.reset();
        deepEqual( timer.get(), 0, 'Reset successfully (from ' + val + ')' );
    }
});

test( 'Set event listener', function () {
    timer.reset();
    timer.on( 'set', function onCount () {
        ok( true, 'Set event listener called' );
    });
    timer.set( 1 );
    timer.off( 'set' );
});

asyncTest( 'Tick event...', function () {
    timer.reset();
    timer.off();
    timer.set( 3 );
    expect( 3 );
    //this event listener will be called 3 times
    timer.on( 'tick', function onCount ( event ) {
        ok( true, 'Set event listener called ' + event.data );
        if ( event.data === 1 ) {
            /*qunit*/start();
            timer.off( 'tick' );
        }
    });
    timer.start();
});

asyncTest( 'Set event...', function () {
    timer.reset();
    timer.off();
    expect( 4 );
    //this event listener will be called 3 times
    timer.on( 'set', function onCount ( event ) {
        ok( true, 'Set event listener called. ' + event.data );
        if ( event.data === 0 ) {
            /*qunit*/start();
            timer.off( 'set' );
        }
    });
    timer.set( 3 );
    timer.start();
});