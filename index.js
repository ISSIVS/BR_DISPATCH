var express = require("express");
var app = express();
var http = require("http");
var server = http.createServer(app);
var bodyParser = require("body-parser");
var path = require("path");
var io = require("socket.io")(server);
const configuration = require("./config");
const http_modules = require("./js/pg");
const message = require("./js/messages");
const email = require("./js/mail");
const restapi = require("./js/restapi");
const integrationServer = require("./js/integrationserver");
const csv = require("./js/csv");
const logs = require("./js/logs/logs");
const log_base_path = "Dispatch";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "www")));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "origin-list");
    res.setHeader("Access-Control-Allow-Origin", "http://192.168.10.33:21093/v1/spotter/person/1");
    res.header(
        "Access-Control-Allow-Headers",
        "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
    next();
});

// ---- START UP SERVER -----
var port = configuration.serverPort;

var intServer = new integrationServer.integrationServer(configuration.ip, configuration.integrationPort);

server.listen(port || 3000, () => {
    console.log(`listening on *: ${port}`);
    logs.Write(`listening on *: ${port}`, "INFO", log_base_path);
});

// HOMEPAGE
app.get("/", function (req, res) {
    res.sendFile("index.html");
});

app.post("/securos", function (req, res) {
    res.sendFile("index.html");
});

//Register Events
app.post("/events", function (req, res) {
    //send to html
    try {
        if (req.body[0]) {
            //console.log(req.body[0]);
            logs.Write(`Event Received : ${req.body[0]}`, "DEBUG", log_base_path);
            var type = req.body[0].type;
            classification(req.body[0], function (res) {
                //console.log("Classification Result", res)
                logs.Write(`Classification Result : ${res}`, "DEBUG", log_base_path);
                req.body[0].object_id = req.body[0].id;
                req.body[0].state = "Novo";
                req.body[0].params = JSON.stringify(req.body[0].params);
                req.body[0].incident = req.body[0].incident || req.body[0].action;
                delete req.body[0].id;

                getObject(req.body[0], function (res) {
                    if (res) {
                        logs.Write("Objet found in SecurOS DB ", "DEBUG", log_base_path);
                        logs.Write("GetObject Result: " + JSON.stringify(res), "DEBUG", log_base_path);
                        logs.Write("NAME: " + JSON.stringify(res.name), "DEBUG", log_base_path);
                        req.body[0].name = res.name;
                        req.body[0].priority = res.params != undefined ? res.params.tp_name : "Baixa";
                        //req.body[0].cam_id = res.params != undefined ?  res.params.camera_id || res.id :"NOCAMID";
                        logs.Write("body: " + JSON.stringify(req.body[0]), "DEBUG", log_base_path);

                        message.insert("events", req.body[0], function () {
                            //actualizo HTML5
                            message.select("events", 10, function (res) {
                                //envio a html las filas
                                io.emit("newEvent", res);
                            });
                        });
                    } else {
                        console.log("Object not found");
                        logs.Write("Object not found", "ERROR", log_base_path + "_Events_not_found");
                        logs.Write(
                            "object_id:" + req.body[0].object_id + ", type:" + req.body[0].type + ", incident:" + req.body[0].incident,
                            "ERROR",
                            log_base_path + "_Events_not_found"
                        );
                    }
                });
            });
        }
    } catch (e) {
        console.log(e);
        logs.Write("ERROR: " + e, "ERROR", log_base_path);
    }

    res.send("ok");
});

//socket io connection
io.on("connection", function (socket) {
    logs.Write(`New Client connection`, "DEBUG", log_base_path);
    getCameras(function (res) {
        logs.Write(`getCameras : ${res}`, "DEBUG", log_base_path);
        socket.emit("getCameras", res);
        message.select("events", 1000, function (res) {
            //Send Events to html
            //logs.Write(`events  1000 : ${res}`, "DEBUG", log_base_path);
            socket.emit("Events", res);
        });
    });

    socket.on("abonado", (id, obj_id) => {
        logs.Write(`on abonado obj_id: ${obj_id} id: ${obj_id}`, "DEBUG", log_base_path);
        message.searchlike_order("comments", "eventid", id, "date", function (response) {
            logs.Write(`comments: ${response}`, "DEBUG", log_base_path);
            socket.emit("comments", response);
        });
        //capturar digitos sin caracter '-'
        var regx = /^((?!-)\d+)$/g;
        var match1 = regx.exec(obj_id);
        if (!match1) {
            var regex = /(\d+)-(\w+)||(\d+)-(\d+)/g;
            var match = regex.exec(obj_id);
        } else match = match1;

        //console.log("match",match)
        if (match) {
            message.searchlike("directory", "panel", match[1], (rows) => {
                socket.emit("abonado", rows);
            });
        }
    });

    socket.on("disconnect", () => {
        logs.Write(`user disconnected`, "DEBUG", log_base_path);
    });

    //Change State
    socket.on("state", (json) => {
        //console.log("state", json);
        logs.Write(`On state: ${json}`, "DEBUG", log_base_path);
        var json_update = Object.assign({}, json);
        delete json_update.obj_id;
        var log = {
            incident_id: parseInt(json.id),
            time: json.resolution_time,
            operator: json.operator,
            event: json.state,
        };
        if (json.comment) {
            var comment_json = {
                panel: json.obj_id,
                comment: json.comment,
                date: json.response_time || json.resolution_time,
                user: json.operator,
                eventid: json.id,
            };
            logs.Write(`On state comment_json: ${comment_json}`, "DEBUG", log_base_path);
            message.insert("comments", comment_json, function (e) {
                message.searchlike_order("comments", "eventid", json.id, "date", function (response) {
                    message.update(json.id, "events", json_update, function () {
                        message.select("events", 1000, function (res) {
                            io.emit("Events", res);
                        });
                    });
                    io.emit("comments", response);
                });
            });
        } else {
            message.update(json.id, "events", json_update, function () {
                message.select("events", 1000, function (res) {
                    io.emit("Events", res);
                });
            });
        }
        message.insert("logs", log, function (e) {
            logs.Write(`message.insert "logs": ${e}`, "DEBUG", log_base_path);
        });
    });
});

function getObject(body, callback) {
    intServer.getObject(body, function (res) {
        logs.Write(`intServer.getObject : ${res}`, "DEBUG", log_base_path);
        callback(res);
    });
}

function getCameras(callback) {
    var rest = new restapi.restapi(configuration.ip, configuration.restapi_port, configuration.restapi_user, configuration.restapi_pass);
    rest.getRequest("api/v1/cameras", function (res) {
        callback(res);
    });
}

function query(data, callback) {
    //busqueda de resultados para reporte consolidado
    console.log("--------QUERYS----------");
    var query = null;
    //SOLO FECHA
    if (data.incident == "All" && data.cameras.length == 0 && data.state == "All") {
        query =
            'SELECT   * from "events"  where time between \'' +
            new Date(data.dates.initial).toLocaleString() +
            "' AND '" +
            new Date(data.dates.final).toLocaleString() +
            "' order by time desc ";
    }
    if (data.incident != "All" && data.cameras.length == 0 && data.state == "All") {
        query =
            'SELECT   * from "events"  where action = \'' +
            data.incident +
            "' and time between '" +
            new Date(data.dates.initial).toLocaleString() +
            "' AND '" +
            new Date(data.dates.final).toLocaleString() +
            "' order by time desc";
    }

    if (data.incident == "All" && data.cameras.length != 0 && data.state == "All") {
        query =
            'SELECT   * from "events"  where time between \'' +
            new Date(data.dates.initial).toLocaleString() +
            "' AND '" +
            new Date(data.dates.final).toLocaleString() +
            "' AND (";

        for (var i = 0; i < data.cameras.length; i++) {
            query += " camera_id = '" + data.cameras[i] + "'";
            if (i + 1 != data.cameras.length) query += " OR ";
        }

        query += ") order by time desc ";
    }
    if (data.incident != "All" && data.cameras.length != 0 && data.state == "All") {
        query =
            'SELECT   * from "events"  where action = \'' +
            data.incident +
            "' and time between '" +
            new Date(data.dates.initial).toLocaleString() +
            "' AND '" +
            new Date(data.dates.final).toLocaleString() +
            "' AND (";

        for (var i = 0; i < data.cameras.length; i++) {
            query += " camera_id = '" + data.cameras[i] + "'";
            if (i + 1 != data.cameras.length) query += " OR ";
        }

        query += ") order by time desc ";
    }

    if (data.incident == "All" && data.cameras.length == 0 && data.state != "All") {
        query =
            'SELECT   * from "events"  where state = \'' +
            data.state +
            "' and time between '" +
            new Date(data.dates.initial).toLocaleString() +
            "' AND '" +
            new Date(data.dates.final).toLocaleString() +
            "' order by time desc ";
    }
    if (data.incident != "All" && data.cameras.length == 0 && data.state != "All") {
        query =
            'SELECT   * from "events"  where  state = \'' +
            data.state +
            "' and  action = '" +
            data.incident +
            "' and time between '" +
            new Date(data.dates.initial).toLocaleString() +
            "' AND '" +
            new Date(data.dates.final).toLocaleString() +
            "' order by time desc";
    }

    if (data.database == "All" && data.cameras.length != 0 && data.state != "All") {
        query =
            'SELECT   * from "events"  where  state = \'' +
            data.state +
            "' and  time between '" +
            new Date(data.dates.initial).toLocaleString() +
            "' AND '" +
            new Date(data.dates.final).toLocaleString() +
            "' AND (";

        for (var i = 0; i < data.cameras.length; i++) {
            query += " camera_id = '" + data.cameras[i] + "'";
            if (i + 1 != data.cameras.length) query += " OR ";
        }

        query += ") order by time desc ";
    }
    if (data.incident != "All" && data.cameras.length != 0 && data.state != "All") {
        query =
            'SELECT   * from "events"  where state = \'' +
            data.state +
            "'and  action = '" +
            data.incident +
            "' and time between '" +
            new Date(data.dates.initial).toLocaleString() +
            "' AND '" +
            new Date(data.dates.final).toLocaleString() +
            "' AND (";

        for (var i = 0; i < data.cameras.length; i++) {
            query += " camera_id = '" + data.cameras[i] + "'";
            if (i + 1 != data.cameras.length) query += " OR ";
        }

        query += ") order by time desc ";
    }

    if (query != null) {
        var options = { year: "numeric", month: "short", day: "numeric" };

        message.query(query, function (res) {
            if (res != null) {
                //console.log("fechas:" + JSON.stringify(data.dates));
                //console.log(res.length, " resultados encontrados");
                callback(res);
            } else callback(null);
        });
    } else callback(null);
}

function classification(e, callback) {
    try {
        console.log(e.action);
        //cameras
        if (e.type == "CAM") {
            if (e.action) {
                switch (e.action) {
                    case "MD_START":
                        e.incident = "Detecção de movimento iniciou";
                        break;
                    case "MD_STOP":
                        e.incident = "Detecção de movimento parou";
                        break;
                    case "ARMED":
                        e.incident = "Câmera armada";
                        break;
                    case "DISARMED":
                        e.incident = "Câmera desarmada";
                        break;
                    case "ATTACH":
                        e.incident = "Câmera conectada";
                        break;
                    case "DETACH":
                        e.incident = "Câmera desconectada";
                        break;
                    case "REC":
                        e.incident = "Câmera gravando";
                        break;
                    case "REC_ERROR":
                        e.incident = "Erro de gravação da câmera";
                        break;
                    case "REC_STOP":
                        e.incident = "Câmera parou gravação";
                        break;
                    case "VCA_EVENT":
                        console.log("Evento de analítico de vídeo--------", e.params.description);
                        e.incident = e.params.description;

                        break;
                    case "PEDRO":
                        console.log("Evento do Pedro");
                        e.incident = e.params.description;
                        break;
                    default:
                        e.incident = "Camera event";
                        break;
                }
            }
        }
        //SENSORS
        else {
            e.incident = e.params.comment;
        }

        callback(e);
    } catch (e) {}
}
