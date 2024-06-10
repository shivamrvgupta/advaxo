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

  // Verify OTP API
    getLogin : async (req, res) => {
      try{
        res.render('a-login',{
          title: "admin" ,
          error: "Welcome to Login"
        })
      }catch(err){
        res.render('a-login',{
          title: "admin" ,
          error: err
        })
      }
    },

  // User Login API
    verifyLogin : async (req, res) => {
      const loginData = {
        email: req.body.email,
        password: req.body.password,
        remember: req.body.remember,
      };

      console.log(loginData)
      try {
          // Check if the mobile number exists in the database
          const userExists = await models.CustomerModel.User.findOne({ email: loginData.email });

          console.log(userExists)

          if (!userExists) {
              return res.redirect(`/admin/auth/login?error=User Not Found${encodeURIComponent(loginData.email)}`);
          }

          // Generate and send OTP
          const isPasswordValid = await bcrypt.compare(loginData.password, userExists.password);

          if (!isPasswordValid) {
              return res.redirect(`/admin/auth/login?error=Invalid email or password&email=${encodeURIComponent(loginData.email)}`);
          }

          const token = generateAccessToken(userExists);
          
          //  Set the token as a cookie or in the response body, depending on your preference
          if (loginData.remember) {
            res.cookie('jwt',  token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpOnly: true }); 
          } else {
            res.cookie('jwt', token, { httpOnly: true });
          }
          res.return = token;
          
          return res.redirect('/admin/auth/dashboard');
    
      } catch (error) {
        console.error('Error during login:', error);
        return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ status: false, status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR, message: MessageConstants.INTERNAL_SERVER_ERROR, data: {} });
      }
    },
  
  // User Dashboard API
    getdashboard : async (req, res) => {
      const user = req.user;
      if (!user) {
        res.redirect('/admin/auth/login');
      }

      const expense = await models.ProductModel.Expense.find();
      const totalExpense = (expense.reduce((sum, expense) => parseFloat(sum) + parseFloat(expense.amount), 0)).toFixed(2);
      
      const orders = await models.ProductModel.Order.find();
      const totalOrder = (orders.reduce((sum, orders) => parseFloat(sum) + parseFloat(orders.grand_total), 0)).toFixed(2);
      const totalRemainingBalance = (orders.reduce((sum, orders) => parseFloat(sum) + parseFloat(orders.remaining_balance), 0)).toFixed(2);

      // Payments
      const cash_payments = await models.ProductModel.Payment.find({payment_method: "CASH"});
      const idfc_sam = await models.ProductModel.Payment.find({payment_method: "IDFC SAM"});
      const idfc_swati = await models.ProductModel.Payment.find({payment_method: "IDFC SWATI"});
      const netbanking = await models.ProductModel.Payment.find({payment_method: "NET BANK"});

      const totalCash = (cash_payments.reduce((sum, cash_payments) => parseFloat(sum) + parseFloat(cash_payments.amount), 0)).toFixed(2);
      console.log("Total Cash PAYMENT",totalCash);
      const totalIdfcSam = (idfc_sam.reduce((sum, idfc_sam) => parseFloat(sum) + parseFloat(idfc_sam.amount), 0)).toFixed(2); 
      console.log("Total IDFC SAM",totalIdfcSam);
      const totalIdfcSwati = (idfc_swati.reduce((sum, idfc_swati) => parseFloat(sum) + parseFloat(idfc_swati.amount), 0)).toFixed(2);
      console.log("Total IDFC SWATI",totalIdfcSwati);
      const totalNetBank = (netbanking.reduce((sum, netbanking) => parseFloat(sum) + parseFloat(netbanking.amount), 0)).toFixed(2);
      console.log("Total Netbanking",totalNetBank);
      const totalClientBalance = totalOrder - totalExpense;
      console.log("Total Client Balance",totalClientBalance);
      
      // Other Expenses
      const other_expense_unpaid = await models.ProductModel.GenralExpense.find({mode_of_payment: "UNPAID"});
      const otherExpense_order = await models.ProductModel.GenralExpense.find({expense_type: "Order"});

      const totalOtherUnpaid = (other_expense_unpaid.reduce((sum, other_expense_unpaid) => parseFloat(sum) + parseFloat(other_expense_unpaid.amount), 0)).toFixed(2);
      console.log("Total Other Unpaid",totalOtherUnpaid);
      const OrderOther = (otherExpense_order.reduce((sum, otherExpense_order) => parseFloat(sum) + parseFloat(otherExpense_order.amount), 0)).toFixed(2);
      console.log("Total Other Order",OrderOther);


      
      const inventory = await models.ProductModel.InventoryBill.find({});
      console.log(inventory);
      const billed_products = (inventory.reduce((sum, inventory) => parseFloat(sum) + parseFloat(inventory.grand_total), 0)).toFixed(2);
      const remaining_balance = (inventory.reduce((sum, inventory) => parseFloat(sum) + parseFloat(inventory.remaining_balance), 0)).toFixed(2);
      const paid_products = billed_products - remaining_balance;
      const other_expense = await models.ProductModel.GenralExpense.find({mode_of_payment : "Unpaid" , expense_type : {$ne : "Order"}});
      const all_expense = await models.ProductModel.GenralExpense.find({expense_type : {$ne : "Order"}});
      console.log(other_expense);
      console.log(all_expense);
      const unpaid_expenses = (other_expense.reduce((sum, other_expense) => parseFloat(sum) + parseFloat(other_expense.amount), 0)).toFixed(2);
      const billed_expenses = (all_expense.reduce((sum, all_expense) => parseFloat(sum) + parseFloat(all_expense.amount), 0)).toFixed(2);

      const totalExpenses = parseFloat(totalExpense) + parseFloat(OrderOther);
      const totalProfit = totalClientBalance - OrderOther;
      console.log("Total Profit", totalProfit);
      const paid_expenses = billed_expenses - unpaid_expenses;  
      const cash = await models.ProductModel.Bank.findOne({name : "CASH"}) || 0.0;
      const sam = await models.ProductModel.Bank.findOne({name : "IDFC SAM"}) || 0.0;
      const swati = await models.ProductModel.Bank.findOne({name : "IDFC SWATI"}) || 0.0;
      const net = await models.ProductModel.Bank.findOne({name : "NET BANK"}) || 0.0;

      console.log("Total Expense Amount ------------- ", totalExpense);
      console.log("Total Billing Amount ------------- ", totalOrder);
      console.log("Total Client Amount ------------- ", totalClientBalance);
      console.log("Total Remaining Amount ------------- ", totalRemainingBalance);
      console.log("Total Cash Amount ------------- ", cash);
      console.log("Total IDFC SAM Amount ------------- ", sam);
      console.log("Total IDFC SWATI Amount ------------- ", swati);
      console.log("Total Netbanking Amount ------------- ", net);
      console.log("Total Billed Products ------------- ", billed_products);
      console.log("Total Paid Products ------------- ", paid_products);
      console.log("Total Unpaid Products ------------- ", remaining_balance);
      console.log("Total Unpaid Expenses ------------- ", unpaid_expenses);


      res.render('admin/dashboard', { options,user: user, billed_products,paid_expenses,paid_products,totalExpenses,totalProfit,totalExpense, totalOrder, totalClientBalance, totalRemainingBalance, remaining_balance, unpaid_expenses , cash, sam, swati, net ,error: "Welcome to Dashboard" });
    },

    getBank : async (req, res) => {
      try{
        const user = req.user;

        if (!user) {
          res.redirect('/admin/auth/login');
        }

        const banks = await models.ProductModel.Bank.find({});

        res.render('admin/banks/allBanks', { banks,options,user: user, error: "Add Bank Opening Data" });

      }catch(error){
        console.error('Error during getBank:', error);
        res.redirect(`/admin/auth/dashboard?error=${error}`);
      }
    },
    getAddBank : async (req, res) => {
      try{
        const user = req.user;

        if (!user) {
          res.redirect('/admin/auth/login');
        }

        res.render('admin/banks/add_data', { user: user, error: "Add Bank Data" });

      }catch(error){
        console.error('Error during getAddBank:', error);
        res.redirect(`/admin/auth/dashboard?error=${error}`);
      }
    },
    postBankData: async (req, res) => {
      try {
          const user = req.user;
  
          if (!user) {
              res.redirect('/admin/auth/login');
              return; // Make sure to return after redirecting
          }
  
          const server = req.body;
  
          const bankData = {
              name: server.name.toUpperCase(),
              amount: server.amount,
              date: server.date
          }
  
          console.log(server)
          const banks = await models.ProductModel.Bank.findOne({ name: server.name });
          console.log(banks)
          if (!banks) {
              const cbank = new models.ProductModel.Bank(bankData);
              await cbank.save();
  
              // Create transaction record
              const transactionData = {
                  type: server.name.toUpperCase(), // You can adjust the type based on your requirements
                  from: "Opening Balance", // Assuming this is from an Opening Balance
                  to: server.name.toUpperCase(),
                  transaction_id: cbank._id, // Assuming bank _id is unique identifier for transaction
                  credited: parseFloat(server.amount),
                  debited: 0.0,
                  available: parseFloat(server.amount),
                  date: server.date
              };
  
              const newTransaction = new models.ProductModel.Transaction(transactionData);
              await newTransaction.save();
  
              res.redirect('/admin/auth/all-banks?success=Data Added Successfully');
          } else {
              banks.name = server.name.toUpperCase();
              banks.amount = parseFloat(server.amount) + parseFloat(banks.amount);
              banks.date = server.date || banks.date;
              await banks.save();
  
              // Create transaction record for the update
              const transactionData = {
                  type: server.name.toUpperCase(), // You can adjust the type based on your requirements
                  from: "Opening Balance", // Assuming this is from an Opening Balance
                  to: server.name.toUpperCase(),
                  transaction_id: uuidv4(),
                  credited: parseFloat(server.amount),
                  debited: 0.0,
                  available: parseFloat(banks.amount),
                  date: server.date
              };
  
              const newTransaction = new models.ProductModel.Transaction(transactionData);
              await newTransaction.save();
  
              res.redirect('/admin/auth/all-banks?success=Data Updated Successfully');
          }
      } catch (error) {
          console.error('Error during postBankData:', error);
          res.redirect(`/admin/auth/dashboard?error=${error}`);
      }
    },  
    getPostBank : async (req, res) => {
      try{
        const user = req.user;

        if (!user) {
          res.redirect('/admin/auth/login');
        }

        const id = req.params.id;

        const bank = await models.ProductModel.Bank.findOne({ _id : id });

        res.render('admin/banks/update_data', { bank, user: user, error: "Update Bank Data" });
      }catch(error){
        console.error('Error during getPostBank:', error);
        res.redirect(`/admin/auth/all-banks?error=${error}`); 
      }
    },
    postUpdateBank: async (req, res) => {
      try {
          const user = req.user;
  
          if (!user) {
              res.redirect('/admin/auth/login');
              return; // Make sure to return after redirecting
          }
  
          const bank_id = req.params.id;
          const server = req.body;
  
          const banks = await models.ProductModel.Bank.findOne({ _id: bank_id });
  
          const previousAmount = banks.amount;
  
          banks.name = server.name;
          banks.amount = server.amount;
          banks.date = server.date || banks.date;
  
          await banks.save();
  
          res.redirect('/admin/auth/all-banks?success=Data Updated Successfully');
  
      } catch (error) {
          console.error('Error during postUpdateBank:', error);
          res.redirect(`/admin/auth/all-banks?error=${error}`);
      }
    },  
    getuser : async (req, res) => {
      try {
        const user = req.user;
        
        if (!user) {
          res.redirect('/admin/auth/login');
        }
        
        const userId = req.params.userId;

        const customers = await models.CustomerModel.Client.findOne({ _id: userId });
        console.log(customers);

        res.json({ data : customers });
        
      } catch (error) {
        console.error('Error during getuser:', error);
        res.status(500).send('An error occurred during getuser.');
      }
    },

    getVendor : async (req, res) => {
      try {
        const user = req.user;
        
        if (!user) {
          res.redirect('/admin/auth/login');
        }
        
        const userId = req.params.userId;

        const customers = await models.ProductModel.Vendor.findOne({ _id: userId });
        console.log(customers);

        res.json({ data : customers });
        
      } catch (error) {
        console.error('Error during getuser:', error);
        res.status(500).send('An error occurred during getuser.');
      }
    },
  // User Logout API
    logout:(req, res) => {
      try {
        // Clear the user session
        const user = req.user;

        res.clearCookie('jwt'); // Clear the JWT cookie
        
        res.redirect('admin/auth/login')
        

      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).send('An error occurred during logout.');
      }
    },

    pageNotFound : async (req, res) => {
        const user = req.user;
          
        console.log(user)
        if (!user) {
          res.redirect('/admin/auth/login');
        }
        
        res.status(404).render('partials/404', {user}); // Render the pagenotfound.ejs view
    },
    
    redirecter: async (req, res) => {
      const user = req.user;
  
      console.log(user);
      if (!user) {
        res.redirect('/admin/auth/login');
      }
  
      return res.redirect('/admin/auth/dashboard');
  },

    getBankData : async (req, res) => {
        try {
          
          const user = req.user;
          if (!user) {
            res.redirect('/admin/auth/login');
          }
      
          const data = req.params.data 
          
          const total_expenses = await models.ProductModel.Expense.find();
          
          
          
      }catch(err){
        console.log(err)
      }
    },

    getInternalTransfer : async (req, res) => {
      try {
        const user = req.user;
        if (!user) {
          res.redirect('/admin/auth/login');
        }
        const bank = await models.ProductModel.Bank.find();
        res.render('admin/banks/transfer', { user: user, bank,error: "Internal Transfer" });
      }catch(err){
        console.log(err)
      }
    },

    postInternalTransfer: async (req, res) => {
      try {
          const user = req.user;
          if (!user) {
              res.redirect('/admin/auth/login');
              return; // Ensure to return after redirecting
          }
  
          const server = req.body;
          const from = await models.ProductModel.Bank.findOne({ name: server.from });
          const to = await models.ProductModel.Bank.findOne({ name: server.to });
  
          // Calculate the amount to be transferred
          const amount = Number(server.amount);
          console.log(amount)
  
          // Update the 'from' bank's amount (debit)
          from.amount = Number(from.amount) - amount;
          await from.save();
  
          // Update the 'to' bank's amount (credit)
          to.amount = Number(to.amount) + amount;
          await to.save();
  
          // Create a transaction record for debit
          const debitTransactionData = {
              type: server.from, // You can adjust the type based on your requirements
              from: server.from,
              to: server.to,
              transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
              debited: amount,
              credited: 0.0,
              available: Number(from.amount),
              date: server.date || formattedDate
          };
          
          console.log(debitTransactionData)
          const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
          await debitTransaction.save();
  
          // Create a transaction record for credit
          const creditTransactionData = {
              type: to.name, // You can adjust the type based on your requirements
              from: server.from,
              to: server.to,
              transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
              debited: 0.0,
              credited: amount,
              available: Number(to.amount),
              date: server.date || formattedDate
          };
          
          console.log(creditTransactionData)
          const creditTransaction = new models.ProductModel.Transaction(creditTransactionData);
          await creditTransaction.save();
  
          res.redirect('/admin/auth/all-banks?success=Internal Transfer Successfully');
      } catch (err) {
          console.log(err);
          res.redirect('/admin/auth/all-banks?error=Internal Transfer failed');
      }
  },  

  transactionLists: async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        res.redirect('/admin/auth/login');
      }
  
      const data = req.params.data;
      const bankName = data.toUpperCase();
  
      // Retrieve transactions where the bank is either the sender or receiver
      const transactions = await models.ProductModel.Transaction.find({
        type : bankName
      }).sort({ created_date: -1 });
  
      // Segregate transactions based on debit and credit for the bank
      res.render('admin/banks/transaction', { user: user, transactions, error: "Transaction Lists" });
  
    } catch (err) {
      console.log(err)
      res.redirect('/admin/auth/all-banks?error=Transaction Lists failed');
    }
  },

  getProfit : async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        res.redirect('/admin/auth/login');
      }

      const all_orders = await models.ProductModel.Order.find().sort({
        created_date: -1
      }).populate('client_id');

      const orders = [];

      for (const order of all_orders) {
        const expenses = await models.ProductModel.Expense.find({ order_id: order.order_id });

        const other_expense = await models.ProductModel.GenralExpense.find({ order_id: order.order_id });
        
        const total_expenses = expenses.reduce((acc, expense) => acc + parseFloat(expense.amount), 0) + other_expense.reduce((acc, expense) => acc + parseFloat(expense.amount), 0);
        
        const profit = parseFloat(order.grand_total) - total_expenses;
        const name = order.client_id.name;
        const order_cost = order.grand_total;
        const date = order.created_date.toLocaleDateString('en-UK',options);
        const data = {
          date,
          name,
          profit,
          order_cost,
          total_expenses
        }
        orders.push(data);
      }

      console.log("All orders ---- ", orders)

      res.render('admin/stats/profit', { user: user, orders, options ,error: "All Profits" });
    }catch(err){
      console.log(err)
    }
  },

  getBilled : async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        res.redirect('/admin/auth/login');
      }

      const orders = await models.ProductModel.Order.find().sort({
        created_date: -1
      }).populate('client_id');

      console.log(orders);
      res.render('admin/stats/billed', { user: user, orders, options ,error: "All Bills" });
    }catch(err){
      console.log(err)
    }
  },
  
  getDues : async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        res.redirect('/admin/auth/login');
      }

      const orders = await models.ProductModel.Order.find().sort({
        created_date: -1
      }).populate('client_id');

      console.log(orders);
      res.render('admin/stats/due_balance', { user: user, orders, options ,error: "All Dues" });
    }catch(err){
      console.log(err)
    }
  },

  getExpenses : async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        res.redirect('/admin/auth/login');
      }

      const all_orders = await models.ProductModel.Order.find().sort({
        created_date: -1
      }).populate('client_id');

      const orders = [];

      for (const order of all_orders) {
        const expenses = await models.ProductModel.Expense.find({ order_id: order.order_id });

        const other_expense = await models.ProductModel.GenralExpense.find({ order_id: order.order_id });
        
        const total_expenses = expenses.reduce((acc, expense) => acc + parseFloat(expense.amount), 0) + other_expense.reduce((acc, expense) => acc + parseFloat(expense.amount), 0);
        
        const profit = parseFloat(order.grand_total) - total_expenses;
        const name = order.client_id.name;
        const order_cost = order.grand_total;
        const date = order.created_date.toLocaleDateString('en-UK',options);
        const data = {
          date,
          name,
          profit,
          order_cost,
          total_expenses
        }
        orders.push(data);
      }

      console.log("All orders ---- ", orders)

      res.render('admin/stats/expense', { user: user, orders, options ,error: "All Expense" });
    }catch(err){
      console.log(err)
    }
  },

  getAllInventory : async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        res.redirect('/admin/auth/login');
      }

      const inventory = await models.ProductModel.InventoryBill.find({}).sort({
        created_date: -1
      }).populate('vendor_id');

      console.log(inventory);
      res.render('admin/stats/billed_inventory', { user: user, inventory, options ,error: "All Billed Inventory" });
    }catch(err){
      console.log(err)
    }
  },
  
  getPaidInventory : async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        res.redirect('/admin/auth/login');
      }

      const inventory = await models.ProductModel.InventoryBill.find({payment_status : "paid"}).sort({
        created_date: -1
      }).populate('vendor_id');

      console.log(inventory);
      res.render('admin/stats/paid_inventory', { user: user, inventory, options ,error: "All Unbilled Inventory" });
    }catch(err){
      console.log(err)
    }
  },
  
  getUnbilledInventory : async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        res.redirect('/admin/auth/login');
      }

      const inventory = await models.ProductModel.InventoryBill.find({}).sort({
        created_date: -1
      }).populate('vendor_id');

      console.log(inventory);
      res.render('admin/stats/unbilled_inventory', { user: user, inventory, options ,error: "All Unbilled Inventory" });
    }catch(err){
      console.log(err)
    }
  },

  getUnbilledExpenses : async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        res.redirect('/admin/auth/login');
      }

      const expenses = await models.ProductModel.GenralExpense.find({mode_of_payment : "Unpaid", expense_type : {$ne: "Order"}}).sort({
        created_date: -1
      });

      console.log(expenses);
      res.render('admin/stats/unbilled_expenses', { user: user, expenses, options ,error: "All Unbilled Expenses" });
    }catch(err){
      console.log(err)
    }
  },
  
  getBilledExpenses : async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        res.redirect('/admin/auth/login');
      }

      const expenses = await models.ProductModel.GenralExpense.find({expense_type : {$ne: "Order"}}).sort({
        created_date: -1
      });

      console.log(expenses);
      res.render('admin/stats/paid_expenses', { user: user, expenses, options ,error: "All Unbilled Expenses" });
    }catch(err){
      console.log(err)
    }
  },

  getChangePass : async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.redirect('/admin/auth/login');
      }

      console.log(user)
      res.render('admin/stats/change_pass', {user , error: "Change your password"});
    } catch (error) {
      console.error('Error fetching total revenue data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  postChangePass : async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.redirect('/admin/auth/login');
      }

      console.log(user)

      const { password, confirmPassword } = req.body;
      if (!password || !confirmPassword) {
        return res.redirect('/admin/auth/change-password?error=Please enter password and confirm password');
      }

      if (password !== confirmPassword) {
        return res.redirect('/admin/auth/change-password?error=Passwords do not match');
      }

      console.log(user.userId)
      const all_users = await models.CustomerModel.User.find();
      console.log(all_users)
      const users = await models.CustomerModel.User.findById(user.userId);
      console.log(users)
      users.password = await bcrypt.hash(password, 10);
      
      await users.save();

      res.redirect('/admin/auth/dashboard?success=Password changed successfully');
    } catch (error) {
      console.error('Error fetching :', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
} 

