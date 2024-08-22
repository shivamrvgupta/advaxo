const mongoose = require('mongoose');



// Define user schema
const transactionSchema = new mongoose.Schema({
    type : {
        type: String,
        required: true
    },
    ledger_id : {
        type: String,
        required: false
    },
    from : {
        type: String,
        required: true
    },
    to : {
        type: String,
        required: true
    },
    transaction_id:{
        type: String,
        required: true
    },
    credited : {
        type: Number,
        required: false,
        default: 0.0,
        set: function(value) {
            return parseFloat(value).toFixed(2);
        }
    },
    debited : {
        type: Number,
        required: true,
        default: 0.0,
        set: function(value) {
            return parseFloat(value).toFixed(2);
        }
    },
    status : {
        type : Boolean,
        default : true
    },
    date : {
        type: String,
    },
    created_date: {
        type:Date,
        default: Date.now
    },
    updated_date: {
        type:Date,
        default: Date.now
    }
  });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
