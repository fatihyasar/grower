
var mqtt = require('mqtt');
var i2c = require('i2c-bus')  
var sleep = require('sleep')  
var GrovePi = require('node-grovepi').GrovePi  
var DHTDigitalSensor = GrovePi.sensors.DHTDigital

var DigitalRelay = GrovePi.sensors.DigitalOutput
var DigitalRelayState = GrovePi.sensors.DigitalInput

var Board = GrovePi.board


// Don't forget to update accessToken constant with your device access token
const thingsboardHost = "demo.thingsboard.io";
const accessToken = "<token>";

// Initialization of temperature and humidity data with random values
var data = {
    heatIndex : 0,
    temperature: 0,
    humidity: 0,
    humidityDeviceState : 0 
};


// Initialization of mqtt client using Thingsboard host and device access token
console.log('Connecting to: %s using access token: %s', thingsboardHost, accessToken);
var client  = mqtt.connect('mqtt://'+ thingsboardHost, { username: accessToken });

// Triggers when client is successfully connected to the Thingsboard server
client.on('connect', function () {
    console.log('Client connected!');
    // Uploads firmware version and serial number as device attributes using 'v1/devices/me/attributes' MQTT topic
    client.publish('v1/devices/me/attributes', JSON.stringify({"firmware_version":"1.0.1", "serial_number":"SN-001"}));
    // Schedules telemetry data upload once per second
    console.log('Uploading sensors data');
    /* setInterval(publishTelemetry, 1000); */
});

// Uploads telemetry data using 'v1/devices/me/telemetry' MQTT topic
function publishTelemetry() {
    /*
    data.temperature =  genNextValue(data.temperature, minTemperature, maxTemperature);
    data.humidity = genNextValue(data.humidity, minHumidity, maxHumidity);
    client.publish('v1/devices/me/telemetry', JSON.stringify(data));
    */
}

// Generates new random value that is within 3% range from previous value
function genNextValue(prevValue, min, max) {
/*
    var value = prevValue + ((max - min) * (Math.random() - 0.5)) * 0.03;
    value = Math.max(min, Math.min(max, value));
    return Math.round(value * 10) / 10;
*/
}

var board = new Board({  
    debug: true,
    onError: function(err) {
      console.log('Something wrong just happened')
      console.log(err)
    },
    onInit: function(res) {
      if (res) {
        console.log('GrovePi Version :: ' + board.version())
        var dhtSensor = new DHTDigitalSensor(6, DHTDigitalSensor.VERSION.DHT21, DHTDigitalSensor.CELSIUS)
	var humidityRelay = new DigitalRelay(7);
        var humidityRelayStatus  = new DigitalRelayState(7);

        // DHT Sensor
        console.log('DHT Digital Sensor (start watch)')
        dhtSensor.on('change', function(res) {
            var temp= res[2];
            var humidity = res[1];
            console.log(res);
	    var i2c1 = i2c.openSync(1);
           
	   if(!isNaN(parseFloat(temp)) && !isNaN(parseFloat(humidity))){ 
	    console.log('DHT21 sensor values correct');
            var i2c1 = i2c.openSync(1);

            data.heatIndex = res[0];
            data.temperature = res[2]; /* genNextValue(data.temperature, minTemperature, maxTemperature); */
            data.humidity = res[1];/* genNextValue(data.humidity, minHumidity, maxHumidity); */
            data.humidityDeviceState = parseInt(humidityRelayStatus.read());
 
            client.publish('v1/devices/me/telemetry', JSON.stringify(data));
            console.log('data sent');

            console.log('applying humidity autopilot - device state is : ' + data.humidityDeviceState);
            if(data.humidity < 50) {
                if(data.humidityDeviceState == 1 ){
                  console.log('humidity device is already working, no need to turn it on.');
                }else {
                  console.log('humidity device is turning on..');
                  humidityRelay.turnOn();
                }       
                
            }else if(data.humidity >=60) {
                if(data.humidityDeviceState == 1){
                  humidityRelay.turnOff();
                  console.log('humidity device is working. Turning off..');
                }else {
                  console.log('humidity device is already turned off.');
                  humidityRelay.turnOn();
                }      
            }

            i2c1.closeSync();
	   }else {
		console.log('DHT21 sensor values are incorrect. Skipping parsing data..');
	   }

        })
        dhtSensor.watch(500) // milliseconds

      }
    }
  })

board.init();  


//Catches ctrl+c event
process.on('SIGINT', function () {
    console.log();
    console.log('Disconnecting...');
    client.end();
    console.log('Exited!');
    process.exit(2);
});

//Catches uncaught exceptions
process.on('uncaughtException', function(e) {
    console.log('Uncaught Exception...');
    console.log(e.stack);
    process.exit(99);
});
