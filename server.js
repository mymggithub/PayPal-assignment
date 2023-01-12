import "dotenv/config";
import express from "express";
import * as paypal from "./paypal-api.js";

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"))

app.get("/", async (req, res) => {
  const clientId = process.env.CLIENT_ID;
  try {
    const clientToken = await paypal.generateClientToken();
    res.render("checkout", { clientId, clientToken });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(3000)