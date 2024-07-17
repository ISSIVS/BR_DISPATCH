const data = require('../getDataFromFaceX');
var formidable = require('formidable');
const fs = require('fs');

exports.todayrecognitions = async (req, res) => {
  const payload = await data.getTodayRecognitions();

  try {
    res.status(200);
    res.json(payload);    

  } catch (err) {
    res.status(500);
    res.json({ message: 'Internal server error.' });
  }  
}

exports.person = async (req, res) => {
  const payload = await data.getPerson(req.params.id);

  try {  
    res.status(200);
    res.json(payload);

  } catch (err) {
      res.status(500);
      res.json({ message: 'Internal server error.' });
  }  
}

exports.getRecognitions = async (req, res) => {
  const payload = await data.getRecognitions(req.body);
  
  try {  
    res.status(200);
    res.json(payload);

  } catch (err) {
      res.status(500);
      res.json({ message: 'Internal server error.' });
  }  
}
