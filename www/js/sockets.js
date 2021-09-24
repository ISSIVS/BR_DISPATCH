var socket  = io.connect();
var cams;
socket.on('cameras', function(data) {
    cams = data;
    showCams()
});