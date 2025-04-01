const express = require("express");
const axios = require("axios");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const session = require("express-session");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session setup
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  res.locals.currentRoute = req.path;
  next();
});

const API_BASE_URL = "https://www.themealdb.com/api/json/v1/1/";
const SECRET_KEY = "salainenavain";

// Yhdistetään MySQL-tietokantaan
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Vaihda omaan käyttäjään
  password: "",
  database: "respetisivu",
});

db.connect((err) => {
  if (err) {
    console.error("Tietokantavirhe:", err);
    return;
  }
  console.log("Yhdistetty MySQL-tietokantaan!");
});

// Middleware to check if the user is logged in
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// Apply the middleware to all routes except login and register
app.use((req, res, next) => {
  const publicRoutes = ["/login", "/register"];
  if (!publicRoutes.includes(req.path) && !req.session.user) {
    return res.redirect("/login");
  }
  next();
});

// Rekisteröinti
app.post("/register", async (req, res) => {
  const { email, username, password } = req.body;

  // Tarkistetaan, onko käyttäjänimi jo olemassa tietokannassa
  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err) {
      console.error("Tietokantavirhe SELECT:", err); // Log SELECT query error
      return res.status(500).send("Tietokantavirhe");
    }
    if (results.length > 0) return res.send("Käyttäjänimi on jo olemassa.");

    // Salasanan hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tallennetaan käyttäjä tietokantaan
    db.query(
      "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
      [email, username, hashedPassword],
      (err, result) => {
        if (err) {
          console.error("Tietokantavirhe INSERT:", err); // Log INSERT query error
          return res.status(400).json({ message: "Virhe rekisteröinnissä" });
        }

        // Kirjataan käyttäjä sisään ja ohjataan kotisivulle
        req.session.user = username;
        res.redirect("/");
      }
    );
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

// Kirjautuminen
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Tarkistetaan, onko käyttäjä olemassa tietokannassa
  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ message: "Virheelliset tunnukset" });

    const dbUser = results[0];
    const isMatch = await bcrypt.compare(password, dbUser.password);

    if (!isMatch) return res.status(401).json({ message: "Virheelliset tunnukset" });

    // Kirjataan käyttäjä sisään ja ohjataan kotisivulle
    req.session.user = username;
    res.redirect("/");
  });
});

// Kirjautuminen ulos
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Virhe uloskirjautumisessa");
    res.redirect("/login");
  });
});

// Token-tarkistus middleware
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "Access denied" });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

// Suojattu reitti
app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: `Welcome, user ${req.user.id}!` });
});

app.get("/", async (req, res) => {
  try {
    const vastaus = await axios.get(`${API_BASE_URL}categories.php`);
    const kategoriat = vastaus.data.categories;
    res.render("home", { kategoriat });
  } catch (virhe) {
    res.status(500).send("Virhe haettaessa kategorioita");
  }
});

app.get("/reseptit", async (req, res) => {
  const { haku, kategoria } = req.query;

  try {
    let url = `${API_BASE_URL}search.php?s=`;
    if (haku) {
      url += haku;
    } else if (kategoria) {
      url = `${API_BASE_URL}filter.php?c=${kategoria}`;
    }

    const vastaus = await axios.get(url);
    const reseptit = vastaus.data.meals;

    res.render("recipes", { reseptit });
  } catch (virhe) {
    console.error("Virhe haettaessa reseptejä:", virhe);
    res.status(500).send("Virhe haettaessa reseptejä");
  }
});

app.get("/resepti/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const vastaus = await axios.get(`${API_BASE_URL}lookup.php?i=${id}`);
    const meal = vastaus.data.meals ? vastaus.data.meals[0] : null;

    if (!meal) {
      return res.status(404).render("recipe", { resepti: null });
    }

    // Extract ingredients and measurements
    const ainekset = [];
    for (let i = 1; i <= 20; i++) {
      const aines = meal[`strIngredient${i}`];
      const maara = meal[`strMeasure${i}`];
      if (aines && aines.trim()) {
        ainekset.push({ aines, maara });
      }
    }

    const resepti = {
      ...meal,
      ainekset,
    };

    res.render("recipe", { resepti });
  } catch (virhe) {
    console.error("Virhe haettaessa reseptiä:", virhe);
    res.status(500).send("Virhe haettaessa reseptiä");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.listen(3000, () => console.log("Server running on port 3000"));
