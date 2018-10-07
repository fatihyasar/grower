var express     = require('express');
var app         = require('express')();
var server      = require('http').createServer(app);
var io          = require('socket.io')(server);
var ejs         = require('ejs');
var mqtt        = require('mqtt');
var client      = mqtt.connect('mqtt://m2m.eclipse.org');

app.use('/assets', express.static(__dirname + '/assets'));
app.set('view engine', 'ejs');
app.get('/', function(req, res) {
    res.render('index');
});


//mqtt 
client.on('connect', function () {
    console.log('Connected MQTT server');

    client.subscribe('/sensors/temperature');
    client.subscribe('/actuators/motors/+/state');
    client.subscribe('/actuators/motors/+/speed');
    client.subscribe('/actuators/motors/+/direction');
});

client.on('message', function (topic, message) {
    // message is Buffer
    console.log("topic : " + topic);
    console.log("message : " + message.toString());

    var params = topic.split('/');    
    var data = {
        motorNumber : params[3],
        message : message.toString()
    }
    io.sockets.emit('motorStateChanged', data);
});


//Socket.io 
io.on('connection', function(socket) {
    console.log('a device connected');
    socket.on('motorSpeedChanged', function(msg){
        console.log('message: ' + JSON.stringify(msg));

        var topic = "/actuators/motors/" + msg.motorNumber + "/start/" + msg.speed;
        client.publish(topic)
    });

    socket.on('stopMotor', function(msg){
        console.log('message: ' + JSON.stringify(msg));

        var topic = "/actuators/motors/" + msg.motorNumber + "/stop";
        client.publish(topic)
    });
    
});

/*
setInterval(function() {
    var obj = {
        temp : Math.floor(Math.random() * Math.floor(80)),
        humidity : Math.floor(Math.random() * Math.floor(100))
    };

    io.sockets.emit('humudityChanged', obj);
}, 1000);
*/

server.listen(process.env.PORT || 8079, function(){
    console.log('app running');
});