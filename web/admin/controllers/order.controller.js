const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { format, addDays, isSameISOWeek, getISOWeek, parse } = require('date-fns');
const {generateAccessToken} = require('../middlewares/auth.middleware');
const models = require('../../../managers/models');
const { NumberHelper } = require('../../../managers/helpers');
const { urlencoded, json } = require('body-parser');
const currentDate = new Date();

const formattedDate = currentDate.toISOString().slice(0, 10); // Extract YYYY-MM-DD from ISO string

console.log(formattedDate); // Output the formatted date

// This would be your token blacklist storage
const options = { day: '2-digit', month: 'short', year: 'numeric' };


module.exports = {
  // Get Create Order 
  getCreateUser : async (req, res) => {
      try{
          const user = req.user;
  
          if(!user){
            res.render('a-login',{
              title: "Advaxo",
              error: "User Not Found"
            })   
          }
          
          const clients = await models.CustomerModel.Client.find();
          const token = uuidv4();
          console.log(token);
          res.render('admin/orders/create-customer',{
              user,
              clients,
              token,
              error: "Create new Order"
          })

        }catch(err){
          const user = req.user;
          res.redirect
        }
  },

  postCreateUser : async (req, res) => {
      try{
          const user = req.user;
  
          if(!user){
            res.render('a-login',{
              title: "Advaxo",
              error: "User Not Found"
            })   
          }

          const userData = {
            name: req.body.name,
            token : req.body.token,
            email: req.body.email,
            phone: req.body.phone,
            address : req.body.address_1
          }

          const existingUser = await models.CustomerModel.Client.findOne({name : userData.name, phone : userData.phone});
          if(existingUser){
            res.redirect(`/admin/order/create-order/${existingUser.token}`);    
          }else{
            const users = new models.CustomerModel.Client(userData);
            await users.save();
            
            res.redirect(`/admin/order/create-order/${userData.token}`);
          } 
        }catch(err){
          console.log(err)
          res.redirect(`/admin/order/select-customer?error="${encodeURIComponent(err)}"`);
        }
  },
  
  getDetail : async (req, res) => {
    try{
      const user = req.user;

      if(!user){  
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const userId = req.params.userId;

      const users = await models.CustomerModel.Client.findOne({token: userId});
      console.log(users);
      const order = await models.ProductModel.Order.find();
      const length = order.length;

      res.render('admin/orders/create-order', {
        user,
        users,
        token : userId,

        error: "Add Order Details"
      });
    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/select-customer?error="${encodeURIComponent(err)}"`);
    }
  },

  postDetails : async (req, res) => {
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const server = req.body;

      const client = await models.CustomerModel.Client.findOne({token : server.token});

      const orderData = {
        order_id : server.orderId,
        client_id: client._id,
        order_date: server.order_date,
        gst : server.gst,
        delivery_date: server.delivery_date,
        created_by : server.created_by
      }

      const existingOrder = await models.ProductModel.Order.findOne({order_id: orderData.order_id});

      if(existingOrder){
        res.redirect(`/admin/order/create-order/${server.token}?error="Order Already Exists"`);
      }
      const order = new models.ProductModel.Order(orderData);
      await order.save();

      res.redirect(`/admin/order/add-products/${server.orderId}`);

    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/create-order/${req.body.token}?error="${encodeURIComponent(err)}"`);
    }

  },

  getAddProduct : async (req, res) => {
    try{
      const user = req.user;

      if(!user){  
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const orderId = req.params.orderId;
      const products = await models.ProductModel.Product.find();
      const purchase = await models.ProductModel.Purchased.find({order_id : orderId}).sort({ created_date: -1 });
      res.render('admin/orders/add-products', {
        user,
        orderId,
        purchase,
        products,
        error: "Add Products"
      });
    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/select-customer?error="${encodeURIComponent(err)}"`);
    }
  },

  postAddproducts : async (req, res) => {
    try{  
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      console.log(req.body);
      const server = req.body;
      const productData = {
        order_id : server.orderId,
        name : server.product,
        description: server.description,
        unit : server.unit,
        width : server.width,
        height : server.height,
        quantity : server.quantity,
        area : server.area,
        rate : server.rate,
        amount: server.amount,
      } 

      const orders = await models.ProductModel.Order.findOne({order_id : server.orderId});

      if(!orders){
        res.redirect(`/admin/order/add-products/${server.orderId}?error="Order Not Found"`);
      }

      const purchase = new models.ProductModel.Purchased(productData);
      await purchase.save();

      orders.grand_total = parseFloat(orders.grand_total) + parseFloat(server.amount);
      orders.remaining_balance = parseFloat(orders.remaining_balance) + parseFloat(server.amount);
      orders.client_balance = parseFloat(orders.client_balance) + parseFloat(server.amount);
      await orders.save();

      res.status(200).send("Success")
    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/add-products/${req.body.orderId}?error="${encodeURIComponent(err)}"`);
    }
  },

  completeOrder : async (req, res) => {
    try{
      const user = req.user;

      if(!user){  
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const orderId = req.body.orderId; 

      res.redirect(`/admin/order/order-summary/${orderId}?success="Order Created Successfully"`);
    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/select-customer?error="${encodeURIComponent(err)}"`);
    }
  },
  
  orderSummary : async (req, res) => {
    try{
      const user = req.user;

      if(!user){  
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const orderId = req.params.orderId; 
      console.log(orderId);
      const orders = await models.ProductModel.Order.findOne({order_id: orderId}).populate('client_id').sort({ created_date: -1 });
      console.log(orders);
      const purchase = await models.ProductModel.Purchased.find({order_id : orderId}).sort({ created_date: -1 });
      const payment = await models.ProductModel.Payment.find({order_id : orderId}).sort({ created_date: -1 });
      const expense = await models.ProductModel.Expense.find({order_id : orderId}).sort({ created_date: -1 });
      const products = await models.ProductModel.Product.find().sort({ created_date: -1 });
      const other_expense = await models.ProductModel.GenralExpense.find({order_id : orderId}).sort({ created_date: -1 });

      const expenseTotal = (expense.reduce((sum, expense) => parseFloat(sum) + parseFloat(expense.amount), 0)).toFixed(2);
      const otherexpenseTotal = (other_expense.reduce((sum, other_expense) => parseFloat(sum) + parseFloat(other_expense.amount), 0)).toFixed(2);

      const totalExpense = parseFloat(expenseTotal) + parseFloat(otherexpenseTotal);
      console.log(products)
      res.render('admin/orders/order-summary', {
        user,
        orders,
        totalExpense,
        options,
        purchase,
        payment,
        products,
        other_expense,
        expense,
        error: "Order Summary"
      });
    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/select-customer?error="${encodeURIComponent(err)}"`);
    }
  },

  woplist : async (req, res) => {
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const orders = await models.ProductModel.Order.find().populate('client_id').sort({ created_date : -1 })

      
      res.render('admin/orders/all-wop', {
        user,
        options,
        orders,
        error: "All Order lists"
      });

    } catch(err){
      console.log(err)
      res.redirect(`/admin/auth/dashboard?error="${encodeURIComponent(err)}"`);
    }
  },

  getAddExpense : async (req, res) => {
    try{  
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }
      const orderId = req.params.orderId;
      
      const products = await models.ProductModel.Stocks.find().populate("product_id");
      
      res.render('admin/expense/add-expense', {
        orderId,
        user,
        products,
        error: "Add Expense for orderId : " + orderId
      })
    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/add-products/${req.body.orderId}?error="${encodeURIComponent(err)}"`);
    }
  },

  postAddExpense : async (req, res) => {
    try{  
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const server = req.body;
      const stocks = await models.ProductModel.Stocks.findOne({_id : server.product});
      const products = await models.ProductModel.Product.findOne({_id : stocks.product_id});
      const expenseData = {
        order_id : server.orderId,
        product_id : server.product,
        name : products.name,
        unit : server.unit,
        width : server.width || 0,
        height : server.height || 0,
        quantity : server.quantity,
        area : server.area || 0,
        rate : server.rate,
        amount: server.amount,
      } 

      const expense = new models.ProductModel.Expense(expenseData);
      await expense.save();

      const orders = await models.ProductModel.Order.findOne({order_id: server.orderId});
      orders.client_balance = parseFloat(orders.client_balance) - parseFloat(server.amount);
      orders.save();

      const liveStocks = await models.ProductModel.Stocks.findOne({ _id : server.product });
      console.log(liveStocks);
      if(server.unit === "SQRFT"){
        console.log("I am here in SQRFT")
        liveStocks.area = parseFloat(liveStocks.area) - parseFloat(server.area);
        liveStocks.amount = parseFloat(liveStocks.amount) - parseFloat(expense.amount);
        // Check if quantity is 1 than delete if it is more than one the no need to update
        if(parseFloat(liveStocks.quantity) > 1){
          liveStocks.quantity = parseFloat(liveStocks.quantity) - parseFloat(server.quantity);
        }
        await liveStocks.save();
      }else if(server.unit === "NOS"){
        console.log("I am here")
        liveStocks.quantity = parseFloat(liveStocks.quantity) - parseFloat(expense.quantity);
        liveStocks.amount = parseFloat(liveStocks.amount) - parseFloat(expense.amount);
        await liveStocks.save();
      }

      res.redirect(`/admin/order/order-summary/${server.orderId}?success="Expense Added Successfully"`);
    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/order-summary/${req.body.orderId}?error="${encodeURIComponent(err)}"`);
    }
  },

  getAddPayment : async (req, res) => {
    try{  
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }
      const orderId = req.params.orderId;
      const order = await models.ProductModel.Order.findOne({order_id : orderId}).populate("client_id");
      res.render('admin/expense/add-payment', {
        orderId,
        user,
        order,
        error: "Add Payment  for orderId : " + orderId
      })
    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/add-products/${req.body.orderId}?error="${encodeURIComponent(err)}"`);
    }
  },

  postAddPayment : async (req, res) => {
    try{  
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }
      console.log(req.body);
      const server = req.body;
      const paymentData = {
        order_id : req.params.orderId,
        date : server.date,
        payment_method : server.payment_method,
        amount: server.amount,
      } 
      const payment = new models.ProductModel.Payment(paymentData);
      await payment.save();

      const orders = await models.ProductModel.Order.findOne({order_id : req.params.orderId}).populate("client_id");
      console.log(orders)

      const money = await models.ProductModel.Bank.findOne({name : server.payment_method.toUpperCase()});
      money.amount = parseFloat(money.amount) + parseFloat(server.amount);
      await money.save();

      const creditTransaction = {
        type: money.name, // You can adjust the type based on your requirements
        from: `Client Payment`,
        to: `${orders.order_id} - ${orders.client_id.name}`,
        transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
        debited: 0.0,
        credited: server.amount,
        date: server.date || formattedDate
      }; 

      orders.remaining_balance = parseFloat(orders.remaining_balance) - parseFloat(server.amount);
      await orders.save();

      const transaction = new models.ProductModel.Transaction(creditTransaction);
      await transaction.save();

      if(orders.remaining_balance == 0){
        orders.payment_status = "paid";
        orders.save();
      }else {
        orders.payment_status = "partially_paid";
      }


      res.redirect(`/admin/order/order-summary/${server.orderId}?success="Payment Added Successfully"`);
    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/order-summary/${req.body.orderId}?error="${encodeURIComponent(err)}"`);
    }
  },

  getUpdateProducts : async (req, res) => {
    try{  
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const productId = req.params.productId;
      
      const products = await models.ProductModel.Purchased.find({_id : productId});
      const product = products[0];
      console.log(product)
      res.render('admin/orders/update-products', { 
        user,
        product,
        error: "Update Products for orderId : " + productId
      })  

    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/dashboard?error="${encodeURIComponent(err)}"`);
    } 
  },

  postUpdateProducts: async (req, res) => {
    var order_id;
    const referer = req.get('Referer');
    try{
      const user = req.user;  

      console.log(req.body)
      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const server = req.body;
      const product_id = req.params.productId;
      const product = await models.ProductModel.Purchased.findById(product_id);
      const difference_bal = parseFloat(product.amount);
      console.log(difference_bal)
      const orders = await models.ProductModel.Order.findOne({order_id: product.order_id});
      if(!product){
        res.redirect(`${referer}?error="Product Not Found"`);
      }

      order_id = product.order_id;
      product.name = server.name;
      product.description = server.description;
      product.width = server.width;
      product.height = server.height;
      product.unit = server.unit || product.unit;
      product.quantity = server.quantity;
      product.area = server.total_area;
      product.rate = server.rate;
      product.amount = server.total_amount;

      await product.save();
      
      orders.client_balance = parseFloat(orders.client_balance) - parseFloat(difference_bal) + parseFloat(product.amount);
      orders.remaining_balance = parseFloat(orders.remaining_balance) - parseFloat(difference_bal) + parseFloat(product.amount);
      orders.grand_total = parseFloat(orders.grand_total) - parseFloat(difference_bal) + parseFloat(product.amount);
      orders.save();
      const successMsg = `${server.name} -- Updated Successfully`;
      res.redirect(`/admin/order/order-summary/${product.order_id}?success=${encodeURIComponent(successMsg)}`)
    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error=${encodeURIComponent(err)}`);
    }
  },

  deleteProduct : async (req, res) => {
    try{
      const user = req.user; 

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const productId = req.params.productId;

      const product = await models.ProductModel.Purchased.findById(productId);
      if(!product){
        res.redirect(`/admin/order/dashboard?error="Product Not Found"`);
      }

      const orders = await models.ProductModel.Order.findOne({order_id: product.order_id});
      orders.client_balance = parseFloat(orders.client_balance) - parseFloat(product.amount);
      orders.remaining_balance = parseFloat(orders.remaining_balance) - parseFloat(product.amount);
      orders.grand_total = parseFloat(orders.grand_total) - parseFloat(product.amount);

      await models.ProductModel.Purchased.findByIdAndDelete(productId);
      await orders.save();
      const successMsg = `${product.name} -- Deleted Successfully`;
      res.redirect(`/admin/order/order-summary/${product.order_id}?success=${encodeURIComponent(successMsg)}`)

    }catch(err){
      console.log(err)
      res.redirect(`/admin/order/dashboard?error="${encodeURIComponent(err)}"`);
    }
  },

  getUpdatePayment : async (req, res) => {
    try{
      const user = req.user;  

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }  

      const payment_id = req.params.paymentId;
      
      const payments = await models.ProductModel.Payment.find({ _id: payment_id});
      console.log(payments);
      const payment = payments[0];
      console.log(payment);
      const orderId = payments.order_id;

      res.render('admin/expense/update-payment', {
        orderId,
        user,
        payment,
        error: "Update Payment  for orderId : " + orderId
      })

    }catch(err){
      console.log(err)
      res.redirect(`/admin/auth/dashboard?error="${encodeURIComponent(err)}"`);
    }
  },

  postUpdatePayment : async (req, res) => {
    var order_id;
    const referer = req.get('Referer');
    try{
      const user = req.user;  

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }  
      console.log(req.body)
      const payment_id = req.params.paymentId;
      
      const server = req.body;

      var prev_amount ;
      const payment = await models.ProductModel.Payment.findById(payment_id);

      prev_amount = parseFloat(payment.amount);

      const orders = await models.ProductModel.Order.findOne({order_id : payment.order_id}).populate("client_id");
      console.log(orders)
      order_id = orders.order_id;
      const money = await models.ProductModel.Bank.findOne({name : server.payment_method});
      const payment_method = server.payment_method || payment.payment_method ;
      const date = server.date || payment.date || formattedDate;

      const difference = Math.abs(Number(payment.amount) - Number(server.amount));
      console.log(difference);

      if (payment.amount < server.amount) {
        // Handle payment amount less than server amount
        console.log("I am here in More");
        const from = await models.ProductModel.Bank.findOne({ name: payment_method });
      
        from.amount = (Number(from.amount) - Number(payment.amount)) + Number(server.amount);
        await from.save();

        const credit = difference * -1;
      
        const debitTransactionData = {
          type: payment_method,
          from: `Client Payment ${orders.order_id} - ${orders.client_id.name} `,
          to: payment_method,
          transaction_id: uuidv4(),
          debited: 0.0,
          credited: credit,
          date: date
        };
      
        const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
        await debitTransaction.save();
      } else if (payment.amount > server.amount) {
        // Handle payment amount greater than server amount
        console.log("I am here in Less");
        const from = await models.ProductModel.Bank.findOne({ name: payment_method });
        console.log(from);
      
        from.amount = (Number(from.amount) - Number(payment.amount)) + Number(server.amount);
        await from.save();
        console.log(from);
      
        const debitTransactionData = {
          type: payment_method,
          from: payment_method,
          to: `Client Payment ${orders.order_id} - ${orders.client_id.name} `,
          transaction_id: uuidv4(),
          debited: difference,
          credited: 0.0,
          date: date
        };
      
        console.log(debitTransactionData);
        const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
        await debitTransaction.save();
      } else {
        // Handle equal payment and server amounts
        console.log(server.payment_method);
        if (payment.payment_method === "CASH" || payment.payment_method === "IDFC SWATI" || payment.payment_method === "IDFC SAM" || payment.payment_method === "NET BANK") {
          const from = await models.ProductModel.Bank.findOne({ name: server.payment_method });
          const to = await models.ProductModel.Bank.findOne({ name: payment.payment_method });
          console.log("I am here in Same ")
          // Calculate the amount to be transferred
          const amount = Number(server.amount);
          console.log(amount);
      
          // Update the 'from' bank's amount (debit)
          from.amount = Number(from.amount) + amount;
          await from.save();
      
          // Update the 'to' bank's amount (credit)
          to.amount = Number(to.amount) - amount;
          await to.save();
      
          // Create a transaction record for debit
          const debitTransactionData = {
            type: to.name,
            from: `Client Payment`,
            to: `${orders.order_id} - ${orders.client_id.name}`,
            transaction_id: uuidv4(),
            debited: amount,
            credited: 0.0,
            date: server.date || formattedDate
          };
      
          console.log(debitTransactionData);
          const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
          await debitTransaction.save();
      
          // Create a transaction record for credit
          const creditTransactionData = {
            type: from.name,
            from: `Client Payment`,
            to: `${orders.order_id} - ${orders.client_id.name}`,
            transaction_id: uuidv4(),
            debited: 0.0,
            credited: amount,
            date: server.date || formattedDate
          };
          console.log(creditTransactionData);
          const creditTransaction = new models.ProductModel.Transaction(creditTransactionData);
          await creditTransaction.save();
        } else {
          console.log("Passed");
        }
      }
      

      payment.date = server.date || payment.date;
      payment.payment_method = server.payment_method || payment.payment_method;
      payment.amount = server.amount;
      await payment.save();
      
      const all_payments = await models.ProductModel.Payment.find({order_id : order_id});

      const total_amount = all_payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      orders.remaining_balance = parseFloat(orders.grand_total) - parseFloat(total_amount);
      await orders.save();

      if(orders.remaining_balance == 0){
        orders.payment_status = "paid";
        orders.save();
      }else {
        orders.payment_status = "partially_paid";
      }


      res.redirect(`/admin/order/order-summary/${order_id}?success="Payment Added Successfully"`);
    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error=${encodeURIComponent(err)}`);
    }
  },

  deletePayment : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const payment_id = req.params.paymentId;
      const payment = await models.ProductModel.Payment.findById(payment_id);
      const order_id = payment.order_id;

      const orders = await models.ProductModel.Order.findOne({order_id : order_id}).populate("client_id");
      orders.remaining_balance = parseFloat(orders.remaining_balance) + parseFloat(payment.amount);
      
      const payment_delete = await models.ProductModel.Payment.findByIdAndDelete(payment_id);

      await orders.save();

      const from = await models.ProductModel.Bank.findOne({name: payment.payment_method});

      from.amount = parseFloat(from.amount) - parseFloat(payment.amount);
      
      await from.save();

      console.log(payment.payment_method)
      const creditedTransactionData = {
        type: payment.payment_method,
        from: `Returned Client Payment`,
        to: `${orders.order_id} - ${orders.client_id.name}`,
        transaction_id: uuidv4(),
        debited: payment.amount,
        credited: 0.0,
        date: formattedDate
      };
      const creditedTransaction = new models.ProductModel.Transaction(creditedTransactionData);
      await creditedTransaction.save();

      res.json({success: true});

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error=${encodeURIComponent(err)}`);
    }
  },

  getUpdateExpense : async (req, res) => {
    try{
      const user = req.user;  

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }  

      const expense_id = req.params.expenseId;
      
      const expenses = await models.ProductModel.Expense.find({ _id: expense_id}).populate("product_id");
      console.log(expenses);
      const expense = expenses[0];
      console.log(expense);
      const orderId = expenses.order_id;
      const products = await models.ProductModel.Product.find({order_id : orderId});

      res.render('admin/expense/update-expenses', {
        orderId,
        user,
        expense,
        products,
        error: "Update Expenses  for orderId : " + orderId
      })

    }catch(err){
      console.log(err)
      res.redirect(`/admin/auth/dashboard?error="${encodeURIComponent(err)}"`);
    }
  },
  postUpdateExpense : async (req, res) => {
    const referer = req.get('Referer');
    try{  
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const expense_id = req.params.expenseId;
      const server = req.body;
      console.log(server);
      
      const expense = await models.ProductModel.Expense.findOne({_id : expense_id});
      console.log(expense);

      const ordered_expense = await models.ProductModel.Order.findOne({order_id : expense.order_id});
      const all_expenses = await models.ProductModel.Expense.find({order_id : expense.order_id});
      const other_expenses = await models.ProductModel.GenralExpense.find({order_id : expense.order_id});
      const totalExpense = (all_expenses.reduce((sum, expense) => parseFloat(sum) + parseFloat(expense.amount), 0)).toFixed(2);
      const totalOtherExpense = (other_expenses.reduce((sum, expense) => parseFloat(sum) + parseFloat(expense.amount), 0)).toFixed(2);
      ordered_expense.client_balance = (parseFloat(ordered_expense.grand_total) - parseFloat(totalExpense) - parseFloat(totalOtherExpense)).toFixed(2);

      const live_stocks = await models.ProductModel.Stocks.findOne({_id : expense.product_id});

      console.log(parseFloat(expense.quantity), parseFloat(server.quantity));
      console.log(parseFloat(expense.quantity) > parseFloat(server.area));
      console.log(parseFloat(expense.quantity) < parseFloat(expense.area));
      if(server.unit === "SQRFT"){
        console.log("I am here in SQRFT")
        if(parseFloat(expense.area) > parseFloat(server.area)){
          live_stocks.area = parseFloat(live_stocks.area) + (parseFloat(expense.area) - parseFloat(server.area));
          // Check if quantity is 1 than delete if it is more than one the no need to update
          if(parseFloat(expense.quantity) > 1){
            live_stocks.quantity = parseFloat(live_stocks.quantity) + (parseFloat(expense.quantity) - parseFloat(server.quantity));
          }
          await live_stocks.save(); 
        }else if(parseFloat(expense.area) < parseFloat(server.area)){
          live_stocks.area = parseFloat(live_stocks.area) - (parseFloat(server.area) - parseFloat(expense.area));
          // Check if quantity is 1 than delete if it is more than one the no need to update
          if(parseFloat(expense.quantity) > 1 ){
            live_stocks.quantity = parseFloat(live_stocks.quantity) - (parseFloat(server.quantity) - parseFloat(expense.quantity));
          }
          await live_stocks.save(); 
        }else{
          console.log("hehehehe")
        }
      }else if(server.unit === "NOS"){
        console.log("I am here in NOS")
        if(parseFloat(expense.quantity) > parseFloat(server.quantity)){
          live_stocks.quantity = parseFloat(live_stocks.quantity) + (parseFloat(expense.quantity) - parseFloat(server.quantity));
          await live_stocks.save();
        }else if(parseFloat(expense.quantity) < parseFloat(server.quantity)){
          live_stocks.quantity = parseFloat(live_stocks.quantity) - (parseFloat(server.quantity) - parseFloat(expense.quantity));
          await live_stocks.save();
        }else{
          console.log("hehehehe")
        }
      }

      expense.name = server.name ;
      expense.unit = server.unit || expense.unit ;
      expense.width = server.width ;
      expense.height = server.height ;
      expense.quantity = server.quantity ;
      expense.area = server.area ;
      expense.rate = server.rate ;
      expense.amount= server.amount ;

      await live_stocks.save();
      await ordered_expense.save(); 
      await expense.save();
    

      res.redirect(`/admin/order/order-summary/${expense.order_id}?success="Expense Added Successfully"`);
    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  },

  deleteExpense : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const expense_id = req.params.expenseId;

      const expense = await models.ProductModel.Expense.findOne({_id : expense_id});
      const orderId = expense.order_id;
      const expense_amount = expense.amount;
              
      const products = await models.ProductModel.Product.findOne({ _id : expense.product_id});
      const ordered_expense = await models.ProductModel.Order.findOne({order_id : orderId});
      ordered_expense.client_balance = parseFloat(ordered_expense.client_balance) + parseFloat(expense_amount);

      await ordered_expense.save();
      
      const live_stocks = await models.ProductModel.Stocks.findOne({_id : expense.product_id});

      console.log("Live stocks", live_stocks);

      if(expense.unit === "SQRFT"){
        console.log("I am here in SQRFT")
        live_stocks.area = parseFloat(live_stocks.area) + parseFloat(expense.area);
        // Check if quantity is 1 than delete if it is more than one the no need to update
        if(parseFloat(expense.quantity) > 1){
          live_stocks.quantity = parseFloat(live_stocks.quantity) + parseFloat(expense.quantity);
        }
        await live_stocks.save();
      }else if(expense.unit === "NOS"){
        console.log("I am here")
        live_stocks.quantity = parseFloat(live_stocks.quantity) + parseFloat(expense.quantity);
        await live_stocks.save();
      }
      
      await live_stocks.save();
      console.log("Live stocks", live_stocks);
      const expense_delete = await models.ProductModel.Expense.findByIdAndDelete(expense_id); 

      res.json({success: true});

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  },

  getAllExpenses : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const expenses = await models.ProductModel.GenralExpense.find({}).sort({ date: -1,created_date: -1 });

      res.render('admin/expense/other-expenses', {
        user,
        expenses,
        options,
        error: "Other Expenses"
      })
    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`)
    }
  },

  getAddOtherExpenses : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      } 

      const products = await models.ProductModel.Product.find({});
      const orders = await models.ProductModel.Order.find({}).populate('client_id');
      res.render('admin/expense/add-other-expense', {
        user,
        products,
        orders,
        error: "Add Other expenses"
      })

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`)
    }
  },

  postAddOtherExpenses : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      } 

      const server = req.body;

      console.log(server)
      var client_name;
      if(server.expense_type === "Order"){
        const orders = await models.ProductModel.Order.findOne({order_id : server.work_order});
        client_name = orders.client_name;
      }

      const expenseData = { 
        expense_type : server.expense_type,
        order_id : server.work_order,
        amount : server.amount,
        item_name : server.item,
        description : server.description,
        date : server.date,
        created_date: server.created_date,
        mode_of_payment: server.payment_method,
        payment_status: true,
        amount : server.amount,
        payment_status : (server.payment_method === "Unpaid") ? false : true,
        client_name : client_name || "--",
      }  

        
      if(server.payment_method === "Unpaid"){
        expenseData.payment_status = false;
        const expense = new models.ProductModel.GenralExpense(expenseData);
        await expense.save();
      }else{
        const money = await models.ProductModel.Bank.findOne({name : server.payment_method.toUpperCase()});
        money.amount = parseFloat(money.amount) - parseFloat(server.amount);
        await money.save();

        const creditTransaction = {
          type: money.name, // You can adjust the type based on your requirements
          from: "Issued Expenses",
          to: `${server.item}`,
          transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
          debited: server.amount,
          credited: 0.0,
          date: server.date || formattedDate
        }; 
        
        const expense = new models.ProductModel.GenralExpense(expenseData);

        await expense.save();

        const transaction = new models.ProductModel.Transaction(creditTransaction);
        await transaction.save();
      }

      if(server.expense_type === "Order"){
        const orders = await models.ProductModel.Order.findOne({order_id : server.work_order});
        orders.client_balance = parseFloat(orders.client_balance) - parseFloat(server.amount); 
        await orders.save()
      }
      
      if(server.expense_type === "Order"){
        res.redirect(`/admin/order/order-summary/${expenseData.order_id}?success="Expense Added Successfully"`);
      }else{
        res.redirect(`/admin/order/other-expenses?success="Expense Added Successfully"`);
      }

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`)
    }
  },

  getEditOtherExpenses : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const expenseId = req.params.expenseId;

      const expenses = await models.ProductModel.GenralExpense.findById(expenseId);

      res.render('admin/expense/update-other-expenses', {
        user,
        expenses,
        error: "Update Other expenses"
      })
 
    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`)
    }
  },

  postEditOtherExpenses : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const server = req.body
      console.log("Data from Server ",server)
      const expenseId = req.params.expenseId;

      const expense = await models.ProductModel.GenralExpense.findById(expenseId);
        

      const difference = Math.abs(Number(expense.amount) - Number(server.amount));
        const payment_method = server.payment_method || expense.mode_of_payment ;
        const date = server.date || expense.date || formattedDate;

        
      if (expense.amount < server.amount) {

        const from = await models.ProductModel.Bank.findOne({ name : payment_method});

        const debitTransactionData = {
          type: payment_method, // You can adjust the type based on your requirements
          from: "Issued Expenses",
          to: `${server.item}`,
          transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
          debited: difference,
          credited: 0.0,
          date: date
        }; 

        const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
        await debitTransaction.save();
      }else if(expense.amount > server.amount){
        const from = await models.ProductModel.Bank.findOne({ name : payment_method });

        const debitTransactionData = {
          type: payment_method, // You can adjust the type based on your requirements
          from: "Issued Expenses",
          to: `${server.item}`,
          transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
          debited: 0.0,
          credited: difference,
          date: date
        }; 

        const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
        await debitTransaction.save();
      }else{
        console.log("Payment Method",server.payment_method);
        if(expense.mode_of_payment === "Unpaid" && (server.payment_method === "CASH" || server.payment_method === "IDFC SWATI" || server.payment_method === "IDFC SAM" || server.payment_method === "NET BANK")){
          console.log("UNPAID TO CASH")
          const from = await models.ProductModel.Bank.findOne({ name: server.payment_method });

          const debitTransactionData = {
            type: server.payment_method,
            from: `Expense -- ${server.item}`,
            to: `${server.item}`,
            transaction_id: uuidv4(),
            debited: Number(server.amount),
            credited: 0.0,
            date: date
          }; 
          const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
          await debitTransaction.save();
        }else if ( server.payment_method !== false ) {
          const from = await models.ProductModel.Bank.findOne({ name: expense.mode_of_payment});
          const to = await models.ProductModel.Bank.findOne({ name: server.payment_method});
          console.log("From -- " + from)
          console.log("To -- " + to)
          // Calculate the amount to be transferred
          const amount = Number(server.amount);
          console.log(amount);

          // Create a transaction record for debit
          const debitTransactionData = {
              type: from.name, // You can adjust the type based on your requirements
              from: "Other Expenses",
              to: `Expense -- ${server.item}`,
              transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
              debited: amount,
              credited: 0.0,
              date: server.date || formattedDate
          };

          console.log(debitTransactionData)
          const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
          await debitTransaction.save();

          // Create a transaction record for credit
          const creditTransactionData = {
              type: to.name, // You can adjust the type based on your requirements
              from: "Expense Refund",
              to: `Expense -- ${server.item}`,
              transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
              debited: 0.0,
              credited: amount,
              date: server.date || formattedDate
          };
          console.log(creditTransactionData)
          const creditTransaction = new models.ProductModel.Transaction(creditTransactionData);
          await creditTransaction.save();
        } else if (server.payment_method === "Unpaid" && (expense.payment_method === "CASH" || expense.payment_method === "IDFC SWATI" || expense.payment_method === "IDFC SAM" || expense.payment_method === "NET BANK")) {
          console.log("PAID TO UNPAID")
          const from = await models.ProductModel.Bank.findOne({ name : expense.payment_method});
        
          const debitTransactionData = {
            type: expense.payment_method, // You can adjust the type based on your requirements
            from: "Expense Refund",
            to: `Expense -- ${server.item}`,
            transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
            debited: 0.0,
            credited: Number(server.total_amount),
            date: formattedDate
          }; 
          
          const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
          await debitTransaction.save();
        }else{
          console.log("Passed")
        }
      }


      expense.date  = server.date || expense.date;
      expense.item_name  = server.item;
      expense.description  = server.description;
      expense.created_date = server.created_date;
      expense.mode_of_payment = server.payment_method || expense.mode_of_payment;
      expense.payment_status = (server.payment_method === "Unpaid") ? false : true || expense.payment_status;
      expense.amount  = server.amount;


      if(expense.expense_type === "Order"){
        const ordered_expense = await models.ProductModel.Order.findOne({order_id : expense.order_id});
        const all_expenses = await models.ProductModel.Expense.find({order_id : expense.order_id});
        const other_expenses = await models.ProductModel.GenralExpense.find({order_id : expense.order_id});

        const totalExpense = (all_expenses.reduce((sum, expense) => parseFloat(sum) + parseFloat(expense.amount), 0)).toFixed(2);
        const totalOtherExpense = (other_expenses.reduce((sum, expense) => parseFloat(sum) + parseFloat(expense.amount), 0)).toFixed(2);

        ordered_expense.client_balance = (parseFloat(ordered_expense.grand_total) - parseFloat(totalExpense) - parseFloat(totalOtherExpense)).toFixed(2);

        await ordered_expense.save();
      }

      await expense.save();

      res.redirect(`/admin/order/other-expenses?success="Expenses Added Successfully"`)

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`)
    }
  },

  deleteOtherExpenses : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const expenseId = req.params.expenseId;

      const expense = await models.ProductModel.GenralExpense.findById(expenseId);

      if(expense.expense_type === "Order"){
        const orders = await models.ProductModel.Order.findOne({order_id : expense.order_id});
        orders.client_balance = parseFloat(orders.client_balance) + parseFloat(expense.amount); 
        await orders.save()
      }

      if(expense.mode_of_payment === 'CASH' || expense.mode_of_payment === 'NET BANK' || expense.mode_of_payment === 'IDFC SWATI' || expense.mode_of_payment === 'IDFC SAM'){
            
        const from = await models.ProductModel.Bank.findOne({ name : expense.mode_of_payment});

        from.amount = (Number(from.amount) + Number(expense.amount));

        await from.save();

        const debitTransactionData = {
          type: from.name, // You can adjust the type based on your requirements
          from: "Expense Refund",
          to: `General -- ${expense.item_name}`,
          transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
          debited: 0.0,
          credited: expense.amount,
          date: formattedDate
        }; 
        
        const debitTransaction = await models.ProductModel.Transaction.create(debitTransactionData);
        await debitTransaction.save();
        
      }else{
        console.log("Passed")
      }

      await models.ProductModel.GenralExpense.findByIdAndDelete(expenseId);

      res.json({
        status : true
      })

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`)
    }
  },

  validOrderId : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const orderId = req.params.orderId.toUpperCase();
      console.log(orderId.toUpperCase());
      const order = await models.ProductModel.Order.findOne({order_id : orderId});
      console.log(order);
      if(order){
        res.send({status : true, message : "Order Id  Already Exists"});
      }else{
        res.send({status : false, message : ""});
      }
      
    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`)
    }
  },

  updateOrderStatus : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const orderId = req.params.orderId;
      const status = req.body.selectedStatus;

      const order = await models.ProductModel.Order.findOne({_id : orderId});

      order.status = status;

      await order.save();

      console.log("saved")
      res.json({
        status : true
      })

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`)
    }
  },

  getUpdateOrder : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const orderId = req.params.orderId;

      const order = await models.ProductModel.Order.findOne({order_id : orderId}).populate("order_id").populate("client_id");

      res.render('admin/orders/update-order', {
        user,
        order,
        error: "Update Order"
      })

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`)
    }
  },

  postUpdateOrder : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const server = req.body;
      const orderId = req.params.orderId;

      const order = await models.ProductModel.Order.findOne({order_id : orderId});

      const client = await models.CustomerModel.Client.findOne({_id : order.client_id});

      client.name = server.name;
      client.phone = server.phone;
      client.email = server.email;
      client.address = server.address_1;

      await client.save();
      
      order.gst = server.gst || order.gst;
      order.order_date = server.order_date || order.order_date; 
      order.delivery_date = server.delivery_date || order.delivery_date;
      order.created_by = server.created_by || order.created_by;

      await order.save();


      
      res.redirect(`/admin/order/order-summary/${order.order_id}?success="Order Details Updated Successfully"`)
    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`)
    }
  },

  deleteWOP : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const order_id = req.params.wopId;
      const work_order = await models.ProductModel.Order.findById(order_id).populate("client_id");

      console.log(work_order);
      const orderId = work_order.order_id;
      const other_expenses = await models.ProductModel.GenralExpense.find({order_id : orderId});

      if(other_expenses){
        console.log(other_expenses);
        for (const expense of other_expenses) {
          console.log(expense);
          const from = await models.ProductModel.Bank.findOne({ name : expense.mode_of_payment});
          from.amount = (Number(from.amount) + Number(expense.amount));

          await from.save();

          const debitTransactionData = {
            type: from.name, // You can adjust the type based on your requirements
            from: "Expense Refund",
            to: `General -- ${expense.item_name}`,
            transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
            debited: 0.0,
            credited: expense.amount,
            date: formattedDate
          }; 
          
          const debitTransaction = await models.ProductModel.Transaction.create(debitTransactionData);
          await debitTransaction.save();

          const deleteExpenses = await models.ProductModel.GenralExpense.findByIdAndDelete(expense._id);

          console.log(deleteExpenses);
          }
      }



      const payments = await models.ProductModel.Payment.find({order_id : orderId});
      
      if(payments){
        for (const payment of payments) {
          const from = await models.ProductModel.Bank.findOne({ name : payment.payment_method});
          from.amount = (Number(from.amount) - Number(payment.amount));
          await from.save();

          const debitTransactionData = {
            type: from.name, // You can adjust the type based on your requirements
            from: "Returned Client Payment",
            to: `${work_order.order_id}-- ${work_order.client_id.name}`,
            transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
            debited: payment.amount,
            credited: 0.0,
            date: formattedDate
          }; 
          
          const debitTransaction = await models.ProductModel.Transaction.create(debitTransactionData);
          await debitTransaction.save();

          const deletePayment = await models.ProductModel.Payment.findByIdAndDelete(payment._id);

          console.log(deletePayment);
        }
      }

      const purchase = await models.ProductModel.Purchased.findOneAndDelete({order_id : orderId});
      
      const deletedExpenses = await models.ProductModel.Expense.find({ order_id: orderId });
      console.log("Deleted Expenses:", deletedExpenses);

      
      for (const deletedExpense of deletedExpenses) {
        const expensesWithSameProductId = await models.ProductModel.Expense.find({ order_id: orderId, expense_id: deletedExpense.product_id });
        console.log("Expenses with same product ID:", expensesWithSameProductId);
        const totalQuantityOfDeletedExpense = expensesWithSameProductId.reduce((total, expense) => total + parseInt(expense.quantity), 0);

        const liveStock = await models.ProductModel.Stocks.findOne({ product_id: deletedExpense.product_id });

        if (liveStock) {
            const deduct = expensesWithSameProductId;

            const totalArea = deduct.reduce((sum, e) => sum + parseFloat(e.area), 0).toFixed(2);
            const totalQuantity = deduct.reduce((sum, e) => sum + parseFloat(e.quantity), 0).toFixed(2);
            const totalAmount = deduct.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2);

            const deductUnit = deduct.length > 0 ? deduct[0].unit : '';
            const quantityChange = deductUnit === 'SQRFT' ? 0 : parseFloat(liveStock.quantity) + parseFloat(totalQuantity);
            const areaChange = deductUnit === 'SQRFT' ? parseFloat(liveStock.area) + parseFloat(totalArea) : 0;
            const amountChange = parseFloat(liveStock.amount) + parseFloat(totalAmount);

            liveStock.quantity = quantityChange;
            liveStock.area = areaChange;
            liveStock.amount = amountChange;

            await liveStock.save();
            console.log("Updated Live Stock:", liveStock);
            const deleteExpense = await models.ProductModel.Expense.findOneAndDelete(deletedExpense._id);
        } else {
            console.log("Live Stock not found for product ID:", deletedExpense.product_id);
        }
      }

      const deleteWOP = await models.ProductModel.Order.findByIdAndDelete(order_id).populate("client_id");
      res.json({success: true});

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  },
  getBill : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const order_id = req.params.order_id;
      const order = await models.ProductModel.Order.findOne({order_id : order_id}).populate("order_id").populate("client_id");
      const totalPriceInWords = NumberHelper.convertNumberToWords(order.grand_total);
      const products = await models.ProductModel.Purchased.find({order_id : order_id});

      res.render('admin/invoices/work-order-bill',{user ,order,order_id,products, totalPriceInWords, options, error: "Product Details"})

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  },

  search : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;
      
      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const clients = await models.CustomerModel.Client.find();

      console.log(clients);
      res.render('admin/reports/reports-order',{user, data : null, clients, error: "Find all Customers"})

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  },
  getSearch : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;
      
      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const name = req.body.customer_id;
      console.log(name);
      if(!name){
        res.render('admin/search',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const client = await models.CustomerModel.Client.find({});
      const customers = await models.CustomerModel.Client.findOne({_id : name});

      console.log(customers);
      const customer_id = customers._id;

      const orders = await models.ProductModel.Order.find({client_id : customer_id}).populate("client_id").sort({date : -1});

      console.log(orders);
      let overallGrandTotal = 0.0;
      let overallRemainingBalance = 0.0;
      let overallClientBalance = 0.0;
      let paidOrderCount = 0;
      let unpaidOrderCount = 0;
      let totalOrders = orders.length;
      
      orders.forEach(order => {
          overallGrandTotal += parseFloat(order.grand_total);
          overallRemainingBalance += parseFloat(order.remaining_balance);
          overallClientBalance += parseFloat(order.client_balance);
      
          if (order.payment_status === 'paid') {
              paidOrderCount++;
          } else if (order.payment_status === 'unpaid') {
              unpaidOrderCount++;
          }
      });

        const data = {
          client_name : orders[0].client_id.name,
          grand_total : overallGrandTotal,
          remaining_balance : overallRemainingBalance,
          client_balance : overallClientBalance,  
          paid_order_count : paidOrderCount,
          unpaid_order_count : unpaidOrderCount,
          total_orders : totalOrders        
        }

        res.render('admin/reports/reports-order',{user, inventory : orders,clients : client, data, options,  error: "Reports"})
      
    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  }
}
