// SecurOS 10.8  EventViewer HTML5 //

//Securos  Information
var Securos_Server_IP = "127.0.0.1";
//Rest Api credentials 
var RestApi_port = '8888';
var RestApi_user = 'iss';
var RestApi_pass = 'iss';

var mailfrom = "santiago.rondon.c@gmail.com";
var mail_user = "santiago.rondon.c@gmail.com";
var mail_pass = '960516[[';

//Dashboard Port #
var Server_port = 8333;
//use this port to access via webbrowser to SecurOS EventViewer HTML5
//for Example http://127.0.0.1:8333


//Do not modify this part
exports.restapi_port = RestApi_port;
exports.restapi_user = RestApi_user;
exports.restapi_pass = RestApi_pass;
exports.ip   = Securos_Server_IP;
exports.serverPort = Server_port;

exports.mailfrom = mailfrom;
exports.mail_user = mail_user;
exports.mail_pass = mail_pass;
