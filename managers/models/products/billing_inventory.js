const mongoose = require('mongoose');

const billInventorySchema = new mongoose.Schema({
    unit :{
        type: String,
        required: true
    },
    bill_no :{
        type: String,
        required: true,
        default : 0
    },
    name :{
        type: String,
        required: true
    },
    width :{
        type: String,
    },
    height :{
        type: String,
    },
    unit :{
        type: String,
        required: true
    },
    quantity :{
        type: String,
        default: 0,
    },
    unit :{
        type: String,
        required: true
    },
    area :{
        type: String,
        default: 0,
    },
    rate : {
        type: String,
        required: true
    },
    amount : {
        type: String,
        required: true
    },    
    date:{
        type: Date,
        default: Date.now
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

const BillProduct = mongoose.model('BillProduct', billInventorySchema);

module.exports = BillProduct;
