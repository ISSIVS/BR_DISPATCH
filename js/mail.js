var nodemailer = require("nodemailer");
var request = require("request");
var fs = require("fs");
const configuration = require("./../config");
var mailfrom = configuration.mailfrom;
var mail_user = configuration.mail_user;
var mail_pass = configuration.mail_pass;
var securos_ip = configuration.ip;
var restapi_port = configuration.restapi_port;

function mail(json) {
    var time = new Date(json.time);
    var to_date = new Date(time.getTime() + json.duration * 1000);
    var from_date = new Date(time.getTime() - 5 * 1000);
    time_f = dateToYYYYMMDD(time) + "T" + timeToHHMMSS(time) + ".000";
    from = dateToYYYYMMDD(from_date) + "T" + timeToHHMMSS(from_date) + ".000";
    to = dateToYYYYMMDD(to_date) + "T" + timeToHHMMSS(to_date) + ".000";
    console.log("from: " + from);
    console.log("to: " + to);

    export_video(json.cam_id, from, to, function (video_id) {
        export_image(json.cam_id, time_f, function (image) {
            var transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: mail_user,
                    pass: mail_pass,
                },
            });

            var mailOptions = {
                from: mailfrom,
                to: json.email,
                subject: "SecurOS Event Notification",
                attachments: [
                    {
                        // utf-8 string as an attachment
                        filename: "image.jpg",
                        content: fs.createReadStream(image),
                    },
                ],
                text:
                    "There was an Event in the camera  " +
                    json.camera_id +
                    "\n\tType: " +
                    json.type +
                    "\n \tEvent: " +
                    json.action +
                    "\n\tTime: " +
                    json.time +
                    "\nAttached you will find an image of this event. You can also find a video in the server with the name: " +
                    video_id +
                    ".avi",
            };

            console.log(mailOptions);
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("Email sent: " + info.response);
                }
            });
        });
    });
}
function just_export(json) {
    var time = new Date(json.time);
    var to_date = new Date(time.getTime() + json.duration * 1000);
    var from_date = new Date(time.getTime() - 5 * 1000);
    time_f = dateToYYYYMMDD(time) + "T" + timeToHHMMSS(time) + ".000";
    from = dateToYYYYMMDD(from_date) + "T" + timeToHHMMSS(from_date) + ".000";
    to = dateToYYYYMMDD(to_date) + "T" + timeToHHMMSS(to_date) + ".000";
    console.log("from: " + from);
    console.log("to: " + to);

    export_video(json.camera_id, from, to, function (video_id) {
        console.log("Video " + video_id + " was exported successfully");
    });
}

function export_video(cam, from, to, callback) {
    var options = {
        method: "POST",
        url: `http://${securos_ip}:${restapi_port}/api/v1/export/tasks`,
        headers: {
            Authorization: "Basic aXNzOmlzcw==",
            "Content-Type": "application/javascript",
        },
        body: '{\r\n "camera":"' + cam + '",\r\n "from":"' + from + '",\r\n "to":"' + to + '"\r\n}',
    };
    console.log(options);
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(error);

        var json = JSON.parse(response.body);
        console.log("Resp:" + JSON.stringify(json));
        try {
            var video_id = json.data.id;
            callback(video_id);
        } catch (e) {
            console.log("Error", e);
            callback(e);
        }
    });
}

function export_image(cam, date, callback) {
    var options = {
        method: "GET",
        url: "http://127.0.0.1:8888/api/v2/cameras/" + cam + "/image/" + date,
        headers: {
            Authorization: "Basic aXNzOmlzcw==",
        },
        encoding: null,
    };
    console.log(options);
    request(options, function (error, response) {
        if (error) throw new Error(error);
        //console.log(error)

        //var json = JSON.parse(response.body)
        console.log(response.headers);
        var image = response.body;
        var img = Buffer.from(response.body, "null");
        console.log(img);
        fs.writeFile(__dirname + "/img/" + cam + date + ".jpeg", img, function (err) {
            var path = __dirname + "/img/" + cam + date + ".jpeg";
            console.log(err);
            callback(path);
        });
    });
}

function dateToYYYYMMDD(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1; //Month from 0 to 11
    var y = date.getFullYear();
    return y + (m <= 9 ? "0" + m : m) + (d <= 9 ? "0" + d : d);
}

function timeToHHMMSS(date) {
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    return (h <= 9 ? "0" + h : h) + "" + (m <= 9 ? "0" + m : m) + "" + (s <= 9 ? "0" + s : s);
}
//Do not modify this part
exports.mail = mail;
exports.just_export = just_export;
