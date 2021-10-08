const http = require('http')
fs = require('fs');
const request = require('request');
const config = require('./config')


const cams = {
"callback": "http://127.0.0.1:"+config.serverPort+"/events", "filter": {
"type": "CAM"
}
}
const sensors = {
  "callback": "http://127.0.0.1:"+config.serverPort+"/events", "filter": {
  "type": "SENSOR"
  }
}
const partitions = {
  "callback": "http://127.0.0.1:"+config.serverPort+"/events", "filter": {
  "type": "PARTITION"
  }
}

var username = config.restapi_user;
var password = config.restapi_pass;

var options= {
    url: `http://${config.ip}:${config.restapi_port}/api/v1/events/subscriptions/`,
    auth: {
        username: config.restapi_user,
        password: config.restapi_pass
    }
};

var optionspost= {
    url: `http://${config.ip}:${config.restapi_port}/api/v1/events/subscriptions/`,
    auth: {
        username: config.restapi_user,
        password: config.restapi_pass
    }
  };

request.get(options, (err, res, body) => {
  if (err) {  console.log(err); console.log('fail request get'); return }
  var json = JSON.parse(body)
  if(json.data.length > 0)
  {
    for(var p in json.data)
    {
       if(json.data[p].callback == `http://127.0.0.1:${config.serverPort}/events`)           
       {
          deleteEvents(json.data[p].id)
          console.log(json.data[p].id)
       }
    }
  }
  else
  {
    console.log("Nothing to delete")
  }
  createSubscription();
});


function createSubscription()
{
  console.log('Creating subscription...');
  optionspost.json = cams;
  request.post(optionspost, (err, res, body) => {
    if (err) {  console.log(err); console.log('fail request post'); return }
    console.log(body);
  })
  optionspost.json = sensors;
  request.post(optionspost, (err, res, body) => {
    if (err) {  console.log(err); console.log('fail request post'); return }
    console.log(body);
  })
  optionspost.json = partitions;
  request.post(optionspost, (err, res, body) => {
    if (err) {  console.log(err); console.log('fail request post'); return }
    console.log(body);
  })
}


function deleteEvents(id)
{
  console.log("Deleting record")
  var optionsDelete= {
    url: `http://${config.ip}:${config.restapi_port}/api/v1/events/subscriptions/${id}`,
    auth: {
        username: config.restapi_user,
        password: config.restapi_pass
    }
  }
  request.delete(optionsDelete, (err, res, body) => {
    if (err) { console.log(err); console.log('fail request post'); return }
    console.log(JSON.parse(body)); 
  });
}

