const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const dataFilePath = path.join(__dirname, "data.json");

function readJsonArray() {
    if (!fs.existsSync(dataFilePath)) return [];
    const raw = fs.readFileSync(dataFilePath, "utf8").trim();
    if (!raw) return [];
    return JSON.parse(raw);
}

function writeJsonArray(arr) {
    fs.writeFileSync(dataFilePath, JSON.stringify(arr, null, 2));
}

app.post("/submit", (req, res) => {
    const { name, email, age, gender } = req.body;

    const record = { name, email, age: Number(age), gender };

    const data = readJsonArray();
    data.push(record);
    writeJsonArray(data);

    const sql = "INSERT INTO submissions (name, email, age, gender) VALUES (?, ?, ?, ?)";
    db.query(sql, [record.name, record.email, record.age, record.gender], (err) => {
        if (err) return res.status(500).send("DB error");
        res.redirect("/table.html");
    });
});

app.get("/data", (req, res) => {
    db.query("SELECT * FROM submissions ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.json(results);
    });
});

app.get("/json", (req, res) => {
    const data = readJsonArray();
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
