const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);  // Initialize Stripe with your secret key
const userRouter = require('./routes/User');
const Payment = require('./models/Payment');
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify the webhook signature to ensure it's from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    console.log("Received Event:", event);

    // Acknowledge receipt of the webhook (Stripe will resend it if not acknowledged)
    res.status(200).send('Webhook received');

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('Payment Intent succeeded:', paymentIntent);

      // Check metadata from the payment intent itself
      const imei = paymentIntent.metadata?.imei;  // Get IMEI from metadata
      console.log('PaymentIntent Metadata:', paymentIntent.metadata);  // Log full metadata

      if (!imei) {
        console.error('IMEI not found in metadata');
        return;
      }

      console.log('IMEI from metadata:', imei);

      // Update the payment record in the database using the IMEI
      try {
        const payment = await Payment.findOne({ imei });

        if (!payment) {
          console.error('Payment record not found in database for IMEI:', imei);
          return;
        }

        // Update the payment status to 'paid' and give the device unlimited access
        payment.paymentStatus = 'paid';
        payment.hasUnlimitedAccess = true;
        payment.paymentDate = new Date();

        await payment.save();
        console.log(`Payment updated successfully for IMEI: ${imei}`);
      } catch (err) {
        console.error('Error updating payment record:', err);
      }
    }

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
});




app.use(express.json()); 

// Apply express.raw middleware only for the Stripe webhook route


// Routes
app.use("/user", userRouter);

const port = process.env.PORT || 7800;
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Database Connected Successfully"))
  .catch((err) => console.log("Error in connecting to DB", err));

app.listen(port, () => {
  try {
    console.log(`Server is running on port ${port}`);
  } catch (error) {
    console.error(`Error in running the server: ${error}`);
  }
});
