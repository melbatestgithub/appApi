const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const User=require("../models/User")
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const path = require("path"); 

router.post("/payment/create-checkout-session", async (req, res) => {
  try {
    // const { userId } = req.body; 
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

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId; // Use metadata to identify the user
      
      console.log(`Payment successful for user: ${userId}`);
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

let userPaymentStatus = false;

router.get('/payment-status', (req, res) => {
  res.status(200).json({ hasPaid: userPaymentStatus })
});


router.get("/payment-success", async(req, res) => {
  // const { userId } = req.query;  
  // try {
  //   const user = await User.findById(userId);
  //   if (user) {
  //     res.status(200).json({ hasPaid: user.hasPaid });
  //   } else {
  //     res.status(404).json({ message: "User not found" });
  //   }
  // } catch (error) {
  //   res.status(500).send({ message: "Error fetching payment status", error });
  // }
  res.sendFile(path.join(__dirname, "../public", "payment-success.html"));
  
});


router.get("/payment-cancelled", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "payment-cancelled.html"));
});

router.post("/addUser",async(req,res)=>{
  try {
    const newUser= new User(req.body)
    await newUser.save()
    res.status(200).send({
      message:"User is Created Successfully",
      newUser
    })
    
  } catch (error) {
    res.status(500).send({
      message:"Internal Server Error is occured",
      error
    })
  }
})

router.get("/all",async(req,res)=>{
  try {
    const user=await User.find()
    res.status(200).send(user)
  } catch (error) {
    res.status(500).send("Error is occured in getting users")
  }
})


module.exports = router;
