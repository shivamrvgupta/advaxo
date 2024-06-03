const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
    area :{
        type: String,
        default: 0,
    },
    rate : {
        type: String,
        required: true
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

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
