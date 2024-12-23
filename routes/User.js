const express = require("express");
const router = express.Router();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const path = require("path"); 
const Payment=require("../models/Payment")

router.post("/payment/create-checkout-session", async (req, res) => {
  const { imei } = req.body;  // Get IMEI from body

  if (!imei) {
    return res.status(400).send({ message: "IMEI is required" });
  }

  try {
    // Check payment and trial count for the device with the given IMEI
    let payment = await Payment.findOne({ imei });
    if (!payment) {
      // If no payment record exists, create a new one with trial count 0
      // payment = new Payment({ imei, trialCount: 0 });
    }

    // If the device has used all 3 trials, proceed to payment
    if (payment.trialCount >= 3) {
      // Create a Stripe checkout session for payment
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
        success_url: `${req.protocol}://${req.get("host")}/user/payment-success?imei=${imei}`,
        cancel_url: `${req.protocol}://${req.get("host")}/user/payment-cancelled?imei=${imei}`,
        metadata: {
          imei: imei.toString(), // Store IMEI in metadata to link with payment
        },
      });

      // Log session metadata for debugging
      console.log("Checkout Session created:", session.id);
      console.log('Session metadata:', session.metadata);

      // Create a pending payment record in MongoDB
      payment.status = 'pending';
      await payment.save();

      return res.json({ url: session.url });  // Redirect to Stripe Checkout session
    }

    // Increment the trial count and allow access for trial use
    payment.trialCount += 1;
    await payment.save();

    return res.json({ message: "Access granted for trial use" });

  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).send({ message: "Error creating checkout session" });
  }
});


// Endpoint to check payment status and trial count
router.get("/check-status", async (req, res) => {
  const { imei } = req.query;  // Get IMEI from the query string
  
  if (!imei) {
    return res.status(400).send({ message: "IMEI is required" });
  }

  try {
    // Find the payment record based on IMEI
    const payment = await Payment.findOne({ imei });

    if (!payment) {
      return res.status(404).send({ message: "No payment record found for this IMEI" });
    }

    // Respond with the payment status and trial count
    res.status(200).send({
      hasUnlimitedAccess: payment.hasUnlimitedAccess,
      trialCount: payment.trialCount,
      status: payment.status,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).send({ message: "Error checking payment status" });
  }
});

router.get('/get-trial-count', async (req, res) => {
  const { imei } = req.query;

  if (!imei) {
    return res.status(400).json({ message: 'IMEI is required.' });
  }

  try {
    // Check if the device exists
    let device = await Payment.findOne({ imei });

    if (!device) {
      // Create the device with default values if it doesn't exist
      device = await Payment.create({
        imei,
        trialCount: 1, // Initial trial count
        hasUnlimitedAccess: false, // Default value
        status: 'Not Paid', // Default value
        paymentDate: new Date(), // Current date
      });

      return res.status(200).json({ trialCount: device.trialCount });
    }

    // If the device exists, return its trial count
    res.status(200).json({ trialCount: device.trialCount });
  } catch (error) {
    console.error('Error fetching or creating device:', error);
    res.status(500).json({ message: 'Error fetching trial count', error });
  }
});




router.post('/update-trial-count', async (req, res) => {
  const { imei, trialCount } = req.body;
  try {
    const user = await Payment.findOne({ imei });
    if (user) {
      user.trialCount = trialCount;
      await user.save();
      res.status(200).send({ message: 'Trial count updated successfully.' });
    } else {
      res.status(404).send({ message: 'User not found.' });
    }
  } catch (err) {
    res.status(500).send({ message: 'Error updating trial count', error: err });
  }
});

router.get("/get-status",async(req,res)=>{
  const {imei}=req.query
  try {
    const User=await Payment.findOne({imei})
    res.status(200).send(User)
    
  } catch (error) {
    res.status(500).send("Internal Server Error is Occured")
  }
})



router.get("/payment-success", async (req, res) => {
  const { imei } = req.query; // Get IMEI from query string
  if (imei) {
    // You can update the user's access status based on IMEI here
    console.log(`Payment successful for IMEI: ${imei}`);

    const payment = await Payment.findOne({ imei });

    // Update the payment status
    payment.status = 'paid';
    payment.hasUnlimitedAccess = true;
    payment.paymentDate = new Date();
    await payment.save()
    console.log(payment)
  }

  res.sendFile(path.join(__dirname, "../public", "payment-success.html"));
});

router.get("/payment-cancelled", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "payment-cancelled.html"));
});


module.exports = router;
