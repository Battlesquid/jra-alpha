document.oncontextmenu = function() {
	return false;
}

var p, cam, c, t, time, bullets, m;
var nG, nT, n, score = 0,
	w;
var font;
var inverseSwitch, keyBinds;
var data = [],
	bullet;
var len, startTime;
var miniX, miniY;
var MAP_W, MAP_H;

var timer;
var id, rotate;
var MAP, OBJ_X, OBJ_Y, OBJ_W, OBJ_H;

var MINI_X = [],
	MINI_Y = [],
	MINI_W = [],
	MINI_H = [];

var socket, io;
var players = [];
var player;
var users = [],
	id;
var toggleMouseStatus;
var equippedItem = 1;
var name;

function preload() {
	font = loadFont("assets/Roboto-Black.ttf");
}

function setup() {
	createCanvas(window.innerWidth, window.innerHeight);

	MAP_W = 4800;
	MAP_H = 4800;
	(p = createSprite(MAP_W / 2, MAP_H / 2, 50, 50)).setCollider('circle', 0, 0, 25);
	p.friction = 0.05;
	p.maxSpeed = 10;
	p.shapeColor = color(80, 142, 244);

	p.depth = 1;

	p.debug = true;
	bullets = new Group();
	MAP = new Group();
	nG = new Group();
	nT = new Nugget(23, 23);
	nT.create();

	textFont(font);
	textAlign(CENTER);
	textSize(30);

	inverseSwitch = 0;
	toggleMouseStatus = 0;
	// keyBinds = ['UP_ARROW', 'DOWN_ARROW', 'LEFT_ARROW', 'RIGHT_ARROW', 'DOWN_ARROW', 'UP_ARROW', 'RIGHT_ARROW', 'LEFT_ARROW'];
	keyBinds = ['w', 's', 'a', 'd', 's', 'w', 'd', 'a'];
	player = {
		health: 100,
		shield: 5,
	};


	initMap();
	loadImg();
	cursor('assets/m.png', camera.mouseX + 16, camera.mouseY + 16);

	socket = io.connect('https://jra-alpha.herokuapp.com/');
	name = generateName();
	data = {
		x: p.position.x,
		y: p.position.y,
		cx: camera.mouseX,
		cy: camera.mouseY,
		id: socket.id,
		name: name
	};
	socket.on('connect', () => {
		console.log("ID:" + socket.id);
		socket.emit('start', data);
	});

	socket.on('built', function(data) {
		var rx = ceil(map(data.cx, 0, 1200, 0, 12));
		var ry = ceil(map(data.cy, 0, 600, 0, 6));

		var w = createSprite(100 * rx - 50, 100 * ry - 50, 100, 100);
		w.immovable = true;
		w.setDefaultCollider();
		w.shapeColor = color(77);
		w.debug = true;
		MAP.add(w);
	});
	socket.on('pos-from-server', function(data) {

		// console.log('Updated Data;' + 'X:' + data[i].x + ', Y:' + data[i].y + ". From socket.id " + data[i].id);
		users = data;

	});

	socket.on('connected', function(data) {
		console.log(data.msg);
	});
	socket.on('disconnection', function(data) {
		console.log(data);
	});
	setInterval(function() {
		startTime = Date.now();
		socket.emit('ping');
	}, 500);

	socket.on('pong', function() {
		var latency = Date.now() - startTime;
		console.log(latency);
	});
}


function draw() {
	background(47, 109, 49);
	push();
	noStroke();
	fill(73, 155, 77);
	rect(0, 0, MAP_W, MAP_H);
	pop();

	drawMapComponents();
	if (keyDown(keyBinds[(inverseSwitch * 4)]))
		p.velocity.y -= 2 * (p.position.y > 0 ? 1 : 0);
	if (keyDown(keyBinds[(inverseSwitch * 4) + 1]))
		p.velocity.y += 2 * (p.position.y < MAP_W ? 1 : 0);
	if (keyDown(keyBinds[(inverseSwitch * 4) + 2]))
		p.velocity.x -= 2 * (p.position.x > 0 ? 1 : 0);
	if (keyDown(keyBinds[(inverseSwitch * 4) + 3]))
		p.velocity.x += 2 * (p.position.x < MAP_W ? 1 : 0);

	p.overlap(n, hit);
	p.collide(MAP);
	p.rotation = degrees(atan2(camera.mouseY - p.position.y, camera.mouseX - p.position.x));

	camera.position.x = p.position.x + p.velocity.x;
	camera.position.y = p.position.y + p.velocity.y;

	if (keyDown('SHIFT')) {
		camera.zoom = 0.10;
	}
	else {
		camera.zoom = 1;
	}
	if (keyWentDown('i')) {
		inverseSwitch = !inverseSwitch;
	}

	if (mouseWentDown(LEFT)) {
		if (equippedItem == 0) {
			bullet = createSprite(p.position.x, p.position.y, 50, 10);
			bullet.depth = -1;
			bullet.shapeColor = color(220);
			bullet.addSpeed(10 + p.getSpeed(), p.rotation);
			bullet.rotation = p.rotation;
			bullets.add(bullet);
			bullet.life = 90;

			var speed = p.getSpeed();
			data = {
				x: p.position.x,
				y: p.position.y,
				speed: speed,
				rotation: p.rotation
			}
			socket.emit('shoot', data);
		}
		else {
			if (equippedItem == 1) {
				OBJ_X.push(camera.mouseX);
				OBJ_Y.push(camera.mouseY);
				OBJ_W.push(100);
				OBJ_H.push(100);

				len = OBJ_X.length;
				var mx = ceil(map(camera.mouseX, 0, 1200, 0, 12));
				var my = ceil(map(camera.mouseY, 0, 600, 0, 6));
				w = createSprite(100 * mx - 50, 100 * my - 50, 100, 100);
				w.immovable = true;
				w.setDefaultCollider();
				w.shapeColor = color(77);
				w.debug = true;
				MAP.add(w);


				data = {
					x: mx,
					y: my,
					cx: camera.mouseX,
					cy: camera.mouseY
				}
				socket.emit('build', data);
			}
		}
	}
	socket.on('shot', function(data) {
		bullet = createSprite(data.x, data.y, 50, 10);
		bullet.depth = -1;
		bullet.shapeColor = color(220);
		bullet.addSpeed(10 + data.speed, data.rotation);
		bullet.rotation = data.rotation;
		bullets.add(bullet);
		bullet.life = 90;
	})
	var px = floor(map(camera.mouseX + p.position.x, 0, MAP_W, 0, 96));

	if (mouseWentDown(RIGHT)) {
		toggleMouseStatus = !toggleMouseStatus;
	}
	push();
	strokeWeight(5);
	line(p.position.x, p.position.y, n.position.x, n.position.y);
	pop();

	drawSprites();
	if (equippedItem == 1) {
		push();
		noStroke();
		rectMode(CENTER);
		fill(255, 255, 255, 100);

		var mx = ceil(map(camera.mouseX, 0, 1200, 0, 12));
		var my = ceil(map(camera.mouseY, 0, 600, 0, 6));
		rect(mx * 100 - 50, my * 100 - 50, 100, 100);
		pop();
	}
	push();
	rectMode(CENTER);
	textAlign(CENTER);
	noStroke();
	textSize(12);
	for (var i = 0; i < users.length; i++) {
		fill(255);
		rect(users[i].x, users[i].y, 50, 50);
		fill(0);
		text(users[i].name, users[i].x, users[i].y - 45)
	}
	pop();
	HUD();

	data = {
		x: p.position.x,
		y: p.position.y,
		cx: camera.mouseX,
		cy: camera.mouseY,
		id: socket.id,
		name: name
	};
	socket.emit('update', data);
}


function drawMapComponents() {
	stroke(40, 91, 41);
	for (var i = 0, j = 0; i < 12 && j < 12; j++, i = (j == 10) ? i + 1 : i, j = (j == 12) ? j = 0 : j) {
		line(0, j * 400, MAP_W, j * 400);
		line(i * 400, 0, i * 400, MAP_H);
	}
}

function changeBG() {
	var val = random(255);
	background(val);
}

function hit() {
	n.position.x = random(MAP_W);
	n.position.y = random(MAP_W);
	score++;

	player.shield += 5 * (player.shield < 100 ? 1 : 0);
}

function minimap() {
	push();
	rectMode(CENTER);
	noStroke();
	fill(255, 255, 255, 100);
	rect(width - 100, 100, 200, 200);
	fill(44);
	miniX = map(p.position.x, 0, MAP_W, 1000, 1200);
	miniY = map(p.position.y, 0, MAP_W, 0, 200);
	rect(miniX, miniY, 0.96, 0.96);

	for (var i = 0; i < MAP.length; i++) {
		rect((width - 200) + MINI_X[i], MINI_Y[i], MINI_W[i], MINI_H[i]);
	}
	pop();
}

class Nugget {
	constructor(w, h) {
		this.w = w;
		this.h = h;

		this.create = function() {
			n = createSprite(random(MAP_W), random(MAP_H), w, w);
			n.shapeColor = color(255, 157, 0);
		};
	}
}

function HUD() {
	hwidth = map(player.health, 0, 100, 0, 200);
	dwidth = map(player.shield, 0, 100, 0, 200);
	camera.off();
	strokeCap(SQUARE);

	// push();
	// strokeWeight(5);
	// stroke(224, 47, 47);
	// line(2, 600, 2, 580);
	// stroke(61, 46, 221);
	// line(2, 580, 2, 560);
	// pop();

	push();
	strokeJoin(ROUND);
	strokeWeight(10);
	stroke(25, 234, 25);
	fill(25, 234, 25);
	rect(35, 530, hwidth, 35);
	stroke(36, 116, 244);
	fill(36, 116, 244);
	rect(35, 470, dwidth, 35);

	fill(255);

	push();
	noStroke();
	textAlign(LEFT, CENTER);
	textSize(18);
	text("SHIELD", 35, 490);
	text("HEALTH", 35, 550);

	pop();
	noStroke();
	text(score, 850, 550);
	pop();


	// push();
	// strokeWeight(2);
	// strokeJoin(ROUND);
	// noFill();
	// stroke(25, 234, 25);
	// rect(30, 520, 210, 50);

	// stroke(36, 116, 244);
	// rect(30, 460, 210, 50);
	// pop();

	minimap();
	camera.on();

	socket.on('useron', function(data) {
		console.log(data.msg);
	})

}

function drawmap() {
	for (var i = 0; i < OBJ_X.length; i++) {
		w = createSprite(OBJ_X[i] + OBJ_W[i] / 2, OBJ_Y[i] + OBJ_H[i] / 2, OBJ_W[i], OBJ_H[i]);
		w.immovable = true;
		w.setDefaultCollider();
		w.shapeColor = color(77);
		w.debug = true;
		MAP.add(w);
	}
}

function updateMap() {
	var i = MAP.length;
	MINI_X.push(map(OBJ_X[i] + OBJ_W[i] / 2, 0, MAP_W, 0, 200));
	MINI_Y.push(map(OBJ_Y[i] + OBJ_H[i] / 2, 0, MAP_H, 0, 200));
	MINI_W.push(OBJ_W[i] / 48);
	MINI_H.push(OBJ_H[i] / 48);
}
EasingFunctions = {
	// no easing, no acceleration
	linear: function(t) { return t },
	// accelerating from zero velocity
	easeInQuad: function(t) { return t * t },
	// decelerating to zero velocity
	easeOutQuad: function(t) { return t * (2 - t) },
	// acceleration until halfway, then deceleration
	easeInOutQuad: function(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t },
	// accelerating from zero velocity
	easeInCubic: function(t) { return t * t * t },
	// decelerating to zero velocity
	easeOutCubic: function(t) { return (--t) * t * t + 1 },
	// acceleration until halfway, then deceleration
	easeInOutCubic: function(t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1 },
	// accelerating from zero velocity
	easeInQuart: function(t) { return t * t * t * t },
	// decelerating to zero velocity
	easeOutQuart: function(t) { return 1 - (--t) * t * t * t },
	// acceleration until halfway, then deceleration
	easeInOutQuart: function(t) { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t },
	// accelerating from zero velocity
	easeInQuint: function(t) { return t * t * t * t * t },
	// decelerating to zero velocity
	easeOutQuint: function(t) { return 1 + (--t) * t * t * t * t },
	// acceleration until halfway, then deceleration
	easeInOutQuint: function(t) { return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t }
}

function loadImg() {
	m = loadImage('assets/m.png');
}

function mouseWheel(event) {
	equippedItem += (event.delta / abs(event.delta)) / 2;
	equippedItem *= (equippedItem > 0 ? 1 : 0);
	equippedItem *= (equippedItem < 2 ? 1 : 0);
	equippedItem = floor(equippedItem, 0, 2);
	console.log("Item:" + equippedItem);
}

function initMap() {
	OBJ_X = [0, 800, 1600];
	OBJ_Y = [0, 800, 0];
	OBJ_W = [800, 200, 100];
	OBJ_H = [800, 200, 100];

	MINI_X = [];
	MINI_Y = [];
	MINI_W = [];
	MINI_H = [];

	drawmap();
	for (var i = 0; i < MAP.length; i++) {
		MINI_X.push(map(OBJ_X[i] + OBJ_W[i] / 2, 0, MAP_W, 0, 200));
		MINI_Y.push(map(OBJ_Y[i] + OBJ_H[i] / 2, 0, MAP_H, 0, 200));
		MINI_W.push(OBJ_W[i] / 48);
		MINI_H.push(OBJ_H[i] / 48);
	}
}
