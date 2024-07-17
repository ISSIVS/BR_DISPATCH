const axios = require('axios');
const serverIp = "localhost";
const facexPort = "21093";

const restapiPort = "8888";

exports.getTodayRecognitions = async () => {
    try {
        var date = new Date();
        var dateNowFormatted = await getDateAndTime(date);
        
        date.setTime(date.getTime()-86400000); 
        var dateBeforeFormatted = await getDateAndTime(date);

        var lists = [];
        var responseLists = await axios.get('http://'+serverIp+':'+facexPort+'/v1/spotter/list');
        for (var i=0; i<responseLists.data.lists.length; i++) {lists.push(responseLists.data.lists[i].id);}
        
        var feeds = (await axios.get('http://'+serverIp+':'+restapiPort+'/api/v1/facexconfig')).data.data[0].facex_feed_ids;
        
        var data = {
            "lists": lists,
            "feeds": feeds,
            "min_timestamp": dateBeforeFormatted,
            "max_timestamp": dateNowFormatted
        };

        const response = await axios.post('http://'+serverIp+':'+facexPort+'/v1/spotter/match?action=list&limit=20&offset=0', JSON.stringify(data));

        var recognitions = [];

        for (var i=0; i<response.data.matches.length; i++) {
            var priority = "";
            if (response.data.matches[i].list.priority == 0) {priority = "recognition";} 
            else if (response.data.matches[i].list.priority == 1) {priority = "info-recognition";} 
            else {priority = "white-recognition";}

            recognitions.push({
                "timestamp": convertUTCDate(response.data.matches[i].timestamp),
                "camName": (await axios.get('http://'+serverIp+':'+restapiPort+'/api/v1/cameras/'+response.data.matches[i].feed)).data.data.name,
                "listName": response.data.matches[i].list.name,
                "personName": response.data.matches[i].person.first_name + " " + response.data.matches[i].person.middle_name + " " + response.data.matches[i].person.last_name,
                "listType": priority,
                "detectionImage": 'http://'+serverIp+':'+facexPort+response.data.matches[i].detection._links.detection_image,
                "listImage": 'http://'+serverIp+':'+facexPort+response.data.matches[i].matched_person_face_image._links.source
            });
        }
        return recognitions;

    } catch(err) {return err;}
}

exports.getPerson = async (id) => {
    try {
        const response = await axios.get('http://'+serverIp+':'+facexPort+'/v1/spotter/person/'+id);
        
        return setPersonInfo(response.data);

    } catch(err) {return err;}
}

exports.getRecognitions = async (body) => {
    try {
        var data = {
            "feeds": body.feed,
            "lists": body.lists,
            "min_timestamp": body.initdate,
            "max_timestamp": body.finaldate
        }

        const response = await axios.post('http://'+serverIp+':'+facexPort+'/v1/spotter/match?action=list&limit='+body.limit+'&offset=0', JSON.stringify(data));

        var recognitions = [];

        for (var i=0; i<response.data.matches.length; i++) {
            var priority = "";
            if (response.data.matches[i].list.priority == 0) {priority = "recognition";} 
            else if (response.data.matches[i].list.priority == 1) {priority = "info-recognition";} 
            else {priority = "white-recognition";}

            recognitions.push({
                "timestamp": convertUTCDate(response.data.matches[i].timestamp),
                "camName": (await axios.get('http://'+serverIp+':'+restapiPort+'/api/v1/cameras/'+response.data.matches[i].feed)).data.data.name,
                "listName": response.data.matches[i].list.name,
                "personName": response.data.matches[i].person.first_name + " " + response.data.matches[i].person.middle_name + " " + response.data.matches[i].person.last_name,
                "listType": priority,
                "detectionImage": 'http://'+serverIp+':'+facexPort+response.data.matches[i].detection._links.detection_image,
                "listImage": 'http://'+serverIp+':'+facexPort+response.data.matches[i].matched_person_face_image._links.source
            });
        }
    
        return recognitions;

    } catch(err) {return err;}
}

function setPersonInfo(info) {
    var faceImg = (info.faces.length !== 0) ? 'http://'+serverIp+':'+facexPort+info.faces[0]._links.source : "";

    return {
        "id": info.id,
        "first_name": info.first_name,
        "middle_name": info.middle_name,
        "last_name": info.last_name,
        "external_id": (info.external_id == null) ? "" : info.external_id,
        "notes": info.notes,
        "faceImg": faceImg
    }
}

function getWatchlistType(priority) {
    if (priority == 0) {return "Blacklist";} 
    else if (priority == 1) {return "Informationlist";} 
    else {return "Whitelist";}
}

function getWatchlistThreshold(threshold) {
    var splittedValue = String(threshold).split(".");
    if (splittedValue[0] == 1){return 100;} 
    else {return Number(String(splittedValue[1]).substr(0,2));}
}

function getFormattedDate(date) {
    var splittedDateTime = date.split("T");
    var splittedDate = splittedDateTime[0].split("-");
    var newDate = splittedDate[2] + "/" + splittedDate[1] + "/" + splittedDate[0];
    var modifiedDate = newDate + " " + splittedDateTime[1].substr(0,5);

    return modifiedDate;
}

async function getDateAndTime(date) {
    var day = date.getDate().toString();
	var monthNumber = Number(date.getMonth()) + 1;
	var month = monthNumber.toString();
	var year = date.getFullYear().toString();
    var hours = date.getHours().toString();
	var minutes = date.getMinutes().toString();

    return year + "-" + ("0"+month).slice(-2) + "-" + ("0"+day).slice(-2) + "T" + ("0"+hours).slice(-2) + ":" + ("0"+minutes).slice(-2) + ":00-03:00";
}

function convertUTCDate(facexDate)
{	
	var dateTimeSplitted = facexDate.split("T");
	var date = dateTimeSplitted[0].split("-");
	var time = dateTimeSplitted[1].split(":");
	var minutes = time[2].split(".");
	var date = new Date(Number(date[0]), (Number(date[1])-1), Number(date[2]), Number(time[0]), Number(time[1]), Number(minutes[0]), Number(minutes[1].substr(0, minutes[1].length-1)));
	date.setTime(date.getTime()-10800000);
	
	var dia = date.getDate().toString();
	var mesNumber = Number(date.getMonth()) + 1;
	var mes = mesNumber.toString();
	var ano = date.getFullYear().toString();
	var horas = date.getHours().toString();
	var minutos = date.getMinutes().toString();
	var segundos = date.getSeconds().toString();
	
	var data = ("0"+dia).slice(-2) + "/" + ("0"+mes).slice(-2) + "/" + ano.slice(2) + " " + ("0"+horas).slice(-2) + ":" + ("0"+minutos).slice(-2) + ":" + ("0"+segundos).slice(-2);
	
	return data;
}