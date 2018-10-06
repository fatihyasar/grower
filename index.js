var express     = require('express');
var app         = require('express')();
var server      = require('http').createServer(app);
var io          = require('socket.io')(server);
var ejs         = require('ejs');
var mqtt        = require('mqtt');
var client      = mqtt.connect('mqtt://127.0.0.1');

app.use('/assets', express.static(__dirname + '/assets'));
app.set('view engine', 'ejs');
app.get('/', function(req, res) {
    res.render('index');
});


//mqtt 
client.on('connect', function () {
    console.log('Connected MQTT server');
    client.subscribe('/sensors/temperature', function (err) {
        console.log('Subscribed to temperature channel. Error : ' + err);
        if (!err) {
        //client.publish('presence', 'Hello mqtt')
      }
    });
});

client.on('message', function (topic, message) {
    // message is Buffer
    console.log(message.toString())
    client.end()
});


//Socket.io 
io.on('connection', function(socket) {
    console.log('a device connected');
    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
      });
});

setInterval(function() {
    var obj = {
        temp : Math.floor(Math.random() * Math.floor(80)),
        humidity : Math.floor(Math.random() * Math.floor(100))
    };

    io.sockets.emit('humudityChanged', obj);
}, 1000);

server.listen(process.env.PORT || 8079, function(){
    console.log('app running');
});