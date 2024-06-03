const mongoose = require('mongoose');
const createdDate = new Date();
const ist = createdDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });

const moneySchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    } ,
    amount :{
        type: String,
        default : "25000.00"
    },
    date :{
        type: String,
        default : "DD-MM-YYYY"
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

const Money = mongoose.model('Money', moneySchema);

module.exports = Money;