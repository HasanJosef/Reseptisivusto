const express = require("express");
const axios = require("axios");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

const API_BASE_URL = "https://www.themealdb.com/api/json/v1/1/";

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
  const { haku, ainesosa, kategoria } = req.query;

  try {
    let url;
    if (haku) {
      url = `${API_BASE_URL}search.php?s=${haku}`;
    } else if (ainesosa) {
      url = `${API_BASE_URL}filter.php?i=${ainesosa}`;
    } else if (kategoria) {
      url = `${API_BASE_URL}filter.php?c=${kategoria}`;
    } else {
      return res.status(400).send("Virheellinen pyyntö");
    }

    const vastaus = await axios.get(url);
    const reseptit = vastaus.data.meals || [];
    res.render("recipes", { reseptit });
  } catch (virhe) {
    res.status(500).send("Haku epäonnistui");
  }
});

app.get("/resepti/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const vastaus = await axios.get(`${API_BASE_URL}lookup.php?i=${id}`);
    const resepti = vastaus.data.meals[0];

    const ainekset = [];
    for (let i = 1; i <= 20; i++) {
      const aines = resepti[`strIngredient${i}`];
      const maara = resepti[`strMeasure${i}`];
      if (aines && aines.trim()) ainekset.push({ aines, maara });
    }

    res.render("recipe", {
      resepti: {
        ...resepti,
        ainekset,
      },
    });
  } catch (virhe) {
    res.status(404).send("Reseptiä ei löytynyt");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Palvelin käynnissä portissa ${PORT}`));
