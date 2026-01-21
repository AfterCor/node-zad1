const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const db = require("./db");
const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE"],
  })
);

app.use(express.json());
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
    if (err) {
      console.log("DB insert error:", err.code || err.message);
      return res.redirect("/table.html");
    }
    res.redirect("/table.html");
  });
});

app.get("/data", (req, res) => {
  db.query("SELECT * FROM submissions ORDER BY id DESC", (err, results) => {
    if (err) {
      console.log("DB read error:", err.code || err.message);
      return res.json(readJsonArray());
    }
    res.json(results);
  });
});

app.get("/json", (req, res) => {
  const data = readJsonArray();
  res.json(data);
});

const planFilePath = path.join(__dirname, "plan.json");

function makeId() {
  try {
    return require("crypto").randomUUID();
  } catch {
    return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
  }
}

function defaultPlan() {
  return [
    { id: makeId(), name: "Analiza matematyczna", durationMinutes: 90 },
    { id: makeId(), name: "Język angielski C1", durationMinutes: 60 },
    { id: makeId(), name: "Programowanie (JS)", durationMinutes: 120 },
    { id: makeId(), name: "Bazy danych", durationMinutes: 90 },
    { id: makeId(), name: "Sieci komputerowe", durationMinutes: 60 },
  ];
}

function readPlan() {
  if (!fs.existsSync(planFilePath)) {
    const init = defaultPlan();
    fs.writeFileSync(planFilePath, JSON.stringify(init, null, 2));
    return init;
  }
  const raw = fs.readFileSync(planFilePath, "utf8").trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function writePlan(items) {
  fs.writeFileSync(planFilePath, JSON.stringify(items, null, 2));
}

app.get("/api/plan", (req, res) => {
  res.json(readPlan());
});

app.post("/api/plan", (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const durationMinutes = Number(req.body.durationMinutes);

  if (!name) return res.status(400).json({ error: "Brak nazwy przedmiotu." });
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return res.status(400).json({ error: "Czas trwania musi być liczbą > 0." });
  }

  const plan = readPlan();
  const newItem = { id: makeId(), name, durationMinutes: Math.round(durationMinutes) };

  plan.push(newItem);
  writePlan(plan);

  res.status(201).json(newItem);
});

app.delete("/api/plan/:id", (req, res) => {
  const { id } = req.params;

  const plan = readPlan();
  const before = plan.length;
  const next = plan.filter((it) => it.id !== id);

  if (next.length === before) return res.status(404).json({ error: "Nie znaleziono elementu." });

  writePlan(next);
  res.json({ ok: true });
});

app.get("/api/plan/download", (req, res) => {
  readPlan();
  res.download(planFilePath, "plan.json");
});

app.get("/api/students", (req, res) => {
  db.query("SELECT * FROM submissions ORDER BY id DESC", (err, results) => {
    if (err) {
      console.log("DB read error:", err.code || err.message);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(results);
  });
});

app.post("/api/students", (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  const age = Number(req.body.age);
  const gender = String(req.body.gender ?? "").trim();

  if (!name || !email || !Number.isFinite(age) || age <= 0 || !gender) {
    return res.status(400).json({ error: "Niepoprawne dane." });
  }

  const sql = "INSERT INTO submissions (name, email, age, gender) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, email, age, gender], (err, result) => {
    if (err) {
      console.log("DB insert error:", err.code || err.message);
      return res.status(500).json({ error: "DB error" });
    }

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      age,
      gender,
    });
  });
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
