const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    unit :{
        type: String,
        required: true
    },
    product_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Product',
    },
    quantity :{
        type: Number,
            required: true,
            default: 0.00,
            set: function(value) {
              return parseFloat(value).toFixed(2);
          }
    },
    unit :{
        type: String,
        required: true
    },
    area :{
        type: Number,
            required: true,
            default: 0.00,
            set: function(value) {
              return parseFloat(value).toFixed(2);
            }
    },
    rate : {
            type: Number,
            required: true,
            default: 0.00,
            set: function(value) {
              return parseFloat(value).toFixed(2);
          }
    },
    amount : {
        type: Number,
            required: true,
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

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
