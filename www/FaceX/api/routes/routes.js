const router = require('express').Router();
var controller = require('../controllers/controller');

router.get("/dayrecognitions", (req, res)=>{
    return controller.todayrecognitions(req, res);
});

router.get("/person/:id", (req, res)=>{
    return controller.person(req, res);
});

router.post("/recognitions", (req, res)=>{
    return controller.getRecognitions(req, res);
});

module.exports = router;