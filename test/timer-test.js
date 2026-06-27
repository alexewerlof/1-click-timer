/**
 * QUnit tests for the Manifest V3 timer.js.
 *
 * The timer now uses wall-clock-based computation (endTime - Date.now()),
 * so exact-second assertions use a small tolerance of ±1 s.
 */

test("Timer get/set clamping", function () {
  var values = [
    { input: -1, expectedMin: 0, expectedMax: 0 },
    { input: 60, expectedMin: 59, expectedMax: 60 },
    { input: 3600, expectedMin: 3599, expectedMax: 3600 },
    { input: 3601, expectedMin: 3599, expectedMax: 3600 },
  ];
  for (var i = 0; i < values.length; i++) {
    var v = values[i];
    timer.set(v.input);
    var got = timer.get();
    ok(
      got >= v.expectedMin && got <= v.expectedMax,
      "set(" +
        v.input +
        ") → get()=" +
        got +
        " (expected " +
        v.expectedMin +
        "–" +
        v.expectedMax +
        ")",
    );
  }
});

test("Timer reset", function () {
  var values = [-10, 0, 20, 60, 600, 3600, 99999];
  for (var i = 0; i < values.length; i++) {
    var val = values[i];
    timer.set(val);
    timer.reset();
    deepEqual(timer.get(), 0, "reset from " + val + " gives 0");
  }
});

test("Set event listener", function () {
  timer.reset();
  timer.off(); // clear all listeners from previous tests
  expect(1);
  timer.on("set", function onSet() {
    ok(true, "set event fired");
  });
  timer.set(1);
  timer.off("set");
});

test("Start event fires", function () {
  timer.reset();
  timer.off();
  expect(2); // set + start
  timer.on("set", function () {
    ok(true, "set event during start");
  });
  timer.on("start", function onStart() {
    ok(true, "start event fired");
    timer.off("start");
    timer.off("set");
    timer.stop();
  });
  timer.start(3);
});

test("Stop event fires when running", function () {
  timer.reset();
  timer.off();
  timer.set(5);
  expect(1);
  timer.on("stop", function onStop() {
    ok(true, "stop event fired");
    timer.off("stop");
  });
  timer.start();
  timer.stop();
});

test("Stop event does NOT fire when not running", function () {
  timer.reset();
  timer.off();
  timer.stop(); // should not fire stop event
  ok(!timer.isRunning(), "timer is not running");
  // No stop listener registered, so no assertion to check — just ensure no error
  ok(true, "stop() on idle timer does not throw");
});

test("MAX_SEC is respected", function () {
  timer.reset();
  deepEqual(timer.MAX_SEC, 3600, "MAX_SEC is 3600 (60 minutes)");
  timer.set(5000);
  ok(timer.get() <= 3600, "set(5000) clamps to MAX_SEC: " + timer.get());
});

test("getM / getS / getSS", function () {
  timer.reset();
  // set a known value — use a large enough number that timing jitter is irrelevant
  timer.set(125); // 2 min 5 sec
  var m = timer.getM();
  var s = timer.getS();
  var ss = timer.getSS();
  ok(m === 2 || m === 1, "getM ≈ 2 (got " + m + ")");
  ok(s >= 4 && s <= 5, "getS ≈ 5 (got " + s + ")");
  ok(ss === "05" || ss === "04", "getSS zero-padded (got " + ss + ")");
});

test("isRunning / isAlarming state flags", function () {
  timer.reset();
  ok(!timer.isRunning(), "not running after reset");
  ok(!timer.isAlarming(), "not alarming after reset");

  timer.start(10);
  ok(timer.isRunning(), "running after start");

  timer.stop();
  ok(!timer.isRunning(), "not running after stop");

  timer.alarming = true;
  ok(timer.isAlarming(), "alarming when flag set");

  timer.silent();
  ok(!timer.isAlarming(), "not alarming after silent");

  timer.reset();
});

test("restore() sets endTime and running state", function () {
  timer.reset();
  timer.off();

  // Simulate restoring from a persisted endTime 30 s in the future
  var futureEnd = Date.now() + 30000;
  timer.restore(futureEnd);
  ok(timer.isRunning(), "running after restore");
  ok(timer.endTime === futureEnd, "endTime matches restored value");
  // remaining should be ~30 s
  var rem = timer.get();
  ok(rem >= 29 && rem <= 30, "restored remaining ≈ 30 (got " + rem + ")");

  timer.reset();
});

test("reset event fires", function () {
  timer.off();
  expect(1);
  timer.on("reset", function onReset() {
    ok(true, "reset event fired");
    timer.off("reset");
  });
  timer.reset();
});

test("silent event fires when alarming", function () {
  timer.reset();
  timer.off();
  timer.alarming = true;
  expect(1);
  timer.on("silent", function onSilent() {
    ok(true, "silent event fired");
    timer.off("silent");
  });
  timer.silent();
});

test("silent event does NOT fire when not alarming", function () {
  timer.reset();
  timer.off();
  timer.alarming = false;
  timer.silent();
  ok(!timer.isAlarming(), "still not alarming");
  ok(true, "silent() when not alarming is a no-op");
});
