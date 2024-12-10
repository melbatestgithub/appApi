const express = require("express");
const router = express.Router();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
router.post("/payment/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Unlimited Access to the Fact Checker App",
            },
            unit_amount: 1800, // $18.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.protocol}://${req.get("host")}/user/payment-success`,
      cancel_url: `${req.protocol}://${req.get("host")}/user/payment-cancelled`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).send({ message: "Error creating checkout session" });
  }
});


router.get('/payment/status/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({ status: session.payment_status });
  } catch (error) {
    res.status(500).send({ error: 'Error retrieving payment status' });
  }
});


// Payment success route
router.get("/payment-success", (req, res) => {
  res.send({ message: "Payment successful! You now have unlimited access." });
});

// Payment cancelled route
router.get("/payment-cancelled", (req, res) => {
  res.send({ message: "We would like to provide you with service but we ask that you pay a time lifetime fee of $18 on the app." });
});

module.exports = router;
