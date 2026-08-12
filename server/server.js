const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Paystack webhook server is running.");
});

app.post(
  "/paystack/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-paystack-signature"];

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    console.log("Paystack event:", event);

    res.sendStatus(200);
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
