var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Kinect = require('kinect2');
var kinect = new Kinect();

var gesture_detector = require('./modules/gesture_detector');
var gesture_event_emitter = require('./modules/gesture_event_emitter');

gesture_detector.init();
gesture_event_emitter.init();

var sockets = [];

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
})

io.on('connection', function (socket) {
  console.log(`socket with id ${socket.id}`);
  sockets.push(socket);
  console.log(`sockets live: ${sockets.length}`);
  socket.on('disconnect', function () {
    console.log(`${socket.id} disconnected`);
    sockets.splice(sockets.findIndex(x => x.id == socket.id), 1);
    console.log(`sockets live: ${sockets.length}`);
  })

  socket.on('emit', function (data) {
    console.log(`data from ${socket.id}`)
    console.log(data);
    io.to(socket.id).emit('message', 'received!');
  })

  socket.on('control', function (data) {
    console.log(`control from ${socket.id}`);
    console.log(data);
    io.emit(data.event, JSON.stringify(data.message));
  })

  socket.on('set-standard-position', function () {
    gesture_detector.set_standard_position();
  })
});

if(kinect.open()) {
  console.log('Kinect is opening....');
  http.listen(3000, function () {
    console.log('listing on port 3000');
  })

  app.get('/skeleton', function(req, res) {
    res.sendFile(__dirname + '/public/skeleton.html');
  });

  kinect.on('bodyFrame', function(bodyFrame){
    io.sockets.emit('bodyFrame', bodyFrame);
    bodyFrame.bodies.forEach(function(body){
      if(body.tracked) {
        var result = gesture_detector.detect(body);
        io.sockets.emit('gesture-detected', result);
        for (var i in result) {
          gesture_event_emitter.emit(io, result[i]);
        }
      }
    });
  });

  kinect.openBodyReader();
}
else {
  console.log('Kinect is not opened yet!')
}


