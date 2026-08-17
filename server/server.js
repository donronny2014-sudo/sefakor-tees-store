const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// BASIC TEST ROUTE
// ===============================
app.get("/", (req, res) => {
  res.send("Sefakor Tees webhook server is running.");
});

// ===============================
// PAYSTACK WEBHOOK
// ===============================
// IMPORTANT: Paystack needs the raw request body
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

    try {
      const event = JSON.parse(req.body.toString());

      console.log("Paystack event:", event);

      const data = event.data || {};
      const metadata = data.metadata || {};

      console.log("========== SEFAKOR TEES ORDER ==========");
      console.log("Payment status:", data.status);
      console.log("Order ID:", metadata.order_id);
      console.log("Product:", metadata.product_name);
      console.log("Customer email:", metadata.customer_email || data.customer?.email);
      console.log("Amount:", data.amount / 100);
      console.log("Currency:", data.currency);
      console.log("Paystack reference:", data.reference);
      console.log("Payment channel:", data.channel);
      console.log("========================================");

      return res.sendStatus(200);
    } catch (error) {
      console.error("Paystack webhook error:", error);
      return res.sendStatus(400);
    }
  }
);

// ===============================
// NORMAL JSON REQUESTS
// ===============================
app.use(express.json());

// ===============================
// WHATSAPP WEBHOOK VERIFICATION
// ===============================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WhatsApp webhook verified successfully.");
    return res.status(200).send(challenge);
  }

  console.log("WhatsApp webhook verification failed.");
  return res.sendStatus(403);
});

// ===============================
// WHATSAPP WEBHOOK EVENTS
// ===============================
app.post("/webhook", (req, res) => {
  console.log("WhatsApp webhook received:");
  console.log(JSON.stringify(req.body, null, 2));

  // Always respond quickly to Meta
  res.sendStatus(200);
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`Sefakor Tees webhook server running on port ${PORT}`);
});
