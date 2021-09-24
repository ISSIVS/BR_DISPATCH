

// CVS Generator
exports.genCSV = function(json) {
var fs = require("fs");
var stream = fs.createWriteStream("report.csv");

stream.once('open', function(fd) {
    stream.write('id;camera_id;incident;time;state;priority;operator;response_time;resolution_time;comment;\n');
    for(var i=0;i< json.length;i++)
    {
      //console.log(new Date(cot[i].time_comment).getYear());
      if(new Date(json[i].time).getYear() != 69)
            date = new Date(json[i].time).toLocaleString();
      else    
            date = "";
      stream.write( json[i].id +";"+json[i].camera_id +";"+json[i].incident +";"+ 
                    date+";"+ json[i].state +";"+ json[i].priority+";"+
                    json[i].operator+";"+json[i].response_time+";"+json[i].resolution_time+";"+json[i].comment+"\n"); 
    }
      stream.end();
});


};