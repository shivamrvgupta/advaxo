const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    bill_no :{
        type: String,
        required: true,
        default : 0
    },
    date : {
        type: String,
        required: true
    },
    gst : {
        type: String,
        required: false
    },
    vendor_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
    },
    payment_status: {
        type : String,
        default: "Unpaid",
    },
    grand_total : {
        type: Number,
        required: true,
        default: 0.00,
        set: function(value) {
          return parseFloat(value).toFixed(2);
        }
    },
    remaining_balance:{
        type: Number,
        default: 0.00,
        set: function(value) {
          return parseFloat(value).toFixed(2);
        }
    },
    created_date:{
        type: Date,
        default: Date.now
    },
    updated_date:{
        type: Date,
        default: Date.now
    }
});

const InventoryBill = mongoose.model('InventoryBill', inventorySchema);

module.exports = InventoryBill;