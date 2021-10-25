var express = require("express");
var app = express();
var http = require('http');
var server = http.createServer(app);
var bodyParser = require('body-parser')
var path = require('path')
var io = require('socket.io')(server);
const configuration = require('./config');
const http_modules = require('./js/pg');
const message = require('./js/messages');
const email = require('./js/mail');
const restapi = require('./js/restapi');
const integrationServer = require('./js/integrationserver');
const csv = require('./js/csv');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "www")));
app.all('*', function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

// ---- START UP SERVER -----
var port = configuration.serverPort;

server.listen(port || 3000, () => {
	console.log(`listening on *: ${port}`);
});

// 
// HOMEPAGE
app.get('/', function (req, res) {
	res.sendFile('index.html');
});

app.post('/securos', function (req, res) {
	res.sendFile('index.html');
});

//Register Events
app.post('/events', function (req, res) {
	//send to html
	console.log("Event Received.")
	console.log(req.body)
	try {
		if (req.body[0]) {
			console.log(req.body[0])
			var type = req.body[0].type;
			classification(req.body[0], function (res) {
				console.log("Classification Result",res)
				req.body[0].object_id = req.body[0].id;
				req.body[0].state = 'Nuevo';
				req.body[0].params = JSON.stringify(req.body[0].params);
				delete req.body[0].id;
			
				getObject(req.body[0], function (res){
					if(res){
						console.log("GetObject Result:",res)
						console.log("NAME",res.name)
						req.body[0].name  = res.name;
						console.log("body",req.body[0])
						message.insert("events", req.body[0], function () {
							//actualizo HTML5
							message.select('events', 1000, function (res) {
								//envio a html las filas
								io.emit('newEvent', res);
							});
						});
					}
				});
		});
	 }
	}
	catch (e) {
		console.log(e)
	}


	res.send('ok')
});


//socket io connection
io.on('connection', function (socket) {
	getCameras(function (res) {
		console.log('Sending cameras to HTML5 ')
		socket.emit('getCameras', res);
		message.select('events', 1000, function (res) {
			//Send Events to html
			console.log('Emitting to HTML5 ')
			socket.emit('newEvent', res);
		})
	})

	message.select('directory', 1000, function (res) {
		//Send Directory to html
		console.log('Emitting to HTML5 ')
		socket.emit('directory', res);
	})



	console.log('a user connected');
	socket.on('disconnect', () => {
		console.log('user disconnected');
	});

	//Change State
	socket.on('state', (json) => {
		message.update(json.id, 'events', json, function () {
			message.select('events', 100, function (res) {
				//Send Events to html 
				console.log(json)
				console.log('Emitting to HTML5 ')
				io.emit('newEvent', res);
			})
		});
	});

	//Reports
	socket.on('query', (json) => {
		query(json, function (res) {
			console.log('callback query')
			socket.emit('queryResult', res)
		})
	});


	//Add new user
	socket.on('newuser', (json) => {
		message.insert('directory', json, function () {
			message.select('directory', 100, function (res) {
				//Send Directory
				console.log('Emitting to HTML5 ')
				socket.emit('directory', res);
			})
		});
	});

	//Delete user
	socket.on('deleteUser', (json) => {
		message._delete('directory', json, function () {
			message.select('directory', 100, function (res) {
				//Send Directory
				console.log('Emitting to HTML5 ')
				io.emit('directory', res);
			})
		});
	});

	//Get Directory  
	socket.on('getDirectory', () => {
		console.log('getDirectory ')
		message.select('directory', 100, function (res) {
			//envio a html las filas
			console.log('Emitting to HTML5 ')
			socket.emit('directory', res);
		})
	});

	//Transfer 
	socket.on('transfer', (json) => {
		message.search('events', json.id, function (res) {
			if (res.length > 0) {
				console.log('Transfering...')
				res[0].email = json.email;
				res[0].duration = json.time;
				console.log(res);
				email.mail(res[0]);
			}
		})
	});
	//Export 
	socket.on('export', (json) => {
		message.search('events', json.id, function (res) {
			if (res.length > 0) {
				console.log('Transfering...')
				res[0].email = json.email;
				res[0].duration = json.time;
				console.log(res);
				email.just_export(res[0]);
			}
		})
	});
});

var intServer = new integrationServer.integrationServer("127.0.0.1", 3015)

function getObject(body, callback) {
	console.log('INFO', body )
	
	console.log('INFO', 'Getting object...')
	intServer.getObject(body, function (res) {
		console.log(res)
		callback(res)
	})
}

function getCameras(callback) {
	console.log('INFO', 'Getting cameras...')
	console.log(configuration.ip, configuration.restapi_port, configuration.restapi_user, configuration.restapi_pass)
	var rest = new restapi.restapi(configuration.ip, configuration.restapi_port, configuration.restapi_user, configuration.restapi_pass);
	rest.getRequest('api/v1/cameras', function (res) {
		//console.log(res)
		callback(res)
	})
}

function query(data, callback) {
	//busqueda de resultados para reporte consolidado
	console.log("--------QUERYS----------")
	var query = null;
	//SOLO FECHA
	if (data.incident == "All" && data.cameras.length == 0 && data.state == "All") {
		query = "SELECT   * from \"events\"  where time between '" + new Date(data.dates.initial).toLocaleString() + "' AND '" + new Date(data.dates.final).toLocaleString() + "' order by time desc "
	}
	if (data.incident != "All" && data.cameras.length == 0 && data.state == "All") {

		query = "SELECT   * from \"events\"  where action = '" + data.incident + "' and time between '" + new Date(data.dates.initial).toLocaleString() + "' AND '" + new Date(data.dates.final).toLocaleString() + "' order by time desc"
	}

	if (data.incident == "All" && data.cameras.length != 0 && data.state == "All") {
		query = "SELECT   * from \"events\"  where time between '" + new Date(data.dates.initial).toLocaleString() + "' AND '" + new Date(data.dates.final).toLocaleString() + "' AND (";

		for (var i = 0; i < data.cameras.length; i++) {
			query += " camera_id = '" + data.cameras[i] + "'";
			if (i + 1 != data.cameras.length)
				query += " OR ";
		}

		query += ") order by time desc "
	}
	if (data.incident != "All" && data.cameras.length != 0 && data.state == "All") {
		query = "SELECT   * from \"events\"  where action = '" + data.incident + "' and time between '" + new Date(data.dates.initial).toLocaleString() + "' AND '" + new Date(data.dates.final).toLocaleString() + "' AND (";

		for (var i = 0; i < data.cameras.length; i++) {
			query += " camera_id = '" + data.cameras[i] + "'";
			if (i + 1 != data.cameras.length)
				query += " OR ";
		}

		query += ") order by time desc "
	}

	if (data.incident == "All" && data.cameras.length == 0 && data.state != "All") {

		query = "SELECT   * from \"events\"  where state = '" + data.state + "' and time between '" + new Date(data.dates.initial).toLocaleString() + "' AND '" + new Date(data.dates.final).toLocaleString() + "' order by time desc "
	}
	if (data.incident != "All" && data.cameras.length == 0 && data.state != "All") {

		query = "SELECT   * from \"events\"  where  state = '" + data.state + "' and  action = '" + data.incident + "' and time between '" + new Date(data.dates.initial).toLocaleString() + "' AND '" + new Date(data.dates.final).toLocaleString() + "' order by time desc"
	}

	if (data.database == "All" && data.cameras.length != 0 && data.state != "All") {
		query = "SELECT   * from \"events\"  where  state = '" + data.state + "' and  time between '" + new Date(data.dates.initial).toLocaleString() + "' AND '" + new Date(data.dates.final).toLocaleString() + "' AND (";

		for (var i = 0; i < data.cameras.length; i++) {
			query += " camera_id = '" + data.cameras[i] + "'";
			if (i + 1 != data.cameras.length)
				query += " OR ";
		}

		query += ") order by time desc "
	}
	if (data.incident != "All" && data.cameras.length != 0 && data.state != "All") {
		query = "SELECT   * from \"events\"  where state = '" + data.state + "'and  action = '" + data.incident + "' and time between '" + new Date(data.dates.initial).toLocaleString() + "' AND '" + new Date(data.dates.final).toLocaleString() + "' AND (";

		for (var i = 0; i < data.cameras.length; i++) {
			query += " camera_id = '" + data.cameras[i] + "'";
			if (i + 1 != data.cameras.length)
				query += " OR ";
		}

		query += ") order by time desc "
	}


	if (query != null) {
		var options = { year: 'numeric', month: 'short', day: 'numeric' };
		console.log(new Date(data.dates.initial));
		console.log(new Date(data.dates.initial).toLocaleString('co', options));
		console.log(new Date(data.dates.initial).toLocaleString());
		//console.log(query);

		message.query(query, function (res) {
			if (res != null) {

				console.log("fechas:" + JSON.stringify(data.dates));
				console.log(res.length, ' resultados encontrados');
				csv.genCSV(res);
				callback(res);

				/*
				pdf.genPDF(res.rows,data.dates);
				csv.genCSV(res.rows);*/


			}
			else
				callback(null);
		});
	} else
		callback(null);


}



function classification(e, callback) {
	try {
		console.log(e.action)
		//cameras
		if (e.type == "CAM") {
			if (e.action) {
				switch (e.action) {

					case 'MD_START':
						e.incident = 'Motion detection start'
						break;
					case 'MD_STOP':
						e.incident = 'Motion detection stop'
						break;
					case 'ARMED':
						e.incident = 'Camera armed'
						break;
					case 'DISARMED':
						e.incident = 'Camera disarmed'
						break;
					case 'ATTACH':
						e.incident = 'Camera connected'
						break;
					case 'DETACH':
						e.incident = 'Camera disconnected'
						break;
					case 'REC':
						e.incident = 'Camera recording'
						break;
					case 'REC_ERROR':
						e.incident = 'Camera recording error'
						break;
					case 'REC_STOP':
						e.incident = 'Camera recording stop'
						break;
					case 'VCA_EVENT':
						console.log('Video analytic event--------', e.params.description)
						e.incident = e.params.description

						break;
					default:
						e.incident = 'Camera event'
						break;
				}
			}
		}
		//SENSORS
		else{
			e.incident = e.params.comment
		}
		

		callback(e);

	}
	catch (e) {	}
}


