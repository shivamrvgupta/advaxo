const mongoose = require('mongoose');



// Define user schema
const ledgerInventSchema = new mongoose.Schema({
    ledger_id :{
      type : String,
      required : true  
    },
    vendor_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
    },
    bill_no:{
        type: String,
        required: true
    },
    amount : {
        type: Number,
        required: true
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

const LedgerIventory = mongoose.model('LedgerInventory', ledgerInventSchema);
module.exports = LedgerIventory;
