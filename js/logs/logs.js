var config = require('./config');
const fs = require('fs');



function Write(Message, type, location)
{
	var _log_amount = parseInt(config.logs_amount);
	var _log_size = parseInt(config.log_size);

	var filepath = "C:\\ProgramData\\ISS\\logs\\" + location + ".log";
	var path = "C:\\ProgramData\\ISS\\logs";
	

	try 
	{
		fs.access(path, fs.constants.R_OK, function(err) {
			if (err && err.code === 'ENOENT') {
		    	fs.mkdir(path, function (err)//Create dir in case not found
		    	{	
		    		console.error(err);
		    	}); 
		  	}
		});
	  	if (!fs.existsSync(filepath)) {
	    	// Create a file to write to
	    	//console.log("Creating the file..")
            WriteLine(Message,type,filepath);
	  	}
	  	else
            {
            	var stats = fs.statSync(filepath);
				var fileSizeInBytes = stats["size"]
                if (fileSizeInBytes > _log_size)
                {
                    for (var i = 0; i <= _log_amount; i++)
                    {
                        if (!fs.existsSync(filepath + (i + 1).toString()))
                        {
                            if (i == _log_amount)
                            {
                                fs.unlink(filepath + i.toString(),function (err){});
                                i--;
                            }
                            for (var j = 0; j <= i; j++)
                            {
                                if (i == 0)
                                {
                                    fs.rename(filepath, filepath + (i + 1 - j).toString(),function (err){});
                                }
                                else
                                {
                                    if (i - j == 0)
                                    {
                                        fs.rename(filepath, filepath + "1",function (err){});
                                    }
                                    else
                                    {
                                        fs.rename(filepath + (i - j).toString(), filepath + (i + 1 - j).toString(),function (err){});
                                    }

                                }

                            }
                            WriteLine(Message, type, filepath);
                            i = _log_amount;
                        }

                    }

                }
                else
                {
                    WriteLine(Message, type, filepath);
                }
            }
	} catch(err) 
	{
	  
	}
}

function WriteLine(Message, type, filepath)
{
	//console.log(Message+ type+ filepath)
    var level = config.level;

    let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let hours = date_ob.getHours();
	let minutes = date_ob.getMinutes();
	let seconds = date_ob.getSeconds();
	// prints date & time in YYYY-MM-DD HH:MM:SS format
	////console.log("logging "  + configuration.log + " type: "+type)
    switch (level)
    {
        case "DEBUG":
            if (type == "DEBUG" || type == "INFO" || type == "ERROR" || type == "WARN")
            {
                fs.appendFile(filepath, year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds + "\t" + type + "\t" + Message+"\r\n", function (err) {
					if (err) throw err;
					//console.log('msg wrote!');
				});
            }
            break;
        case "INFO":
            if (type == "INFO" || type == "ERROR" || type == "WARN")
            {
            	//console.log("INFOOO")
            	//console.log( year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds + "\t - \t" + type + "     " + Message);
                fs.appendFile(filepath, year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds + "\t" + type + "\t" + Message+"\r\n", function (err) {
					if (err) throw err;
					//console.log('msg wrote!');
				});
            }
            break;
        case "TRACE":
            if (type == "TRACE" || type == "DEBUG" || type == "INFO" || type == "ERROR" || type == "WARN")
            {
                fs.appendFile(filepath, year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds + "\t" + type + "\t" + Message+"\r\n", function (err) {
					if (err) throw err;
					//console.log('msg wrote!');
				});
            }
            break;
        default:
            if (type == "INFO" || type == "ERROR" || type == "WARN")
            {
                fs.appendFile(filepath, year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds + "\t" + type + "\t" + Message+"\r\n", function (err) {
					if (err) throw err;
					//console.log('msg wrote!');
				});
            }
            break;
    }

}
module.exports = { Write }