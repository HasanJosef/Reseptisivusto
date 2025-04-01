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

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
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

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

app.use((req, res, next) => {
  const publicRoutes = ["/login", "/register"];
  if (!publicRoutes.includes(req.path) && !req.session.user) {
    return res.redirect("/login");
  }
  next();
});

app.post("/register", async (req, res) => {
  const { email, username, password } = req.body;

  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err) {
      console.error("Tietokantavirhe SELECT:", err);
      return res.status(500).send("Tietokantavirhe");
    }
    if (results.length > 0) return res.send("Käyttäjänimi on jo olemassa.");

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
      [email, username, hashedPassword],
      (err, result) => {
        if (err) {
          console.error("Tietokantavirhe INSERT:", err);
          return res.status(400).json({ message: "Virhe rekisteröinnissä" });
        }

        req.session.user = username;
        res.redirect("/");
      }
    );
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("login", { virhe: "Käyttäjänimi ja salasana ovat pakollisia." });
  }

  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.render("login", { virhe: "Virheelliset tunnukset." });
    }

    const dbUser = results[0];
    const isMatch = await bcrypt.compare(password, dbUser.password);

    if (!isMatch) {
      return res.render("login", { virhe: "Virheelliset tunnukset." });
    }

    req.session.user = username;
    res.redirect("/");
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Virhe uloskirjautumisessa");
    res.redirect("/login");
  });
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
    let reseptit = vastaus.data.meals;

    if (!reseptit && haku) {
      const ingredientResponse = await axios.get(`${API_BASE_URL}filter.php?i=${haku}`);
      reseptit = ingredientResponse.data.meals;
    }

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
  res.render("login", { virhe: null });
});

app.listen(3000, () => console.log("Server running on port 3000"));
