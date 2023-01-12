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
    const currency = paypal.currency;
    res.render("checkout", { clientId, clientToken, currency });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// create order
app.post("/api/orders", async (req, res) => {
  try {
    const order = await paypal.createOrder();
    res.json(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// capture payment
app.post("/api/orders/:orderID/capture", async (req, res) => {
  const { orderID } = req.params;
  try {
    const captureData = await paypal.capturePayment(orderID);
    res.json(captureData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/thank_you/:transactionID/", async (req, res) => {
  const { transactionID } = req.params;
  try {
    res.render("thank_you", { transactionID });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(3000)