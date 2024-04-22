class AlertMessage extends EventTarget {

    

alertMessage(msg, type) {
    console.log('alertMessage')
    var box = document.getElementById('alertMessage').parentElement
    switch (type) {
        case 'danger':
            box.style.backgroundColor = '#ff4a3d'
            box.innerHTML = `
            <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span> 
            <div id="alertMessage">
            ${msg}.
            </div> `
            break
        case 'info':
            box.style.backgroundColor = '#2969bc'
            box.innerHTML = `
            <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span> 
            <div id="alertMessage">
            ${msg}
            </div> `
            break
        case 'success':
            box.style.backgroundColor = '#2eb052'
            box.innerHTML = `
            <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span> 
            <div id="alertMessage">
            ${msg}.
            </div> `
            break
        case 'confirm':
            box.style.backgroundColor = '#2969bc'
            box.innerHTML = `
            <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span> 
            <div id="alertMessage">
            ${msg}
            <div id="buttons" class="text-right"> </div>
            <button type="button" onclick="alertMessage.check()" class="btn btn-success">Sim</button>
            <button type="button" onclick="alertMessage.cancel()" class="btn btn-danger">Não</button>
            </div> `
            break
    }

    box.style.display = 'block'
}

 check(){
    this.dispatchEvent(new Event('check'));
}
 cancel(){
    this.dispatchEvent(new Event('cancel'));
}

}