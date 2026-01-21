const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "zad1",
  port: 3306,
});

db.on("error", (err) => {
  console.log("DB error:", err.code || err.message);
});

db.connect((err) => {
  if (err) {
    console.log("DB connection failed:", err.code || err.message);
  } else {
    console.log("DB connected");
  }
});

module.exports = db;
