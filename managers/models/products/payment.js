const mongoose = require('mongoose');
const createdDate = new Date();
const ist = createdDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });

const paymentSchema = new mongoose.Schema({
    ledger_id : {
        type: String,
        required: true
    },
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    },
    order_id : {
        type: String,
        required: false
    } ,
    date : {
        type: String,
        required: true
    } ,
    amount : {
        type: String,
        required: true
    },
    payment_method : {
        type: String,
        required: true
    },
    created_date: {
        type: Date,
        default: Date.now,
    },
    updated_date: {
        type: Date,
        default: Date.now,
    }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;