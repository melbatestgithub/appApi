const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  imei: {
    type: String,
    required: true,
    unique: true, // Ensure each IMEI is unique
  },
  trialCount: {
    type: Number,
    default: 0, // Track how many trials the device has used
  },
  hasUnlimitedAccess: {
    type: Boolean,
    default: false, // Track if the device has paid and has unlimited access
  },
  status: {
    type: String,
    enum: ['Not Paid', 'paid', 'failed'],
    default: 'pending',
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
