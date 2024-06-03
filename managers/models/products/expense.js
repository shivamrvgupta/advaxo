const mongoose = require('mongoose');
const createdDate = new Date();
const ist = createdDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });

const expenseSchema = new mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    },
    description : {
        type: String,
    },
    product_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    },
    order_id : {
        type: String,
        required: true
    } ,
    name : {
        type: String,
        required: true
    } ,
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
    amount : {
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

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;