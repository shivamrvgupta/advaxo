const mongoose = require('mongoose');
const createdDate = new Date();
const ist = createdDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });

const generalExpenseSchema = new mongoose.Schema({
    order_id : {
        type: String,
    },
    transaction_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Transaction',
        required: false
    },
    expense_type : {
        type: String,
        required: true
    },
    client_name : {
        type: String,
    },
    item_name : {
        type: String,
    },
    description :{
        type: String,
    },
    date : {
        type: Date,
    },
    mode_of_payment: {
        type: String,
    },
    payment_status: {
        type: Boolean,
        default: true,
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

const GenralExpense = mongoose.model('General Expense', generalExpenseSchema);

module.exports = GenralExpense;