require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
var mysql = require("mysql");

var conn = mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "petcare"
});

function run(sql, cb) {
    conn.query(sql, function (err, rows) {
        if (err) return cb(err);
        cb(null, rows);
    });
}

run("SHOW COLUMNS FROM clients", function (e1, c1) {
    if (e1) throw e1;
    console.log("CLIENT_COLUMNS");
    console.log(c1);
    run("SHOW COLUMNS FROM caretakers", function (e2, c2) {
        if (e2) throw e2;
        console.log("CARETAKER_COLUMNS");
        console.log(c2);
        run("SELECT * FROM clients ORDER BY email LIMIT 5", function (e3, r1) {
            if (e3) throw e3;
            console.log("CLIENT_SAMPLE_ROWS");
            console.log(r1);
            run("SELECT * FROM caretakers ORDER BY email LIMIT 5", function (e4, r2) {
                if (e4) throw e4;
                console.log("CARETAKER_SAMPLE_ROWS");
                console.log(r2);
                conn.end();
            });
        });
    });
});
