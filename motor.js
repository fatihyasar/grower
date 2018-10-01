var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function() {
  var a = new five.Motor({
    controller: "GROVE_I2C_MOTOR_DRIVER",
    pin: "A",
  });

  var b = new five.Motor({
    controller: "GROVE_I2C_MOTOR_DRIVER",
    pin: "B",
  });


  this.wait(3000, function() {
    console.log("REVERSE");

    a.rev(127);
    b.rev(127);

    // Demonstrate motor stop in 2 seconds
    this.wait(3000, function() {
      console.log("STOP");
      a.stop();
      b.stop();

      this.wait(1000, function() {
        process.emit("SIGINT");
      });
    }.bind(this));
  }.bind(this));

  console.log("FORWARD");
  a.fwd(127);
  b.fwd(127);
});