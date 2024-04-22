const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
var port = 8989;

exports.start = () => {
    const app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(cors());
    app.use(routes);

    app.listen(port, () => {
        console.log("Middle API ON in: " + port);
    });
};
