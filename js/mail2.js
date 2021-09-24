var nodemailer = require('nodemailer');
var request = require('request');
var fs = require('fs');
var http = require('http');

var mail_user = "santiago.rondon.c@gmail.com";
var mail_pass = '960516[[';

//-------------test---------------
var jsontest = {
	action: 'ARMED',
  	id: '1',
  	params: { __source: 'DESKTOP-V0MNE0D' },
  	time: '2021-04-16T14:43:30.694',
  	type: 'CAM'
}

test();

function test()
{
	mail(jsontest); 
}
//Example JSON
/*
------------------------------------------------
{
  action: 'ARMED',
  id: '1',
  params: { __source: 'DESKTOP-V0MNE0D' },
  time: '2021-04-07T15:50:37.694',
  type: 'CAM'
}
---------------------------------------------
{
  action: 'DISARMED',
  id: '1',
  params: { __source: 'DESKTOP-V0MNE0D' },
  time: '2021-04-07T15:50:37.831',
  type: 'CAM'
}
----------------------------------------------
*/
//-----------end test------------

function mail(json){
	var to_date = new Date(json.time);
	var from_date = new Date(to_date.getTime() - 5*1000);
	from = dateToYYYYMMDD(from_date)+'T'+timeToHHMMSS(from_date)+'.000';
	to = dateToYYYYMMDD(to_date)+'T'+timeToHHMMSS(to_date)+'.000';
	console.log("from: "+from);
	console.log("to: "+to)
	
	export_video(json.id,from,to, function(video_id){
		/*download("http://127.0.0.1:8888/api/v2/cameras/1/image/20210416T144330.000", 'test.jpg', function(){
			const file = fs.createWriteStream("file.jpg");
			const request = http.get("http://127.0.0.1:8888/api/v2/cameras/1/image/20210416T144330.000", function(response) {
				console.log(request)
				console.log(response);
  			response.pipe(file);
			});
		});*/
		export_image(json.id,to,function(image)
		{
				
				var transporter = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
				    user: mail_user,
				    pass: mail_pass
				}
				});

				var mailOptions = {
				from: 'santiago.rondon.c@gmail.com',
				to: 'santiago.rondon.c@gmail.com',
				subject: 'SecurOS Event Notification',
				attachments: [
				    {   // utf-8 string as an attachment
				        //filename: video_id+'.avi',
				        filename: 'image.jpg',
				        //path: 'C:/export/'+video_id+'.avi'
				        content: fs.createReadStream(image)
				    }
				],
				text: 'There was an Event in the camera  '+ json.id + '\n\tType: '+ json.type + '\n \tEvent: '+json.action+'\n\tTime: '+json.time+'\nAttached you will find an image of this event. You can also find a video in the server with the name: '+video_id+'.avi'
				};

				//console.log(mailOptions);
				transporter.sendMail(mailOptions, function(error, info){
						if (error) {
						console.log(error);
						} 
						else{
						console.log('Email sent: ' + info.response);
						}
				});
			});
		
	});	
}

function export_video(cam,from,to,callback)
{
	var options = {
	  'method': 'POST',
	  'url': 'http://127.0.0.1:8888/api/v1/export/tasks',
	  'headers': {
	    'Authorization': 'Basic aXNzOmlzcw==',
	    'Content-Type': 'application/javascript'
	},
  	body: '{\r\n "camera":"'+cam+'",\r\n "from":"'+from+'",\r\n "to":"'+to+'"\r\n}'
	};
	//console.log(options)
	request(options, function (error, response) {
	  if (error) throw new Error(error);
	  //console.log(error)

	  var json = JSON.parse(response.body)
	  //console.log("Resp:"+JSON.stringify(json));
	  var video_id = json.data.id;
	  callback(video_id);
	});	
}
function export_image(cam,date,callback)
{
	var options = {
	  'method': 'GET',
	  'url': 'http://127.0.0.1:8888/api/v2/cameras/'+cam+'/image/'+date,
	  'headers': {
	    'Authorization': 'Basic aXNzOmlzcw=='
		},
	  "encoding": null	
  	};
	console.log(options)
	request(options, function (error, response) {
	  if (error) throw new Error(error);
	  //console.log(error)

	  //var json = JSON.parse(response.body)
	  console.log(response.headers);
	  var image = response.body;
	  var img =Buffer.from(response.body,'null')
	  console.log(img)
	  fs.writeFile(__dirname+'/img/'+cam+date+'.jpeg',img,function(err)
            {
            	var path = __dirname+'/img/'+cam+date+'.jpeg'
            	console.log(err);
      			callback(path);      	
            });
	  
	});	
}
var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};
function dateToYYYYMMDD(date) {
    var d=date.getDate();
    var m=date.getMonth()+1; //Month from 0 to 11
    var y=date.getFullYear();
    return (y+(m<=9 ? '0'+ m : m)+(d <=9 ? '0'+ d : d));
}

function timeToHHMMSS(date) {
    var h=date.getHours();
    var m=date.getMinutes(); 
    var s=date.getSeconds();
    return (h <=9 ? '0'+ h : h)+''+(m<=9 ? '0'+ m : m)+''+(s <=9 ? '0'+ s : s);
}
//Do not modify this part
exports.mail = mail;