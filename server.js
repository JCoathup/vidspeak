var os = require('os');
var socketIO = require('socket.io');
var nodeStatic = require('node-static');
var http = require('http');
var server = require('http').createServer(app);
var numClients = [];
var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(process.env.PORT || 8000);
console.log('server running...');

users = [];
connections = [];

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {
  connections.push(socket);
  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }
  socket.on('message', function(message) {
  log('Client said: ', message);
  // for a real app, would be room-only (not broadcast)
  socket.broadcast.emit('message', message);
});
socket.on('create or join', function(room) {
  log('Received request to create or join room ' + room);

  var clientsInRoom = io.sockets.adapter.rooms[room];
  numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
  log('Room ' + room + ' now has ' + numClients + ' client(s)');

  if (numClients === 0) {
    socket.join(room);
    log('Client ID ' + socket.id + ' created room ' + room);
    socket.emit('created', room, socket.id);
    console.log("NOW IN ROOM>>>", numClients);

  } else if (numClients === 1) {
    log('Client ID ' + socket.id + ' joined room ' + room);
    io.sockets.in(room).emit('join', room);
    socket.join(room);
    socket.emit('joined', room, socket.id);
    io.sockets.in(room).emit('ready');
    console.log("NOW IN ROOM>>>", numClients);
  } else { // max two clients
    socket.emit('full', room);
    console.log("NOW IN ROOM>>>", numClients);
  }
});

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('bye', function(){
    console.log('received bye');
    users.splice(users.indexOf(socket.username), 1);
    socket.emit(users);
    updateUsernames();
    connections.splice(connections.indexOf(socket), 1);
  });
  socket.on('select user', function(data, callee){
    console.log(data);
    console.log(callee);
    for(var i=0; i<connections.length; i++){
      if (connections[i].username == callee){
        connections[i].emit("invite", data);
        socket.join(data);
      }
      if (connections[i].username == data){
        socket.join(data);
      }
    }
  });
  //in call indicator
  socket.on('in call', function(host, guest){
    for(var l=0; l<connections.length; l++){
      if (connections[l].username != host){
        if (connections[l].username != guest){
          connections[l].emit('busy', host, guest);
        }
      }
    }
    console.log("IN ROOM NOW>>>>", numClients);
  });
  //call finished indicator
  socket.on('ended call', function(host, guest){
    for(var l=0; l<connections.length; l++){
      if ((connections[l].username == host) || (connections[l].username == guest)){
        connections[l].emit('remote hangup', host, guest);
      }
      if ((connections[l].username == host) || (connections[l].username == guest)){
          connections[l].leave(host);
      }
      else if ((connections[l].username != host) || (connections[l].username != guest)){
        connections[l].emit('call over', host, guest);
      }
    }
  });
  socket.on('call refused', function (host, guest){
    console.log("call has been rejected", host, guest);
    for(var l=0; l<connections.length; l++){
      if ((connections[l].username == host) || (connections[l].username == guest)) {
        console.log("sending message to>>> ", connections[l].username);
        connections[l].emit('call rejected');
      }
    }
  })
  //on user disconnections
  socket.on ('disconnect', function(data){
    users.splice(users.indexOf(socket.username), 1);
    updateUsernames();
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected: %s sockets connected', connections.length);
  });
  //attempting call
  socket.on('call attempt', function(room, target){
    console.log('username called: ', target);
    console.log(users);
    for (let i = 0; i < connections.length; i++){
      if (target == connections[i].username){
        console.log('found user');
        connections[i].emit('is calling', room);
      }
    }
  })
  //new user
socket.on('new user', function(data, callback){
  console.log("New user connecting...");
  for (var a = 0; a < users.length; a++){
    var duplicate = false;
    if (data == users[a]){
      duplicate = true;
      socket.emit('duplicate username', duplicate);
      return;
    }
  }
  callback(true);
  socket.username = data;
  users.push(socket.username);
  console.log(socket.username + " has just connected");
  console.log('Connected: %s sockets connected', connections.length);
  updateUsernames();
});

function updateUsernames(){
  socket.emit("gone home");
  io.sockets.emit('get users', users);
  console.log("Users in room: ", users);
}

});
