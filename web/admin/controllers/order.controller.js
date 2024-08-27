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

  // getAddPayment : async (req, res) => {
  //   try{  
  //     const user = req.user;

  //     if(!user){
  //       res.render('a-login',{
  //         title: "Advaxo",
  //         error: "User Not Found"
  //       })   
  //     }
  //     const orderId = req.params.orderId;
  //     const order = await models.ProductModel.Order.findOne({order_id : orderId}).populate("client_id");
  //     res.render('admin/expense/add-payment', {
  //       orderId,
  //       user,
  //       order,
  //       error: "Add Payment  for orderId : " + orderId
  //     })
  //   }catch(err){
  //     console.log(err)
  //     res.redirect(`/admin/order/add-products/${req.body.orderId}?error="${encodeURIComponent(err)}"`);
  //   }
  // },

  // postAddPayment : async (req, res) => {
  //   try{  
  //     const user = req.user;

  //     if(!user){
  //       res.render('a-login',{
  //         title: "Advaxo",
  //         error: "User Not Found"
  //       })   
  //     }
  //     console.log(req.body);
  //     const server = req.body;
  //     const paymentData = {
  //       order_id : req.params.orderId,
  //       date : server.date,
  //       payment_method : server.payment_method,
  //       amount: server.amount,
  //     } 
  //     const payment = new models.ProductModel.Payment(paymentData);
  //     await payment.save();

  //     const orders = await models.ProductModel.Order.findOne({order_id : req.params.orderId}).populate("client_id");
  //     console.log(orders)

  //     const money = await models.ProductModel.Bank.findOne({name : server.payment_method.toUpperCase()});
  //     money.amount = parseFloat(money.amount) + parseFloat(server.amount);
  //     await money.save();

  //     const creditTransaction = {
  //       type: money.name, // You can adjust the type based on your requirements
  //       from: `Client Payment`,
  //       to: `${orders.order_id} - ${orders.client_id.name}`,
  //       transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
  //       debited: 0.0,
  //       credited: server.amount,
  //       date: server.date || formattedDate
  //     }; 

  //     orders.remaining_balance = parseFloat(orders.remaining_balance) - parseFloat(server.amount);
  //     await orders.save();

  //     const transaction = new models.ProductModel.Transaction(creditTransaction);
  //     await transaction.save();

  //     if(orders.remaining_balance == 0){
  //       orders.payment_status = "paid";
  //       orders.save();
  //     }else {
  //       orders.payment_status = "partially_paid";
  //     }


  //     res.redirect(`/admin/order/order-summary/${server.orderId}?success="Payment Added Successfully"`);
  //   }catch(err){
  //     console.log(err)
  //     res.redirect(`/admin/order/order-summary/${req.body.orderId}?error="${encodeURIComponent(err)}"`);
  //   }
  // },

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

  // getUpdatePayment : async (req, res) => {
  //   try{
  //     const user = req.user;  

  //     if(!user){
  //       res.render('a-login',{
  //         title: "Advaxo",
  //         error: "User Not Found"
  //       })   
  //     }  

  //     const payment_id = req.params.paymentId;
      
  //     const payments = await models.ProductModel.Payment.find({ _id: payment_id});
  //     console.log(payments);
  //     const payment = payments[0];
  //     console.log(payment);
  //     const orderId = payments.order_id;

  //     res.render('admin/expense/update-payment', {
  //       orderId,
  //       user,
  //       payment,
  //       error: "Update Payment  for orderId : " + orderId
  //     })

  //   }catch(err){
  //     console.log(err)
  //     res.redirect(`/admin/auth/dashboard?error="${encodeURIComponent(err)}"`);
  //   }
  // },

  // postUpdatePayment: async (req, res) => {
  //   try {
  //     const user = req.user;
  
  //     if (!user) {
  //       return res.render('a-login', {
  //         title: "Advaxo",
  //         error: "User Not Found"
  //       });
  //     }
  
  //     const { transaction_id,date, payment_method, amount } = req.body;
  //     const payment_id = req.params.paymentId;
  
  //     // Update payment details
  //     const payment = await models.ProductModel.Payment.findOneAndUpdate(
  //       { _id : payment_id },
  //     );
  
  //     if (!payment) {
  //       return res.redirect(`/admin/order/order-summary/${payment_id}?error="Payment Not Found"`);
  //     }
  
  //     // Update the order's remaining balance and payment status
  //     const order = await models.ProductModel.Order.findOne({ order_id: payment.order_id });
  //     if (order) {
  //       order.remaining_balance = parseFloat(order.remaining_balance) - parseFloat(amount);
  //       order.payment_status = order.remaining_balance === 0 ? "paid" : "partially_paid";
  //       await order.save();
  //     }
  
  //     // Update the bank balance
  //     const bank = await models.ProductModel.Bank.findOne({ name: payment_method.toUpperCase() });
  //     if (bank) {
  //       bank.amount = parseFloat(bank.amount) + parseFloat(amount);
  //       await bank.save();
  //     }
  
  //     // Create a transaction record
  //     const transaction = new models.ProductModel.Transaction.findOne({transaction_id : transaction_id});

  //     if (!transaction) {
  //       return res.redirect(`/admin/order/order-summary/${payment.order_id}?error="Transaction Not Found"`);
  //     }
  
  //     transaction.type = bank.name, // You can adjust the type based on your requirements
  //     transaction.debited = 0.0,
  //     transaction.credited = amount,
  //     transaction.date = formattedDate

  //     await transaction.save();
  
  //     res.redirect(`/admin/order/order-summary/${payment.order_id}?success="Payment Updated Successfully"`);
  //   } catch (err) {
  //     console.error(err);
  //     res.redirect(`/admin/order/order-summary/${req.body.orderId}?error="${encodeURIComponent(err.message)}"`);
  //   }
  // },
  

  // deletePayment : async (req, res) => {
  //   const referer = req.get('Referer');
  //   try{
  //     const user = req.user;

  //     if(!user){
  //       res.render('a-login',{
  //         title: "Advaxo",
  //         error: "User Not Found"
  //       })   
  //     }

  //     const payment_id = req.params.paymentId;
  //     const payment = await models.ProductModel.Payment.findById(payment_id);
  //     const order_id = payment.order_id;

  //     const orders = await models.ProductModel.Order.findOne({order_id : order_id}).populate("client_id");
  //     orders.remaining_balance = parseFloat(orders.remaining_balance) + parseFloat(payment.amount);
      
  //     const payment_delete = await models.ProductModel.Payment.findByIdAndDelete(payment_id);

  //     await orders.save();

  //     const from = await models.ProductModel.Bank.findOne({name: payment.payment_method});

  //     from.amount = parseFloat(from.amount) - parseFloat(payment.amount);
      
  //     await from.save();

  //     console.log(payment.payment_method)
  //     const creditedTransactionData = {
  //       type: payment.payment_method,
  //       from: `Returned Client Payment`,
  //       to: `${orders.order_id} - ${orders.client_id.name}`,
  //       transaction_id: uuidv4(),
  //       debited: payment.amount,
  //       credited: 0.0,
  //       date: formattedDate
  //     };
  //     const creditedTransaction = new models.ProductModel.Transaction(creditedTransactionData);
  //     await creditedTransaction.save();

  //     res.json({success: true});

  //   }catch(err){
  //     console.log(err)
  //     res.redirect(`${referer}?error=${encodeURIComponent(err)}`);
  //   }
  // },

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
      var expense_from = `Expense - ${server.expense_type}`;
      console.log(server)
      var client_name;
      if(server.expense_type === "Order"){
        expense_from = `Order - ${server.work_order} Expense`;
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
          ledger_id : "none",
          type: money.name, // You can adjust the type based on your requirements
          from: expense_from,
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

        expense.transaction_id = transaction._id;
        await expense.save();

        console.log("Created expense", expense);
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

        
      const transaction = await models.ProductModel.Transaction.findOne({_id : expense.transaction_id});

      transaction.type = payment_method || transaction.type;
      transaction.to = `${server.item}`;
      transaction.debited = server.amount || transaction.debited;
      transaction.credited = 0.0 || transaction.credited;
      transaction.date = server.date || transaction.date;

      await transaction.save();

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

      const transaction = await models.ProductModel.Transaction.find({_id : expense.transaction_id});
      console.log(transaction)
      if(transaction){
        for(let i = 0; i < transaction.length; i++){
          await models.ProductModel.Transaction.findByIdAndDelete(transaction[i]._id);
        }
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
      if(!name){
        res.render('admin/search',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const client = await models.CustomerModel.Client.find({});
      const customers = await models.CustomerModel.Client.findOne({_id : name});

      const customer_id = customers._id;

      const orders = await models.ProductModel.Order.find({ client_id: customer_id })
          .populate("client_id")
          .sort({ order_date: 1 });

      const ordersWithType = orders.map(order => ({
          ...order._doc,
          type: "order",
          date: new Date(order.order_date) // Convert to Date object
      }));

      const payments = await models.CustomerModel.LedgerOrder.find({ client_id: customer_id })
          .sort({ date: 1 });

      const paymentsWithType = payments.map(payment => ({
          ...payment._doc,
          type: "transaction",
          date: new Date(payment.date) // Convert to Date object
      }));

      // Combine the orders and payments into a single array
      const Orderdata = [...ordersWithType, ...paymentsWithType];

      // Sort the combined array by date
      const combinedData = Orderdata.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });



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
        } else if (order.payment_status === 'Unpaid' || order.payment_status === 'partially_paid') {
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

        res.render('admin/reports/reports-order',{user, inventory : orders,clients : client, combinedData, data, options,  error: "Reports"})
      
    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  },

  getUnpaidOrders: async (req, res) => {
    const referer = req.get('Referer');
    try {
      const user = req.user;
  
      if (!user) {
        return res.render('a-login', {
          title: "Advaxo",
          error: "User Not Found"
        });
      }
  
      // Access the client_id from req.query, not req.data
      const client_id = req.query.client_id;
  
      console.log('Client ID:', client_id);
  
      const orders = await models.ProductModel.Order.find({
        payment_status: { $in: ["Unpaid", "partially_paid"] },
        client_id: client_id
      });
  
      console.log('Orders:', orders);
  
      return res.json({
        message: "success",
        status: 200,
        data: orders
      });
  
    } catch (err) {
      console.error(err);
      return res.redirect(`${referer}?error="${encodeURIComponent(err.message)}"`);
    }
  },

  getLedgerSearch : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;
      
      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const vendors = await models.CustomerModel.Client.find();
      res.render('admin/reports/ledger-order',{user, data : null, vendors, error: "Find all Clients Ledger"})

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  },
  postLedgerSearch: async (req, res) => {
    const referer = req.get('Referer');
    try {
      const user = req.user;
  
      if (!user) {
        return res.render('a-login', {
          title: "Advaxo",
          error: "User Not Found"
        });
      }
      
      console.log(req.body);
      const vendors = await models.CustomerModel.Client.find();
      const vendorId = req.body.customer_id;
      if (!vendorId) {
        return res.render('admin/reports/ledger-detail', {
          title: "Advaxo",
          error: "Client Not Found",
          data: null,
          vendors
        });
      }
  
      const ledgers = await models.CustomerModel.LedgerOrder.find({ client_id : vendorId , status : true })
        .populate("client_id")
        .sort({ created_date: -1 });



      res.render('admin/reports/ledger-order', {
        user,
        vendors,
        data: ledgers, // Pass the combined results array with ledgers, bills, and transactions
        error: "Reports"
      });
  
    } catch (err) {
      console.error(err);
      res.redirect(`${referer}?error="${encodeURIComponent(err.message)}"`);
    }
  },

  ledgerDetail : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;
      
      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const ledger_id = req.params.ledger_id;
      console.log(ledger_id)

      const ledgers = await models.CustomerModel.LedgerOrder.findOne({ ledger_id: ledger_id })
        .populate("client_id")
        .sort({ created_date: -1 });

      const bills = await models.ProductModel.Payment.find({ ledger_id: ledger_id })
        .sort({ date : -1 });

      const payments = await models.ProductModel.Transaction.find({ ledger_id : ledger_id })
        .sort({ date : -1 });

        console.log(payments)


      res.render('admin/reports/ledger-detail-wop', {
        user,
        data : ledgers,
        bills,
        transactions : payments, 
        error: "Reports",
        options
      });

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  },

  deleteLedger :  async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const ledger_id = req.params.ledger_id;

      const ledger = await models.CustomerModel.LedgerOrder.findOne({ ledger_id: ledger_id });

      if (ledger) {
          // Set status to false
          ledger.status = false;
          await ledger.save();
      
          // Find all related payments
          const payments = await models.ProductModel.Payment.find({ ledger_id: ledger_id });
      
          for (let i = 0; i < payments.length; i++) {
              const order = payments[i];
              
              // Find the associated order
              const orders = await models.ProductModel.Order.findOne({ order_id: order.order_id }).populate("client_id");

              console.log(orders)
              if (orders) {
                  // Update the remaining balance by reverting the received amount
                  orders.remaining_balance += parseFloat(order.amount);
      
                  // Update payment status based on the new remaining balance
                  if (orders.remaining_balance === orders.grand_total) {
                      orders.payment_status = "Unpaid";
                  } else {
                      orders.payment_status = "partially_paid";
                  }
      
                  // Save the updated order
                  await orders.save();
                  console.log(`Updated Order: ${orders.order_id}`);
              }
      
              // Delete the payment record
              await models.ProductModel.Payment.deleteOne({ _id: order._id });
              console.log(`Deleted Payment: ${order._id}`);
          }

          const transactions = await models.ProductModel.Transaction.find({ ledger_id : ledger_id });

          for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];

            // Delete the transaction record
            await models.ProductModel.Transaction.deleteOne({ _id: transaction._id });
            console.log(`Deleted Transaction: ${transaction._id}`);
          } 
      }

      res.send({status : true, status_code : 200, message : "Ledger deleted successfully"});

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  }
  
}
