
socket.on('comments', function (comments) {
    //console.log("coments... //////////////////////////////////////////")
    update_comments(comments)    
})

function update_comments(comments)
{
    var rows = document.getElementById('inbox_chat');
    rows.innerHTML = '';

    for (var i in comments)
    {
        //console.log(comments[i].comment, comments)
        var mod = i%2

        var messages = mod ? '<div class="chat_list active_chat">' : '<div class="chat_list active_chat even">'
        messages +='<div class="chat_people">'
        messages +='<div class="chat_ib">'
        messages +='<h5>'+comments[i].user+'<span class="chat_date">'+ new Date(comments[i].date).toLocaleDateString("pt-br", options2)+'</span></h5>'
        messages +='<p>'+comments[i].comment+'</p>'
        messages +=' </div>'
        messages +='</div>'
        messages +='</div>'
        
   
    rows.innerHTML += messages;
    
    }
    rows.scrollTop = rows.scrollHeight; 
}