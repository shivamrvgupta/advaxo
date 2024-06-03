const mongoose = require('mongoose');
const createdDate = new Date();
const ist = createdDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });

const inventPaySchema = new mongoose.Schema({
    bill_no:{
        type: String,
        required: true
    },
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

const InventoryPay = mongoose.model('InventoryPay', inventPaySchema);

module.exports = InventoryPay;