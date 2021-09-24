var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
     name:'SecurOS Hikvision Plugin',
     description: 'SecurOS Plugin to Hikvision Thermal Analytics V2.0.0',
     script: 'index.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('uninstall',function(){
	 console.log("Removing Service...")
     svc.stop();
});

svc.uninstall();