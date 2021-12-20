//////////////////////////////
////Home Page main.js
//////////////////////////////
var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
var options2 = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
var options3 = { year: 'numeric', month: 'numeric', day: 'numeric'};
var options4 = { hour: 'numeric', minute: 'numeric', second: 'numeric' };
//global variables
var name_selected;
var cameras;


var socket = io();
socket.on('newEvent', function(msg) {
    console.log('receiving event :',msg)
    buildTable(msg)
});
socket.on('directory', function(msg) {
    //console.log('receiving directory')
    buildNames(msg)
});
socket.on('getCameras', async function(msg) {
    //console.log('receiving cameras')
   // await buildCameras(msg)
});
socket.on('queryResult', function(msg) {
    //console.log('receiving report')
    console.log(msg)
    
    buildReport(msg,function(msg){

    })
});


function incidents(){
    $(".nav-item").click(function(e) {
        console.log(this);
        $(this).addClass("active").siblings().removeClass("active");
    })
    var dir = document.getElementById('reports');
    dir.classList.add("hidden")
    var dir = document.getElementById('directory');
    dir.classList.add("hidden")
    console.log('hidden directory')
    var inc = document.getElementById('incidents');
    inc.classList.remove("hidden")
}

function directory(){

    $(".nav-item").click(function(e) {
        $(this).addClass("active").siblings().removeClass("active");
    })

    var dir = document.getElementById('directory');
    dir.classList.remove("hidden")
    console.log('Showing Directory',dir)
    var inc = document.getElementById('incidents');
    inc.classList.add("hidden")
    var dir = document.getElementById('reports');
    dir.classList.add("hidden")
    socket.emit('getDirectory',null)

}





function report(){

    $(".nav-item").click(function(e) {
        console.log(this);
        $(this).addClass("active").siblings().removeClass("active");
    })
    var dir = document.getElementById('reports');
    dir.classList.remove("hidden")
    var inc = document.getElementById('incidents');
    inc.classList.add("hidden")
    var inc = document.getElementById('directory');
    inc.classList.add("hidden")

}
var cameras;
var coordinates = [];


function buildCameras(msg){
    var json = JSON.parse(msg);
    cameras = json;
    var cam_select = document.getElementById('cam_select');
       var len = json.data.length;
       console.log(len);
       for (var i = 0; i<len ; i++)
          {
            cam_select.options[i] = new Option(json.data[i].name,json.data[i].id);
            coordinates[i] = json.data[i].settings.coordinates;
            console.log(json.data[i].settings.coordinates)
          }

}

function buildNames(json){
  var table = ''
  var options = '<option selected value="">Select</option>'
 for(var i=0; i< json.length; i++){
    table += '<tr class="table-row-names clickable-row " >'
    table += '<th hidden="true" scope="row" id="id">'+json[i].id+'</th>';
    table += '<td id="Fullname" min-width="100px" >'+json[i].person_name+'</td>'
    table += '<td id="email" width="200px" >'+json[i].email_address+'</td>'
    table += '<td id="phone" >'+json[i].phone_number+'</td>'
    table += '<td id="title">'+json[i].title+'</td>'
    table += '</tr>'

    options += `<option value="${json[i].email_address}">${json[i].title} ${json[i].person_name} (${json[i].email_address})</option>`


 }
 try{
    const regex = /null/ig;
    table = table.replace(regex, '');
    options = options.replace(regex, '');

    var rows = document.getElementById('rowsnames');
    rows.innerHTML = table;

    var rows = document.getElementById('to');
    rows.innerHTML = options;


    rows.classList.add('tbody')
    }
    catch(e){document.getElementById('test').innerHTML = 'Error 123:'+e}

$(document).ready(function($) {

     $(".table-row-names").click(function(e) {
        console.log(this);
        $(this).addClass("table-selected").siblings().removeClass("table-selected");
        //$('.table-selected td').addClass("table-selected")
        var id =  $(this).find("th#" + 'id').html()
        console.log(id)
        name_selected = id;
    });
});

}

function  btnBackReport(event){

    var dir = document.getElementById('tablereports');
    dir.classList.add("hidden")
    var inc = document.getElementById('formreports');
    inc.classList.remove("hidden")

};

async function  thread(json,callback)
{
    var table = ''

    for(var i=0; i< json.length; i++){
            table += '<tr class="table-row clickable-row " >'
            table += '<th hidden="true" scope="row" id="id">'+json[i].id+'</th>';
            table += '<td id="camera_id" >'+json[i].camera_id+'</td>'
            table += '<td id="incident" >'+json[i].incident+'</td>'
            table += '<td id="time" >'+new Date(json[i].time).toLocaleDateString("en-US", options)+'</td>'
            table += '<td id="state">'+json[i].state || ''+'</td>'
            table += '<td id="operator">'+json[i].operator+'</td>'
            if(json[i].response_time == null)
                table += '<td id="responsetime"></td>'
            else
                table += '<td id="responsetime">'+new Date(json[i].response_time).toLocaleDateString("en-US", options2)+'</td>'
            if(json[i].resolution_time == null)
                table += '<td id="resolution_time"></td>'
            else
                table += '<td id="resolution_time">'+new Date(json[i].resolution_time).toLocaleDateString("en-US", options2)+'</td>'
            table += '<td hidden="true" id="comment">'+json[i].comment+'</td>';
            table += '<td hidden="true" id="action">'+json[i].action+'</td>';
            table += '<td hidden="true" id="priority">'+json[i].priority+'</td>';
            table += '<td hidden="true" id="procedure">'+json[i].procedure+'</td>';
            table += '</tr>'
            progression =100*i/json.length
    } 
    callback(table)
}

function buildReport(json,callback)
{
    
    var title = document.getElementById('resultsTitle');
    title.innerHTML = '<h3><button class="btn btn-success search-btn btn-directory backReport" onclick="btnBackReport(event)">'
                    + '<i class="fa fa-backward" id="backReport" aria-hidden="true"></i></button>' + ' '+ json.length + ' Results</h3>' 
    
    thread (json,function(table){
    
            try
            {
                const regex = /null/ig;
                table = table.replace(regex, '');
                
                var rows = document.getElementById('rowsResults');
                rows.innerHTML = table;
                rows.classList.add('tbody')
                
                var dir = document.getElementById('tablereports');
                dir.classList.remove("hidden")
                var inc = document.getElementById('overlaydiv');
                inc.classList.add("hidden")
        
                    }
                    catch(e){document.getElementById('test').innerHTML = "Error 221: " +e
                    }

            callback('ok')
    })
    


}   
var tabindex=1;

function btnProcedure(event){
     console.log('btnProcedure')
       var action = event.currentTarget.innerHTML;
            switch(action){
                case 'Started monitoring the incident':
                     procedure('Started monitoring the incident');
                break;
                case 'Stopped monitoring the incident':
                     procedure('Stopped monitoring the incident');
                break;
                case 'Escalated issue to supervisor':
                     procedure('Escalated issue to supervisor');
                break;
                case 'Called local site security personnel':
                     procedure('Called local site security personnel');
                break;
                case 'Called central monitoring security personnel':
                     procedure('Called central monitoring security personnel');
                break;
                case 'Called 911':
                     procedure('Called 911');
                break;
                case 'Called maintenance to look at camera related issue':
                     procedure('Called maintenance to look at camera related issue');
                break;
            } 
}


//////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////TABLA INCIDENTES/////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

function buildTable(json)
{
   
    //var cam_select = document.getElementById('cam_select');
    var table = ''
    for(var i=0; i< json.length; i++){
        table += '<tr class="table-row clickable-row" tabindex="'+json[i].id+' onkeydown=keydown()">'
        table += '<td scope="row" width="100px" id="id" hidden = "true">'+json[i].id+'</th>';
        if(json[i].priority == "Alta")
             table += '<td id="priority" width="100px" value="Alta"><center><i class="fa fa-exclamation-triangle"></i></td>'
        else if(json[i].priority == "Media")
            table += '<td id="priority" width="100px" value="Media"><center><i class="fa fa-exclamation-circle"></i></td>'
        else
            table += '<td id="priority" width="100px" value="Baja"><center><i class="fa fa-info-circle" aria-hidden="true"></i></td>'
        table += '<td id="type" >'+json[i].type +'</td>'
        table += '<td id="object_id" >'+json[i].object_id+'</td>'
        table += '<td id="name" >'+json[i].name+'</td>'
        //LPR
        if(json[i].type == 'LPR_LOGIC'){
            var params  = JSON.parse(json[i].params)
            table += '<td id="incident" >Placa:'+params.number +', Info:'+params.information_utf8 +'</td>'
        }
        //OTHERS
        else{
            table += '<td id="incident" >'+json[i].incident+'</td>'
        }
        table += '<td id="time" >'+new Date(json[i].time).toLocaleDateString("en-US", options2)+'</td>'
        table += '<td id="state">'+json[i].state || ''+'</td>'
        table += '<td id="operator">'+json[i].operator+'</td>'
        if(json[i].response_time == null)
            table += '<td id="responsetime"></td>'
        else
            table += '<td id="responsetime">'+new Date(json[i].response_time).toLocaleDateString("en-US", options2)+'</td>'
        if(json[i].resolution_time == null)
            table += '<td id="resolution_time"></td>'
        else
            table += '<td id="resolution_time">'+new Date(json[i].resolution_time).toLocaleDateString("en-US", options2)+'</td>'
        table += '<td hidden="true" id="comment">'+json[i].comment+'</td>';
        table += '<td hidden="true" id="action">'+json[i].action+'</td>';
        table += '<td hidden="true" id="priority">'+json[i].priority+'</td>';
        table += '<td hidden="true" id="procedure">'+json[i].procedure+'</td>';
        table += '<td hidden="true"id="id_cam" >'+json[i].camera_id+'</td>'
        table += '</tr>'
    }
    try{
        const regex = /null/ig;
        table = table.replace(regex, '');
        var rows = document.getElementById('rows');
        rows.innerHTML = table;
        rows.classList.add('tbody');
        filter();
    }
    catch(e){
        document.getElementById('test').innerHTML = "Error 303: "+ e
    }

    ready($);
}

$('.dropdown-toggle').dropdown();

//Document update functions JQUERY when new event
function ready($)
{
  

//Reselect the active row when a new EVENT
    $("tr[tabindex=" + tabindex + "]").addClass("table-selected").siblings().removeClass("table-selected"); 
    
    var item = document.getElementById("transferCard");
    var hasClass = item.classList.contains( 'hidden');
    if(hasClass)
    $("tr[tabindex=" + tabindex + "]").focus();
    //Click Incidents Rows
$(document).ready(function($) {
    $(".table-row").click(function(e) {
        $(this).addClass("table-selected").siblings().removeClass("table-selected");
        //variables for Incidents TAB  
        var id =  $(this).find("td#" + 'id').html()
        var incidentTime =  $(this).find("td#" + 'time').html()
        var camera = $(this).find("td#" + 'name').html()
        var priority = $(this).find("td#" + 'priority').html()
        var state = $(this).find("td#" + 'state').html()
        var comment = $(this).find("td#" + 'comment').html()
        var id_cam = $(this).find("td#" + 'id_cam ').html()
        var procedure  = $(this).find("td#" + 'procedure').html()
        var title  =  document.getElementById('card_title')
        var d  =  document.getElementById('card_incidentDate')
        var t  =  document.getElementById('card_incidentTime')
        var c  =  document.getElementById('card_camera').innerHTML=camera;  
        var p  =  document.getElementById('card_priority').innerHTML=priority;  
        var pr =  document.getElementById('card_procedure').innerHTML=procedure ;  
        var l  =  document.getElementById('card_location').innerHTML='';
        var s  =  document.getElementById('card_state').innerHTML=state;  
        var i  =  document.getElementById('card_id').innerHTML=id_cam;  
        var co = document.getElementById('card_comment').value=comment;  
        title.innerHTML  = id;
        d.innerHTML=new Date(incidentTime).toLocaleDateString("en-US", options3);
        t.innerHTML=new Date(incidentTime).toLocaleTimeString("en-US", options4);
        c.innerHTML=camera  ;
        p.innerHTML=priority;
        s.innerHTML=state;
        co.value=comment;
        tabindex=id;
        var rows = document.getElementById('incidentCard');
        var table = document.getElementById('tablediv');
        var filters = document.getElementById('tablediv');var table = document.getElementById('tablediv');

        //Resize Cols for Incidents TAB and Incidents Table
        if (rows.classList.contains("hidden")) {
                    rows.classList.remove("hidden");
                    table.classList.replace('col-md-12','col-md-9')
                    table.classList.add('tablediv')

         }

    });
})
};   


//Function Add new User to DB
function btnDir(e)
{
    e.preventDefault();
    var form = document.getElementById('newuser');  
    var user =  new FormData(form)
    var newuser = {}
    newuser.person_name =form.fullname.value
    newuser.email_address = form.email.value
    newuser.phone_number = form.phone.value
    newuser.title = form.title.value
    form.fullname.value =''
    form.email.value =''
    form.phone.value=''
    form.title.value =''
    if(newuser.person_name == '' || newuser.email_address == ''){
      //verification
    }
    else{
        console.log('ok')        
        socket.emit('newuser',newuser);
    }
}

//-------------------------- JQUERYS Section -----------------

//Activate Multiple Select filter for Incidents Type
$('.select').selectpicker({noneSelectedText: 'Tipo de prioridad',width:'100%'})

//Close Inicidents TAB  deselect rows and goto top table
$(".closeCard").click(function(e) 
{
      
        var rows = document.getElementById('incidentCard');     
        var table = document.getElementById('tablediv');
        if (!rows.classList.contains("hidden")) {
            
                rows.classList.add("hidden");
                table.classList.replace('col-md-9','col-md-12')
                
                $('.table-row').removeClass("table-selected");
                $('.table-row').first().focus(); 
                
                console.log('Close')
        }
      
});

//Close Transfer Tab
$(".closeCardTransfer").click(function(e) 
{
        var rows = document.getElementById('transferCard');
        var incidents = document.getElementById('incidentCards');
        if (!rows.classList.contains("hidden")) {
            rows.classList.add("hidden");
        }
        if (incidents.classList.contains("hidden")) {
            incidents.classList.remove("hidden");
        }
});

//Close Export Tab
$(".closeCardExport").click(function(e) 
{
        var rows = document.getElementById('exportCard');
        var incidents = document.getElementById('incidentCards');
        if (!rows.classList.contains("hidden")) {
            rows.classList.add("hidden");
        }
        if (incidents.classList.contains("hidden")) {
            incidents.classList.remove("hidden");
        }
});

//dropdowns clicks functions
$(".dropdown-item").click(function(e)
{
   
    var action = e.currentTarget.innerHTML;
    switch(action){
        case 'Transferir':
            transfer()
        break;
        case 'Export Evidence':
            exportEvidence()
        break;
        case 'En Progreso':
             state('En Progreso');
        break;
        case 'Resuelto':
             state('Resuelto');
             console.log('Resuelto')
        break;
        case 'Cerrado':
             state('Cerrado');
        break;
        case 'Falsa Alarma':
             state('Falsa Alarma');
        break;
        case 'Priorida Baja':
             priority('Baja');
        break;
        case 'Priorida Media':
             priority('Media');
        break;
        case 'Priorida Alta':
             priority('Alta');
        break;
        case 'Started monitoring the incident':
             procedure('Started monitoring the incident');
        break;
        case 'Stopped monitoring the incident':
             procedure('Stopped monitoring the incident');
        break;
        case 'Escalated issue to supervisor':
             procedure('Escalated issue to supervisor');
        break;
        case 'Called local site security personnel':
             procedure('Called local site security personnel');
        break;
        case 'Called central monitoring security personnel':
             procedure('Called central monitoring security personnel');
        break;
        case 'Called 911':
             procedure('Called 911');
        break;
        case 'Called maintenance to look at camera related issue':
             procedure('Called maintenance to look at camera related issue');
        break;
    }
})
//Start Datetimepicker for reports
$(function () {
  $("#datepicker").datepicker({ 
        autoclose: true, 
        todayHighlight: true
  }).datepicker('update', new Date());
});

//-------------------------- JQUERYS  END  -----------------


//-------------------- USER FUNCTIONS -------------------

//Transfer click 
function transfer()
{
    console.log('Transfer')
    var incidents = document.getElementById('incidentCards');
    var transfer = document.getElementById('transferCard');
    if (transfer.classList.contains("hidden")) {
            transfer.classList.remove("hidden");
    }
    if (!incidents.classList.contains("hidden")) {
            incidents.classList.add("hidden");
    }
}
//Export Evidence click 
function exportEvidence()
{
    var incidents = document.getElementById('incidentCards');
    var exportCard = document.getElementById('exportCard');
    if (exportCard.classList.contains("hidden")) {
            exportCard.classList.remove("hidden");
    }
    if (!incidents.classList.contains("hidden")) {
            incidents.classList.add("hidden");
    }
}

//Send Transfer event to Server
function send_transfer()
{
    var id  =  document.getElementById('card_title').innerHTML;
    var email = document.getElementById('to').value;
    var time = '';
    if (document.getElementById('t1').checked) {
        time = document.getElementById('t1').value;
    }
    if (document.getElementById('t2').checked) {
        time = document.getElementById('t2').value;
    }
    if (document.getElementById('t3').checked) {
        time = document.getElementById('t3').value;
    }
    var json = {'id':id,'email':email,'time':time}
    socket.emit('transfer',json)
}
//Export Evidence event to Server
function export_evidence()
{
    var id  =  document.getElementById('card_title').innerHTML;
    var email = document.getElementById('to').value;
    var time = '';
    if (document.getElementById('t1').checked) {
        time = document.getElementById('t1').value;
    }
    if (document.getElementById('t2').checked) {
        time = document.getElementById('t2').value;
    }
    if (document.getElementById('t3').checked) {
        time = document.getElementById('t3').value;
    }
    var json = {'id':id,'email':email,'time':time}
    socket.emit('export',json)
}
//Delete User event to Server
function deleteUser()
{
    var id  =  name_selected;
    socket.emit('deleteUser',id);
}

//Send Update State event to server
function state(value)
{
    var isoDateTime = new Date();
    var localDate = dateYYYYMMDD(isoDateTime);
    var localTime = isoDateTime.toLocaleTimeString('us',{hour: '2-digit', minute: '2-digit', second: '2-digit',mili: '2-digit', hour12: false});
    var localTime = localTime +'.'+ isoDateTime.getMilliseconds();
    var localtimeString = localDate + ' ' + localTime;
    var id  =  document.getElementById('card_title').innerHTML;
    var co =   document.getElementById('card_comment').value; 
    var json = {"id":id,
                "state":value,
                "operator": operator || 'External User',
                "comment":co
                };
    //console.log('json',json)   

    if(value == 'En Progreso')
    {
        json.response_time = localtimeString          
    }
          
    if(value == 'Resuelto' || value == 'Cerrado')
    {
        json.resolution_time = localtimeString;         
    }

    if(value == 'Falsa Alarma')
    {
        json.resolution_time = localtimeString; 
        json.comment += '\nFalsa Alarma'
        document.getElementById('card_comment').innerHTML = json.comment;  
    }
    //console.log(json)              
    document.getElementById('card_state').innerHTML = value;  
    console.log('state',json)
    socket.emit('state',json)
}
//Send Update Priority event to server
function priority(priority)
{
    var isoDateTime = new Date();
    var localDate = dateYYYYMMDD(isoDateTime);
    var localTime = isoDateTime.toLocaleTimeString('us',{hour: '2-digit', minute: '2-digit', second: '2-digit',mili: '2-digit', hour12: false});
    var localTime = localTime +'.'+ isoDateTime.getMilliseconds();
    var localtimeString = localDate + ' ' + localTime;
    var id  =  document.getElementById('card_title').innerHTML;
    var co =   document.getElementById('card_comment').value; 
    var json = {"id":id,
                "priority":priority,
                "response_time":localtimeString,
                "operator": operator || 'External User',
                "comment":co
                };
    document.getElementById('card_priority').innerHTML = priority; 
    socket.emit('state',json)
}
//Send Update Procedure event to server
function procedure(procedure)
{
    var isoDateTime = new Date();
    var localDate = dateYYYYMMDD(isoDateTime);
    var localTime = isoDateTime.toLocaleTimeString('us',{hour: '2-digit', minute: '2-digit', second: '2-digit',mili: '2-digit', hour12: false});
    var localTime = localTime +'.'+ isoDateTime.getMilliseconds();
    var localtimeString = localDate + ' ' + localTime;
    var id  =  document.getElementById('card_title').innerHTML;
    var co =   document.getElementById('card_comment').value; 
    var json = {"id":id,
                "procedure":procedure,
                "response_time":localtimeString,
                "operator": operator || 'External User',
                "comment":co + '\n' + procedure
                };
    //console.log('procedure')
    document.getElementById('card_procedure').innerHTML =procedure ; 
    socket.emit('state',json)
}

//Send Report Query to server
function reports(event){
    event.preventDefault();
    var dir = document.getElementById('overlaydiv');
    dir.classList.remove("hidden")
    var inc = document.getElementById('formreports');
    inc.classList.add("hidden")


    var incident_select = document.getElementById('incidents-list');
    incident_select = incident_select.options[incident_select.selectedIndex].value;
    //usuario
    var state_select = document.getElementById('state-list');
    state_select = state_select.options[state_select.selectedIndex].text;
    // id de reconocedores
    var cam_selected = []; 
    var cam_select = document.getElementById('cam_select');
    for(var i = 0; i <cam_select.options.length ;i++ )
        {
        if(cam_select.options[i].selected)
            {
                cam_selected.push(cam_select.options[i].value);
            }
    }
    var date = document.getElementById('reservationtime').value ;  
    var arrayDefechas = date.split(' - ');
    var date1=arrayDefechas[0];
    var date2=arrayDefechas[1];
    var db = {    
                incident:incident_select,
                state: state_select,
                dates: {initial:date1,final:date2},
                cameras: cam_selected
             }

    socket.emit('query',db)
 
 //sow overlaydiv

}

// Filter Incidents  main Table

var filtername  =''
var filterincident=[]
var filterstate=''

function filterByName() {
  var input;
  input = document.getElementById("filterbyname");
  filtername = input.value.toUpperCase();
  filter();
}

function filterByIncident(obj) {
  var input;
  filterincident = []
  var incidents = document.getElementById('filterbyincident');

  for(var i = 0; i <incidents.options.length ;i++ )
    {
      if(incidents.options[i].selected)
        {
            //console.log(incidents.options[i].value)
          filterincident.push(incidents.options[i].value);
        }
    }
  console.log('filterincident:',filterincident)
  if(filterincident == []){
            filterincident='';
            incidents.options[0].selected() ;
   }  
  filter()
}

function filterByState(obj) {
  var input;
  console.log(obj.value)
  filterstate = obj.value;
  if(filterstate=='All')
    filterstate='';
    filter()
}


function filter()
{
    try{
        var f1=true
        var f2=true
        var f3=true 
        var td1,td2,td3
        activeIncidents = 0 ;
        table = document.getElementById("table");
        //console.log(filtername,filterincident,filterstate)   //2 Y ARMED
        tr = table.getElementsByTagName("tr");
        
        for (i = 1; i < tr.length; i++) {
            td1 = tr[i].getElementsByTagName("td")[4];   //Name
            td2 = tr[i].getElementsByTagName("td")[9];   //Type of Incident
            td3 = tr[i].getElementsByTagName("td")[7];   //State
            td4 = tr[i].getElementsByTagName("td")[3];   //ID
            td5 = tr[i].getElementsByTagName("td")[1];   //Priority
           // td5 = td5.getElementsByTagName("button")[0];   //ID
            
            //filter By Name
            if (td1 &&  filtername!=""){
                txtValue = td1.textContent || td1.innerText ; //2
                txtValue2 = td4.textContent || td4.innerText ; //2
                var f_name =  txtValue.toUpperCase().indexOf(filtername) > -1
                var f_id =  txtValue2.toUpperCase().indexOf(filtername) > -1
                f1 = f_name || f_id
            }
            else f1=true;

            //filter By Incident
            if (td5 &&  filterincident!="") {
                txtValue = td5.getAttribute( 'value' );
                console.log('txtValue:',txtValue) 
                for (var p in filterincident)
                {
                    if(filterincident[p].toUpperCase()== "ALL"){
                        f2=true;
                        break;
                    }
                    if(filterincident[p].toUpperCase()== txtValue.toUpperCase()){
                        f2=true;
                        break;
                    }
                    else
                    {    
                        f2=false;   
                    }
                }
            }
            else f2=true
            
    
            //filter By State
            if (td3 && filterstate!="") {
                txtValue = td3.textContent || td3.innerText; 
                f3  =  txtValue.toUpperCase() == filterstate.toUpperCase()
            }
            else f3=true

            //Check  filters
            if (f1 && f2 && f3 && td3) {
                txtValue = td3.textContent || td3.innerText; 
                
                
                if(txtValue =='Nuevo' || txtValue == 'En progreso'){
                    activeIncidents++;
                    //if(priorityValue =='Nuevo' || txtValue == 'En progreso')
                    //    activeIncidents++;
                }

                tr[i].style.display = "";
            } 
            else {
                tr[i].style.display = "none";
            }
        }//end for
    
        //calculate Qty of events actives are in the table
        active = document.getElementById("activeIncidents");
        active.innerHTML = '<i class="fa fa-exclamation-triangle triangle" aria-hidden="true"></i> '+activeIncidents+ ' Active Incidents'  ;
    }//End try
    catch(e){
        console.log(e)
    }
}//filter function


//keyboard shortcuts
document.querySelector("#table").addEventListener("keydown", function(event) {
    console.log(event)
    event.stopPropagation();
    if(!event.repeat){
        
        //--- Was a Shift-Q combo pressed?
        if (event.shiftKey  && ( event.key === "q" || event.key === "Q")) {  // case sensitive
            //state('En Progreso');
        }
         //--- Was a Shift-W combo pressed?
         if (event.shiftKey  && ( event.key === "w" || event.key === "W")) {  // case sensitive
            state('Resuelto');
            handled = false
            return false;
        }
        //--- Was a Shift-E combo pressed?
          if (event.shiftKey  && ( event.key === "e" || event.key === "E")) {  // case sensitive
            //state('Cerrado');
        }
        //--- Was a Shift-E combo pressed?
        if (event.shiftKey  && ( event.key === "f" || event.key === "F")) {  // case sensitive
            //state('Falsa Alarma');
        }
    }

},true);



//-------------------------------------SecurOS  SECTTION -------------------------------------
//This integration, only work when the front Ends is used into SecurOS Desktop
//
var operator;
var Media_client;
//Start SecurOS Connection
starSecurOS()

function starSecurOS(){
    try{    

    ISScustomAPI.onSetup(function(settings){
            
            let jsonSettings = JSON.parse(settings);
            document.getElementById('test').innerHTML = jsonSettings.operator
            Media_client= jsonSettings.media_client_id;
            operator = jsonSettings.operator ;
             var advance 
            advance = jsonSettings.advanced;
            advance =  JSON.parse(advance);
            document.getElementById("test").innerHTML =advance.config;
            try{
            if(advance.config == true)
                {
                    // document.getElementById("setup").style.display = "inline";
                }
            }
            catch(e)
            {
                    //document.getElementById("test").innerHTML = e;
            }
        });
    }
    catch(e)
    {}
}

//SecurOS User Functions
//Play Button
function play()
{
    try{   
    var cam_id  =  document.getElementById('card_id').innerHTML;
    console.log(cam_id);
    var date = document.getElementById('card_incidentDate').innerHTML
    var time  =  document.getElementById('card_incidentTime').innerHTML
    var isoDateTime = new Date(date + ' '+ time);
    var localDate = dateToDDMMYY(isoDateTime);
    var localTime = isoDateTime.toLocaleTimeString('us',{hour: '2-digit', minute: '2-digit', second: '2-digit',mili: '2-digit', hour12: false});
            var localTime = localTime +':'+ isoDateTime.getMilliseconds();
            var localtimeString = localDate + ' ' + localTime;
            ISScustomAPI.sendReact("MEDIA_CLIENT", Media_client,"ADD_SEQUENCE",'{"mode":"1x1","seq":"'+cam_id+'"}')  
            ISScustomAPI.sendReact("MEDIA_CLIENT", Media_client,"SEEK",'{"date":"'+localDate+'","time":"'+localTime+'","cam":"'+cam_id+'"}')  
            }
    catch(e){
        document.getElementById("test").innerHTML =e;       
    }
};
//Live Button
function live()
{
    try{   
    var cam_id  =  document.getElementById('card_id').innerHTML;
    console.log(cam_id);
    var date = document.getElementById('card_incidentDate').innerHTML
            ISScustomAPI.sendReact("MEDIA_CLIENT", Media_client,"ADD_SEQUENCE",'{"mode":"1x1","seq":"'+cam_id+'"}')  
            }
    catch(e){
        document.getElementById("test").innerHTML =e;       
    }
};
//Dates funtions
function dateToDDMMYY(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1; //Month from 0 to 11
    var y = date.getYear()-100;
    return (d <= 9 ? '0' + d : d) + '-' + (m<=9 ? '0' + m : m) + '-' + y;
}
//Dates funtions
function dateYYYYMMDD(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1; //Month from 0 to 11
    var y = date.getFullYear();
    return (y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d)) ;
}
////////// end securOS section //////////////////////
