var recognition;

ISScustomAPI.subscribe("CAM", "1", "FACE_X_INFO");

// NEW
ISScustomAPI.subscribe("CAM", "1", "CLEAR");
//

ISScustomAPI.onEvent((type, id, action, params) => {
    // NEW
    if (action == "CLEAR") {
        recognition.innerHTML = ``;
        return;
    }
    //

    document.getElementById("recognition-list").innerHTML = "";
    let addNewRecognition = "";

    let data = JSON.parse(params.params).comment;
    let params2 = JSON.parse(data.replace(/:\s*,/g, ': "",'));

    let serverIp = JSON.parse(params.params).__source;
    let priority = params2.list.priority;
    // let camId = params2.cam_id;
    let camName = params.cam_name;

    let watchlistName = params2.list.name;

    let recognitionImgSrc = `http://${serverIp.split(":")[0]}:21093${params2.matched_person_face_image._links.source}`;
    let watchlistImgSrc = `http://${serverIp.split(":")[0]}:21093${params2._links.detection_image}`;

    let similarity = Number(params2.similarity).toFixed(2) * 100;
    let personName = params2.person.first_name + " " + params2.person.middle_name + " " + params2.person.last_name;
    let timestamp = convertUTCDate(params2.timestamp);

    if (priority == 0) {
        addNewRecognition = "recognition";
    } else if (priority == 1) {
        addNewRecognition = "info-recognition";
    } else {
        addNewRecognition = "white-recognition";
    }

    recognition = document.createElement("div");
    recognition.innerHTML = `
            <div class="${addNewRecognition}">
                <div class="software-images">
                    <div class="recognition-image">
                        <img src="${recognitionImgSrc}">
                    </div>
            
                    <div class="watchlist-image">
                        <img src="${watchlistImgSrc}">
                        <p class="recog-title">Similaridade de ${similarity}%</p>
                    </div>
                </div>
            
                <div class="recognition-info">
                    
                    <div class="recognition-date">
                        <img src="css/assets/svg/icon-time.svg">
                        <p class="recog-title">${timestamp}</p>
                    </div>
            
                    <!--<img class="icon-more" src="css/assets/svg/icon-more.svg">-->
            
                    <div class="recognition-camera">
                        <img src="css/assets/svg/icon-cam.svg">
                        <p class="recog-title">${camName}</p>
                    </div>
            
                    <div class="operator-list">
                        <img src="css/assets/svg/icon-man-list.svg">                      
                        <button class="recognition-button2">
                            <svg class="circle">
                                <circle cx="5" cy="8" r="3.5"/>
                            </svg>
                            ${watchlistName}
                        </button>
                    </div>
            
                    <div class="person-name">
                        <img src="css/assets/svg/icon-user.svg">
                        <p class="recog-title">${personName}</p>
                    </div>
            
                    <!--
                    <div class="info-button">
                        <button class="recognition-button">
                            <img src="css/assets/svg/icon-info.svg">
                            <span class="recog-btn-txt">Info</span>
                        </button>
                    </div>
            
                    <div class="video-buttons">
                        <button class="recognition-button">
                            <img src="css/assets/svg/icon-cam.svg">
                            <span class="recog-btn-txt">Ao vivo</span>
                        </button>
                        <button class="recognition-button">
                            <img src="css/assets/svg/icon-play-white.svg">
                        <span class="recog-btn-txt">Gravação</span>
                        </button>
                    </div>
                    -->
                </div>
            </div>
        `;
    // document.write(priority);
    var recognitionList = window.document.getElementById("recognition-list");
    recognitionList.insertBefore(recognition, recognitionList.firstChild);
});

function convertUTCDate(facexDate) {
    var dateTimeSplitted = facexDate.split("T");
    var date = dateTimeSplitted[0].split("-");
    var time = dateTimeSplitted[1].split(":");
    var minutes = time[2].split(".");
    var date = new Date(
        Number(date[0]),
        Number(date[1]) - 1,
        Number(date[2]),
        Number(time[0]),
        Number(time[1]),
        Number(minutes[0]),
        Number(minutes[1].substr(0, minutes[1].length - 1))
    );
    date.setTime(date.getTime() - 10800000);

    var dia = date.getDate().toString();
    var mesNumber = Number(date.getMonth()) + 1;
    var mes = mesNumber.toString();
    var ano = date.getFullYear().toString();
    var horas = date.getHours().toString();
    var minutos = date.getMinutes().toString();
    var segundos = date.getSeconds().toString();

    var data =
        ("0" + dia).slice(-2) +
        "/" +
        ("0" + mes).slice(-2) +
        "/" +
        ano.slice(2) +
        " " +
        ("0" + horas).slice(-2) +
        ":" +
        ("0" + minutos).slice(-2) +
        ":" +
        ("0" + segundos).slice(-2);

    return data;
}
