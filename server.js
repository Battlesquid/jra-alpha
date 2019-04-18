var plist = [];
var user, index;

var express = require('express')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(process.env.PORT || 5000);

app.use(express.static('public'));

io.on('connection', function(socket) {
	io.emit('connected', { msg: "New connection!" });

	socket.on('start', function(data) {
		plist.push(data);
	});

	socket.on('build', function(data) {
		socket.broadcast.emit('built', data);
	});
	socket.on('shoot', function(data) {
		socket.broadcast.emit('shot', data);
	});
	socket.on('update', function(data) {
		for (var i = 0; i < plist.length; i++) {
			if (plist[i].name == data.name) {
				index = i;
			}
		}

		plist[index].x = data.x;
		plist[index].y = data.y;
		plist[index].cx = data.cx;
		plist[index].cy = data.cy;
		plist[index].id = data.id;

		io.emit('pos-from-server', plist);
	});
	socket.on('ping', function() {
		socket.emit('pong');
	});

	socket.on('disconnect', function() {
		for (var i = 0; i < plist.length; i++) {
			if (plist[i].id == socket.id) {
				plist.splice(i, 1);
			}
		}

		io.emit('disconnection', plist);
	});
});
