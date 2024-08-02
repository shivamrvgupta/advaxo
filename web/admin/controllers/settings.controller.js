const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { format, addDays, isSameISOWeek, getISOWeek } = require('date-fns');
const {generateAccessToken} = require('../middlewares/auth.middleware');
const models = require('../../../managers/models');
const {DataHelper} = require('../../../managers/helpers');
const path = require('path');
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
            type : "IDFC SWATI" , available : data 
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

    getMultiData : async (req, res) => {
      const user = req.user;

      if (!user) {
        return res.render('a-login', {
          title: "Advaxo",
          error: "User Not Found"
        });
      }
      
      res.render('admin/settings/multi-data', {
        title: "Advaxo",
        error: "Multi Data",
        user : user
      });
    },

    postMultiData : async (req, res) => {
      console.log('Request Body:', req.body);
      console.log('Request File:', req.file);
    
      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }
    
      const filePath = path.join(__dirname, '../../../src/uploads/default/default', req.file.filename);
      const ext = path.extname(req.file.originalname);
    
      try {
        if (ext === '.csv') {
          await DataHelper.handleCSV(filePath);
        } else if (ext === '.xls' || ext === '.xlsx') {
          await DataHelper.handleXLS(filePath);
        } else {
          return res.status(400).json({ error: 'Invalid file type' });
        }
        res.json({ message: 'Data successfully inserted' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
} 

