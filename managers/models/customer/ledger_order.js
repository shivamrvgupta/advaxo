const mongoose = require('mongoose');



// Define user schema
const ledgerSchema = new mongoose.Schema({
    ledger_id :{
        type : String,
        required : true  
    },
    client_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
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

const LedgerOrder = mongoose.model('LedgerOrder', ledgerSchema);
module.exports = LedgerOrder;
