const mongoose = require('mongoose');
const createdDate = new Date();
const ist = createdDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });

const orderSchema = new mongoose.Schema({
    order_id:{
        type : String,
        required : true
    },
    client_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    },
    created_by: {
        type: String,
        default : "Advaxo Admin",
    },
    order_date: {
        type: String,
        required: true,
    },
    gst: {
        type: Boolean,
        required: true,
        default: false
    },
    status : {
        type: String,
        default: "Pending",
    },
    delivery_date: {
        type: String,
        required: true,
    },
    payment_method: {
        type: String,
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
    client_balance : {
        type: Number,
        default: 0.00,
        set: function(value) {
          return parseFloat(value).toFixed(2);
        }
    },
    delivery_date : {
        type: String,
        required: true,
    },
    is_delivered :{
        type: Boolean,
        default: false,
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

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;