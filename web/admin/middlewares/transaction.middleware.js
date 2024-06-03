const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { format, addDays, isSameISOWeek, getISOWeek } = require('date-fns');
const {generateAccessToken} = require('./auth.middleware');
const models = require('../../../managers/models');
const { urlencoded } = require('body-parser');

// This would be your token blacklist storage
const options = { day: '2-digit', month: 'short', year: 'numeric' };
const currentDate = new Date();

const formattedDate = currentDate.toISOString().slice(0, 10); // Extract YYYY-MM-DD from ISO string

console.log(formattedDate); // Output the formatted date

module.exports = {

    //Debit Transaction 
    debit : async (data) => {
        console.log(data);

        const money = await models.ProductModel.Bank.findOne({ name : data.from_method });

        console.log(money);

        money.amount = (Number(money.amount) + Number(data.amount)) + Number(data.total_amount);
        // console.log(money.amount);
        console.log((Number(money.amount) + Number(data.amount)));
        console.log((Number(money.amount) + Number(data.amount)) - Number(data.total_amount));
        // console.log(data.amount);
        // console.log(data.total_amount);
        await money.save();

        console.log("New ---- ",money.amount);
        const debitTransactionData = {
            type: data.from_method, // You can adjust the type based on your requirements
            from: data.type,
            to: data.for,
            transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
            debited: data.difference,
            credited: 0.0,
            available: Number(money.amount),
            date: formattedDate
          }; 

        console.log(debitTransactionData)
        const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
        await debitTransaction.save();

        return true;
    },

    //Credit Transaction
    credit : async (data) => {
        console.log(data);

        const money = await models.ProductModel.Bank.find({ name : data.from_method });

        console.log(money);

        money.amount = Number(money.amount) + Number(data.total_amount);

        await money.save();

        const creditTransactionData = {
            type: data.method, // You can adjust the type based on your requirements
            from: data.type,
            to: data.for,
            transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
            debited: 0.0,
            credited: data.difference,
            available: Number(money.amount),
            date: formattedDate
          };

        const creditTransaction = new models.ProductModel.Transaction(creditTransactionData);
        await creditTransaction.save();

        return true;

    }

}

