const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { format, addDays, isSameISOWeek, getISOWeek } = require('date-fns');
const {generateAccessToken} = require('../middlewares/auth.middleware');
const models = require('../../../managers/models');
const currentDate = new Date();

const formattedDate = currentDate.toISOString().slice(0, 10); // Extract YYYY-MM-DD from ISO string

console.log(formattedDate); // 

// This would be your token blacklist storage
const options = { day: '2-digit', month: 'short', year: 'numeric' };


module.exports = {
    findtransactionLists: async (req, res) => {
        try {
          const user = req.user;      
          console.log(req.body)
          const data = req.body.amount;
      
          // Retrieve transactions where the bank is either the sender or receiver
          const transactions = await models.ProductModel.Transaction.find({
            type : "NET BANK" , available : data 
          })
      
          // Segregate transactions based on debit and credit for the bank
          res.send(transactions)
      
        } catch (err) {
          console.log(err)
          res.redirect('/admin/auth/all-banks?error=Transaction Lists failed');
        }
    },

    findAndUpdateTransaction : async (req, res) => {
        try {
          const user = req.user;      
          const data = req.body.transaction_id;
          const amount = req.body.amount;
      
          // Retrieve transactions where the bank is either the sender or receiver
          const transactions = await models.ProductModel.Transaction.findOne({
            _id : data
          })
          
          transactions.available = amount;

          await transactions.save();

          // Segregate transactions based on debit and credit for the bank
          res.send(transactions)
      
        } catch (err) {
          console.log(err)
          res.redirect('/admin/auth/all-banks?error=Transaction Lists failed');
        }
    },
} 

