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
const restapi = require("./js/restapi");
const integrationServer = require("./js/integrationserver");
const logs = require("./js/logs/logs");
const classificationJSON = require('./translations.json');
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
    try {
        if (req.body[0]) {
            logs.Write(`Event Received : ${JSON.stringify(req.body[0])}`, "DEBUG", log_base_path);

            const type = req.body[0].type;
            const action = req.body[0].action;
            const incident = classifyEvent(req.body[0]) || req.body[0].action;

            // console.log("Classification Result", incident);
            // logs.Write(`Classification Result : ${incident}`, "DEBUG", log_base_path);

            req.body[0].object_id = req.body[0].id;
            req.body[0].state = "Novo";
            req.body[0].params = JSON.stringify(req.body[0].params);
            req.body[0].incident = incident || action;
            delete req.body[0].id;

            getObject(req.body[0], function (res) {
                if (res) {
                    logs.Write("Object found in SecurOS DB ", "DEBUG", log_base_path);
                    logs.Write("GetObject Result: " + JSON.stringify(res), "DEBUG", log_base_path);
                    logs.Write("NAME: " + JSON.stringify(res.name), "DEBUG", log_base_path);
                    req.body[0].name = res.name;
                    req.body[0].priority = res.params != undefined ? res.params.tp_name : "Baixa";

                    logs.Write("body: " + JSON.stringify(req.body[0]), "DEBUG", log_base_path);

                    // Insert event into the database
                    message.insert("events", req.body[0], function () {
                        // Fetch latest events
                        message.select("events", 10, function (res) {
                            // Emit new event to HTML
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

function classifyEvent(e) {
    const type = e.type || "default";
    const action = e.action || "default";

    if (classificationJSON[type] && classificationJSON[type][action]) {
        return classificationJSON[type][action];
    } else if (classificationJSON[type] && classificationJSON[type]["default"]) {
        return classificationJSON[type]["default"];
    } else {
        return classificationJSON["default"]["comment"];
    }
}