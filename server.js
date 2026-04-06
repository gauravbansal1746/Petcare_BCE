require("dotenv").config();

var app    = require("./app");
var logger = require("./config/logger");

require("./config/db");

var port = parseInt(process.env.PORT, 10);
if (isNaN(port) || port < 1) port = 3000;

var server = app.listen(port, function () {
    logger.info("Server started on port " + port, { meta: { port: port, env: process.env.NODE_ENV || "development" } });
});

server.on("error", function (err) {
    if (err.code === "EADDRINUSE") {
        logger.error("Port already in use", {
            meta: {
                port: port,
                hint: "Stop the other Node process (or any app on this port), or set PORT in .env to e.g. 3001"
            }
        });
        console.error(
            "\nPort " + port + " is already in use.\n" +
            "Fix: close the other terminal running `npm start`, or run: netstat -ano | findstr :" + port + "\n" +
            "Then stop that PID: Stop-Process -Id <PID> -Force\n" +
            "Or set PORT=3001 in your .env file.\n"
        );
    } else {
        logger.error("Server listen error", { meta: { message: err.message, code: err.code } });
    }
    process.exit(1);
});
