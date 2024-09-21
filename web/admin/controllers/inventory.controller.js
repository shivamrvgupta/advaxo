const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { format, addDays, isSameISOWeek, getISOWeek, parse } = require('date-fns');
const {generateAccessToken} = require('../middlewares/auth.middleware');
const models = require('../../../managers/models');
const { urlencoded } = require('body-parser');
const { NumberHelper } = require('../../../managers/helpers');

// This would be your token blacklist storage
const options = { day: '2-digit', month: 'short', year: 'numeric' };
const currentDate = new Date();

const formattedDate = currentDate.toISOString().slice(0, 10); // Extract YYYY-MM-DD from ISO string

console.log(formattedDate); // Output the formatted date

module.exports = {
  getVendors: async (req, res) => {
    try {
      const user = req.user;
  
      if (!user) {
        return res.render('a-login', {
          title: "Advaxo",
          error: "User Not Found"
        });
      }
  
      // Fetch and sort vendors, remove duplicates
      const vendors = await models.ProductModel.Vendor.find().sort({ created_date: -1 });
      console.log(vendors)

      res.render('admin/products/vendor', {
        title: "Advaxo",
        user,
        vendors,
        error : "Please Select Vendor",
      });

    } catch (err) {
      console.log(err);
      res.redirect('/admin/inventory/product-list');
    }
  },
  postVendors: async (req, res) => {
    try {
      const user = req.user;
  
      if (!user) {
        return res.render('a-login', {
          title: "Advaxo",
          error: "User Not Found"
        });
      }

      const server = req.body;
      console.log(server)
      const vendorData = {
        name: server.vendor.toUpperCase(),
        address: server.vendor_address,
        phone: server.vendor_phone,
      };

      let vendor_id;
      const checkVendor = await models.ProductModel.Vendor.findOne({ name: vendorData.name });
      console.log(checkVendor)
      if(checkVendor) {
        vendor_id = checkVendor._id;

        const billData = {
          bill_no : server.bill_no,
          gst : server.gst,
          vendor_id: vendor_id,
          date : server.date || formattedDate
        }

        console.log(billData)
        const checkBill = await models.ProductModel.InventoryBill.findOne({ bill_no: billData.bill_no });
        if (checkBill) {
          return res.redirect('/admin/inventory/product-list?error=Bill number already exists');
        }
        const inventoryBill = new models.ProductModel.InventoryBill(billData);
        await inventoryBill.save();
        console.log(inventoryBill)
        return res.redirect(`/admin/inventory/add-products/${billData.bill_no}`);
      }else{
        const vendor = new models.ProductModel.Vendor(vendorData);
        await vendor.save();
 
        vendor_id = vendor._id;
        console.log(vendor)

        const billData = {
          bill_no : server.bill_no,
          gst : server.gst,
          vendor_id: vendor_id,
        }

        console.log("bill",billData)
        const checkBill = await models.ProductModel.InventoryBill.findOne({ bill_no: billData.bill_no });
        if (checkBill) {
          return res.redirect('/admin/inventory/product-list?error=Bill number already exists');
        }
        const inventoryBill = new models.ProductModel.InventoryBill(billData);
        await inventoryBill.save();
  
        return res.redirect(`/admin/inventory/add-products/${server.bill_no}`);
      }
    } catch (err) {
      console.log(err);
      res.redirect('/admin/auth/dashboard');
    }
  },
  getUpdateVendors: async (req, res) => {
    try {
      const user = req.user;
  
      if (!user) {
        return res.render('a-login', {
          title: "Advaxo",
          error: "User Not Found"
        });
      }
  
      const bill_no = req.params.bill_no;
      // Fetch and sort vendors, remove duplicates
      const bill = await models.ProductModel.InventoryBill.findOne({ bill_no : bill_no });
      const vendor = await models.ProductModel.Vendor.findOne({ _id : bill.vendor_id });
      console.log(vendor)

      res.render('admin/products/update-vendor', {
        title: "Advaxo",
        user,
        vendor,
        bill,
        error : "Please Select Vendor",
      });

    } catch (err) {
      console.log(err);
      res.redirect('/admin/inventory/product-list');
    }
  },
  postUpdateVendors: async (req, res) => {
    try {
      const user = req.user;
  
      if (!user) {
        return res.render('a-login', {
          title: "Advaxo",
          error: "User Not Found"
        });
      }

      const server = req.body;

      const vendorData = {
        name: server.vendor.toUpperCase(),
        address: server.vendor_address,
        phone: server.vendor_phone,
        phone: server.gst,
      };

      console.log(vendorData)
      let vendor_id;
      const bill = await models.ProductModel.InventoryBill.findOne({ bill_no : server.bill_no });
      const checkVendor = await models.ProductModel.Vendor.findOne({ _id : bill.vendor_id });
      console.log(checkVendor)

      if(!checkVendor) {
        return res.redirect(`/admin/inventory/products-detail/${server.bill_no}?error=Vendor Not Found`);
      } 

      checkVendor.name = vendorData.name || checkVendor.name;
      checkVendor.address = vendorData.address || checkVendor.address;
      checkVendor.phone = vendorData.phone || checkVendor.phone;
      await checkVendor.save();

      bill.gst = server.gst || bill.gst;
      bill.date = server.date || bill.date || formattedDate;

      await bill.save()

      return res.redirect(`/admin/inventory/products-detail/${server.bill_no}?success=Vendor Updated`);
    } catch (err) {
      console.log(err);
      res.redirect('/admin/auth/dashboard');
    }
  },
  //GET Add Inventory
  getAddInventory: async (req, res) => {
    try {
      const user = req.user;
  
      if (!user) {
        return res.render('a-login', {
          title: "Advaxo",
          error: "User Not Found"
        });
      }
      
      const bill_no = req.params.bill_no;
      console.log(bill_no)
      // Fetch and sort products, remove duplicates
      const products = await models.ProductModel.Product.find().sort({ created_date: -1 });
      const uniqueProducts = [...new Map(products.map(p => [p.name, p])).values()];
  
      const purchased_inventory = await models.ProductModel.BillProduct.find({ bill_no: bill_no }).sort({ created_date: -1 });
      res.render('admin/products/add-products', {
        title: "Advaxo",
        bill_no,
        user,
        products: uniqueProducts,
        purchase : purchased_inventory,
        error: "Add Product for bill : " + bill_no
      });
    } catch (err) {
      const user = req.user;
      console.log(err);
    }
  },  

  getInventoryList : async (req, res) => {
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }
      console.log("products list hitted")
      
      const products = await models.ProductModel.BillProduct.find().sort({ created_date: -1 });
      console.log(products)
      const live_stock = await models.ProductModel.Stocks.find().sort({ created_date: -1 }).populate('product_id');

      console.log(live_stock)

      res.render('admin/products/product-list',{
          title: "Advaxo" ,
          user,
          products,
          options,
          live_stock,
          error: "Add New Product"
      })
    }catch(err){
      console.log(err)
      res.redirect(`/admin/inventory/product-list?error="${encodeURIComponent(err)}"`)
    }
  },
  
  saveProducts: async (req, res) => {
    const referer = req.get('Referer');
    try {
        const user = req.user;
        if (!user) {
            return res.render('a-login', {
                title: "Advaxo",
                error: "User Not Found"
            });
        }

        const server = req.body;
        console.log(server);
        
        const productData = {
            bill_no: server.orderId,
            name: server.product.toLowerCase(),
            unit: server.unit,
            date: server.date || formattedDate,
            width: parseFloat(server.width) || 0,
            height: parseFloat(server.height) || 0,
            quantity: parseFloat(server.quantity) || 0,
            area: parseFloat(server.area) || 0,
            rate: parseFloat(server.rate),
            amount: parseFloat(server.amount),
        };

        const name = server.product.toLowerCase();
        let billed_products = await models.ProductModel.BillProduct.find({ name: name, bill_no: server.orderId });

        if (billed_products.length > 0) {
            return res.redirect(`${referer}/?error="Product Already Exists"`);
        } else {
            // Save new BillProduct
            billed_products = new models.ProductModel.BillProduct(productData);
            await billed_products.save();

            // Update the grand total in InventoryBill
            const bill = await models.ProductModel.InventoryBill.findOne({ bill_no: server.orderId });
            console.log(bill);
            bill.grand_total = parseFloat(bill.grand_total) + parseFloat(server.amount);
            await bill.save();

            // Find or create the Product in Product model
            const saveProducts = await models.ProductModel.Product.findOne({ name: name });
            let stock_pID;

            if (!saveProducts) {
                const product = new models.ProductModel.Product(productData);
                await product.save();
                stock_pID = product._id;
            } else {
                stock_pID = saveProducts._id;

                if (server.unit === 'SQRFT') {
                    saveProducts.width = parseFloat(saveProducts.width) + parseFloat(server.width);
                    saveProducts.height = parseFloat(saveProducts.height) + parseFloat(server.height);
                    saveProducts.quantity = parseFloat(saveProducts.quantity) + parseFloat(server.quantity);
                    saveProducts.area = parseFloat(saveProducts.area) + parseFloat(server.area);
                    saveProducts.rate = parseFloat(server.rate);
                    await saveProducts.save();
                } else {
                    saveProducts.quantity = parseFloat(saveProducts.quantity) + parseFloat(server.quantity);
                    saveProducts.rate = parseFloat(server.rate);
                    await saveProducts.save();
                }
            }

            // Create Stock entry with adjusted variable name to avoid conflict
            const stockData = {
                product_id: stock_pID,
                unit: server.unit,
                height: parseFloat(server.height) || 0,
                width: parseFloat(server.width) || 0,
                area: parseFloat(server.area) || 0,
                quantity: parseFloat(server.quantity) || 0,
                rate: parseFloat(server.rate),
                amount: parseFloat(server.amount),
            };
            const productStock = new models.ProductModel.Stocks(stockData);
            await productStock.save();
        }

        res.redirect(`/admin/inventory/product-list/?success="Product Added Successfully"`);
    } catch (err) {
        console.log(err);
        res.redirect(`${referer}/?error=${encodeURIComponent(err)}`);
    }
},


      getUpdateInventory : async (req, res) => {
        try{
          const user = req.user;

          if(!user){
            res.render('a-login',{
              title: "Advaxo",
              error: "User Not Found"
            })   
          }

          const product_id = req.params.product_id;

          const product = await models.ProductModel.BillProduct.findById(product_id);

          res.render('admin/products/update-products',{
              title: "Advaxo" ,
              user,
              product,
              error: "Add New Product"
          })
        }catch(err){
          console.log(err)
          res.redirect(`/admin/auth/dashboard?error=${encodeURIComponent(err)}`)
        }
      },

      postUpdateInventory: async (req, res) => {
        const referer = req.get('Referer');
        try {
          const user = req.user;
          if (!user) {
            return res.render('a-login', {
              title: "Advaxo",
              error: "User Not Found"
            });
          }
          const product_id = req.params.product_id
          const server = req.body;
          console.log(server);
          const productData = {
            name: server.product.toLowerCase(),
            unit: server.unit,
            date: server.date || formattedDate,
            width: parseFloat(server.width) || 0,
            height: parseFloat(server.height) || 0,
            quantity: parseFloat(server.quantity) || 0,
            area: parseFloat(server.area) || 0,
            rate: parseFloat(server.rate) || 0,
            amount: parseFloat(server.amount) || 0,
          };
      
          let billed_product = await models.ProductModel.BillProduct.findOne({ _id : product_id });
          const allProducts = await models.ProductModel.BillProduct.find({ name : billed_product.name });

          if (allProducts.length > 0) {
            for (let product of allProducts) {
              product.name = productData.name; // Set the new name you want to update to
              await product.save(); // Save the changes to the database
            }
          }
          const name = billed_product.name.toLowerCase();
          if (!billed_product) {
            return res.redirect(`${referer}/?error="Product Not Found"`);
          } else {
            const oldAmount = parseFloat(billed_product.amount) || 0;
            const oldWidth = parseFloat(billed_product.width) || 0;
            const oldHeight = parseFloat(billed_product.height) || 0;
            const oldQuantity = parseFloat(billed_product.quantity) || 0;
            const oldArea = parseFloat(billed_product.area) || 0;
      
            // Update the billed product with new data
            billed_product.width = productData.width;
            billed_product.height = productData.height;
            billed_product.quantity = productData.quantity;
            billed_product.area = productData.area;
            billed_product.rate = productData.rate;
            billed_product.amount = productData.amount;
            await billed_product.save();
      
            const bill = await models.ProductModel.InventoryBill.findOne({ bill_no: billed_product.bill_no });
            bill.grand_total = parseFloat(bill.grand_total) - oldAmount + productData.amount;
            await bill.save();
      
            const saveProduct = await models.ProductModel.Product.findOne({ name: name });
            let stock_pID;
            if (!saveProduct) {
              return res.redirect(`${referer}/?error="Product Not Found in Inventory"`);
            } else {
              stock_pID = saveProduct._id;
              saveProduct.name = server.product || saveProduct.name;            
              if (billed_product.unit === 'SQRFT') {
                saveProduct.width = parseFloat(saveProduct.width) - oldWidth + productData.width;
                saveProduct.height = parseFloat(saveProduct.height) - oldHeight + productData.height;
                saveProduct.area = parseFloat(saveProduct.area) - oldArea + productData.area;
              } else {
                saveProduct.quantity = parseFloat(saveProduct.quantity) - oldQuantity + productData.quantity;
              }
              saveProduct.rate = productData.rate;
              await saveProduct.save();
            }
      
            const stockUpdate = await models.ProductModel.Stocks.findOne({ product_id: stock_pID });
            if (!stockUpdate) {
              return res.redirect(`${referer}/?error="Stock Not Found"`);
            } else {
              if (billed_product.unit === 'SQRFT') {
                stockUpdate.width = parseFloat(stockUpdate.width) - oldWidth + productData.width;
                stockUpdate.height = parseFloat(stockUpdate.height) - oldHeight + productData.height;
                stockUpdate.area = parseFloat(stockUpdate.area) - oldArea + productData.area;
              } else {
                stockUpdate.quantity = parseFloat(stockUpdate.quantity) - oldQuantity + productData.quantity;
              }
              stockUpdate.rate = productData.rate;
              await stockUpdate.save();
            }
          }
      
          res.redirect(`/admin/inventory/products-detail/${billed_product.bill_no}?success="Product Updated Successfully"`);
        } catch (err) {
          console.log(err);
          res.redirect(`${referer}/?error=${encodeURIComponent(err)}`);
        }
      },
    
      deleteInventory: async (req, res) => {
        const referer = req.get('Referer');
        try {
          const user = req.user;
          if (!user) {
            return res.render('a-login', {
              title: "Advaxo",
              error: "User Not Found"
            });
          }
          const product_id = req.params.product_id;

          const billed_product = await models.ProductModel.BillProduct.findOne({ _id: product_id });
          const expense = await models.ProductModel.Expense.find({ name : billed_product.name });
      
          if (expense.length > 0) {
            const errorMsg = "Product has been issued for Work Order";
            return res.status(400).json(errorMsg);
          } else {
            let billed_product = await models.ProductModel.BillProduct.findOne({ _id: product_id });
            if (!billed_product) {
              return res.redirect(`${referer}/?error="Product Not Found"`);
            }
            
            const oldAmount = parseFloat(billed_product.amount) || 0;
            console.log("Old Amount",oldAmount);
            const oldWidth = parseFloat(billed_product.width) || 0;
            console.log("Old Width",oldWidth);
            const oldHeight = parseFloat(billed_product.height) || 0;
            console.log("Old Height",oldHeight);
            const oldQuantity = parseFloat(billed_product.quantity) || 0;
            console.log("Old Quantity",oldQuantity);
            const oldArea = parseFloat(billed_product.area) || 0;
            console.log("Old Area",oldArea);
        
            // Update the InventoryBill to reduce the grand_total
            const bill = await models.ProductModel.InventoryBill.findOne({ bill_no: billed_product.bill_no });
            if (bill) {
              bill.grand_total = parseFloat(bill.grand_total) - oldAmount;
              await bill.save();
            } else {
              return res.redirect(`${referer}/?error="Inventory Bill Not Found"`);
            }
            
            // Update the Product inventory
            const saveProduct = await models.ProductModel.Product.findOne({ name: billed_product.name.toLowerCase() });
            if (saveProduct) {
              if (billed_product.unit === 'SQRFT') {
                saveProduct.width = parseFloat(saveProduct.width) - oldWidth;
                saveProduct.height = parseFloat(saveProduct.height) - oldHeight;
                saveProduct.area = parseFloat(saveProduct.area) - oldArea;
              } else {
                saveProduct.quantity = parseFloat(saveProduct.quantity) - oldQuantity;
              }
              await saveProduct.save();
            } else {
              return res.redirect(`${referer}/?error="Product Not Found in Inventory"`);
            }
        
            // Update the Stock inventory
            const stockUpdate = await models.ProductModel.Stocks.findOne({ product_id: saveProduct._id });
            if (stockUpdate) {
              if (billed_product.unit === 'SQRFT') {
                stockUpdate.width = parseFloat(stockUpdate.width) - oldWidth;
                stockUpdate.height = parseFloat(stockUpdate.height) - oldHeight;
                stockUpdate.area = parseFloat(stockUpdate.area) - oldArea;
              } else {
                stockUpdate.quantity = parseFloat(stockUpdate.quantity) - oldQuantity;
              }
              await stockUpdate.save();
            } else {
              return res.redirect(`${referer}/?error="Stock Not Found"`);
            }
        
            // Finally, delete the billed product
            await models.ProductModel.BillProduct.deleteOne({ _id: product_id });
        
            res.redirect(`/admin/inventory/products-detail/${billed_product.bill_no}?success="Product Deleted Successfully"`);
          }
        } catch (err) {
          console.log(err);
          res.redirect(`${referer}/?error=${encodeURIComponent(err)}`);
        }
      },
      

    getProduct : async (req, res) => {
      const referer = req.get('Referer');
      try{
        const user = req.user;

        if(!user){
          res.render('a-login',{
            title: "Advaxo",
            error: "User Not Found"
          })   
        }

        const product_id = req.params.product_id;

        const product = await models.ProductModel.Stocks.findById(product_id);
        
        console.log(product)

        res.json(product)
      }catch(err){
        console.log(err)
        res.redirect(`${referer}?error=${encodeURIComponent(err)}`)
      }
    },

    getSameProduct : async (req, res) => {
      const referer = req.get('Referer');
      try{
        const user = req.user;

        if(!user){
          res.render('a-login',{
            title: "Advaxo",
            error: "User Not Found"
          })   
        }

        const product_id = req.params.product_id;

        const product = await models.ProductModel.Product.findById(product_id);
        
        console.log(product)

        res.json(product)
      }catch(err){
        console.log(err)
        res.redirect(`${referer}?error=${encodeURIComponent(err)}`)
      }
    },

    productDetails : async (req, res) => {
      const referer = req.get('Referer');
      try{
        const user = req.user;

        if(!user){
          res.render('a-login',{
            title: "Advaxo",
            error: "User Not Found"
          })   
        }

        const vendor_id = req.params.vendor_id;

        const bill = await models.ProductModel.InventoryBill.findOne({bill_no : vendor_id}).sort({ created_date: -1 });
        const vendor = await models.ProductModel.Vendor.findOne({ _id : bill.vendor_id}).sort({ created_date: -1 });
        console.log(bill)
        const products = await models.ProductModel.BillProduct.find({bill_no : vendor_id}).sort({ created_date: -1 });
        const payment = await models.ProductModel.InventoryPay.find({bill_no : vendor_id}).sort({ created_date: -1 });

        console.log(vendor)

        res.render('admin/products/product-detail',{user ,bill,vendor_id, vendor,options,products, payment , error: "Product Details"})
      }catch(err){
        console.log(err);
        res.redirect(`${referer}?error=${encodeURIComponent(err)}`)
      }
    },
    getAllBills : async (req, res) => {
      const referer = req.get('Referer');
      try{
        const user = req.user;

        if(!user){
          res.render('a-login',{
            title: "Advaxo",
            error: "User Not Found"
          })   
        }

        const vendor = await models.ProductModel.InventoryBill.find().populate('vendor_id').sort({ created_date: -1 });

        res.render('admin/products/all-bills',{user ,vendor,error: "All Bills"})
      }catch(err){
        console.log(err)
        res.redirect(`${referer}?error=${encodeURIComponent(err)}`)
      }
    },
    getAddPayment : async (req, res) => {
      const referer = req.get('Referer');
      try{  
        const user = req.user;

        if(!user){
          res.render('a-login',{
            title: "Advaxo",
            error: "User Not Found"
          })   
        }
        const vendor_id = req.params.vendor_id;
        const vendor = await models.ProductModel.InventoryBill.findOne({bill_no : vendor_id});
        const orderId = vendor.bill_no;
        res.render('admin/products/add-payment', {
          vendor_id,
          orderId,
          vendor,
          user,
          error: "Add Payment for Bill : " + vendor_id})
      }catch(err){
        console.log(err)
        res.redirect(`${referer}?error=${encodeURIComponent(err)}`)
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
          bill_no : server.vendor_id,
          date : server.date,
          payment_method : server.payment_method,
          amount: server.amount,
        } 

        const payment = new models.ProductModel.InventoryPay(paymentData);
        await payment.save();

        const vendor = await models.ProductModel.InventoryBill.findOne({bill_no : req.params.vendor_id}).populate('vendor_id');
        console.log(vendor)


        const money = await models.ProductModel.Bank.findOne({name : server.payment_method.toUpperCase()});
        money.amount = parseFloat(money.amount) - parseFloat(server.amount);
        await money.save();

        const creditTransaction = {
          type: money.name, // You can adjust the type based on your requirements
          from: money.name,
          to: `Inventory Payment -- ${vendor.vendor_id.name}`,
          transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
          debited: server.amount,
          credited: 0.0,
          date: server.date || formattedDate
        }; 

        vendor.remaining_balance = parseFloat(vendor.remaining_balance) + parseFloat(server.amount); 
        await vendor.save();

        const transaction = new models.ProductModel.Transaction(creditTransaction);
        await transaction.save();

        if(vendor.remaining_balance !=  0){
          vendor.payment_status = "paid";
          vendor.save();
        }else {
          vendor.payment_status = "partially_paid";
          vendor.save();
        }


        res.redirect(`/admin/inventory/products-detail/${server.vendor_id}?success="Payment Added Successfully"`);
      }catch(err){
        console.log(err)
        res.redirect(`/admin/inventory/products-detail/${req.body.vendor_id}?error="${encodeURIComponent(err)}"`);
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
        
        const payments = await models.ProductModel.InventoryPay.find({ _id: payment_id});
        console.log(payments);
        const payment = payments[0];
        const vendor = await models.ProductModel.InventoryBill.findOne({bill_no : payment.bill_no}).populate('vendor_id');
        console.log(payment);
        const orderId = payments.vendor_id;

        res.render('admin/products/update-payment', {
          orderId,
          user,
          vendor,
          payment,
          error: "Update Payment  for Vendor : " + orderId
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
        const payment = await models.ProductModel.InventoryPay.findById(payment_id);

        prev_amount = parseFloat(payment.amount);

        const orders = await models.ProductModel.InventoryBill.findOne({bill_no : payment.bill_no});
        console.log(orders)
        order_id = orders.bill_no;
        const money = await models.ProductModel.Bank.findOne({name : server.payment_method});
        const payment_method = server.payment_method || payment.payment_method ;
        const date = server.date || payment.date || formattedDate;

        const difference = Math.abs(Number(payment.amount) - Number(server.amount));
        // If difference is less than 0
        console.log("Difference",difference);
        

        console.log("Remaining Balance",orders.remaining_balance);
        console.log("Remaining Balance",Number(orders.remaining_balance) + difference);
        console.log(difference);
        console.log(server.amount);
        console.log(payment.amount);
        console.log(payment.amount < server.amount);
        console.log(payment.amount > server.amount);

        if (payment.amount < server.amount) {
          // Handle payment amount less than server amount
          console.log("I am here in More");
          const from = await models.ProductModel.Bank.findOne({ name: payment_method });
        
          from.amount = (Number(from.amount) + Number(payment.amount)) - Number(server.amount);
          await from.save();
        
          const debitTransactionData = {
            type: payment_method,
            from: payment_method,
            to: `Vendor ${orders.bill_no}`,
            transaction_id: uuidv4(),
            debited: difference,
            credited: 0.0,
            date: date
          };

          orders.remaining_balance = parseFloat(orders.remaining_balance ) + (parseFloat(server.amount) - parseFloat(payment.amount));
          console.log("paid --- ",orders.remaining_balance);
          await orders.save();          
          const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
          await debitTransaction.save();

        } else if (payment.amount > server.amount) {
          // Handle payment amount greater than server amount
          console.log("I am here in Less");
          const from = await models.ProductModel.Bank.findOne({ name: payment_method });
          console.log(from);
          console.log(from.amount);
          console.log(payment.amount);
          console.log(server.amount);
          from.amount = (Number(from.amount) + Number(payment.amount)) - Number(server.amount);
          await from.save();
          console.log(from);
        
          const debitTransactionData = {
            type: payment_method,
            from: `Vendor Refund ${orders.bill_no}`,
            to: payment_method,
            transaction_id: uuidv4(),
            debited:  0.0,
            credited: difference,
            date: date
          };
        
          console.log(debitTransactionData);
          const debitTransaction = new models.ProductModel.Transaction(debitTransactionData);
          await debitTransaction.save();

          console.log("server --- ",server.amount);
          console.log("prev --- ",payment.amount);
          orders.remaining_balance = parseFloat(orders.remaining_balance ) - (parseFloat(payment.amount) - parseFloat(server.amount));
          console.log("remaing --- ",orders.remaining_balance);

          await orders.save();
        } else {
          // Handle equal payment and server amounts
          console.log("I am here in Equal");
        }

        payment.date = server.date || payment.date;
        payment.payment_method = server.payment_method || payment.payment_method;
        payment.amount = server.amount;
        await payment.save();
        
        console.log(parseFloat(orders.grand_total))
        console.log(parseFloat(server.amount))

        await orders.save();
        if(orders.remaining_balance != 0){
          orders.payment_status = "paid";
          orders.save();
        }else {
          orders.payment_status = "partially_paid";
        }


        res.redirect(`/admin/inventory/products-detail/${order_id}?success="Payment Added Successfully"`);
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
        const payment = await models.ProductModel.InventoryPay.findById(payment_id);
        const bill_no = payment.bill_no;
        const bill = await models.ProductModel.InventoryBill.findOne({bill_no : bill_no})
        const order_id = bill.vendor_id;
        console.log("Vendor Id",order_id)
        console.log("Payemnt Id",payment_id)
        const orders = await models.ProductModel.Vendor.findOne({_id : order_id});
        orders.remaining_balance = parseFloat(orders.remaining_balance) + parseFloat(payment.amount);
        
        const payment_delete = await models.ProductModel.InventoryPay.findByIdAndDelete(payment_id);

        await orders.save();

        const from = await models.ProductModel.Bank.findOne({name: payment.payment_method});

        from.amount = parseFloat(from.amount) + parseFloat(payment.amount);
        
        await from.save();

        console.log(payment.payment_method)
        const creditedTransactionData = {
          type: payment.payment_method,
          from: `Vendor Refund ${orders.bill_no} - ${orders.name}`,
          to: payment.payment_method,
          transaction_id: uuidv4(),
          debited: 0.0,
          credited: payment.amount,
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

    getQuantity : async (req, res) => {
      const referer = req.get('Referer');
      try{
        const user = req.user;

        if(!user){
          res.render('a-login',{
            title: "Advaxo",
            error: "User Not Found"
          })   
        }

        const product_id = req.params.product_id;

        const product = await models.ProductModel.Product.findById(product_id);

        if(req.body.quantity > product.quantity){
          res.json({message : "Product Quantity Not Available" ,success: false, quantity: product.quantity});
        }else{
          res.json({message : "Success " , success: true, quantity: product.quantity});
        }
        

      }catch(err){
        console.log(err)
        res.redirect(`${referer}?error=${encodeURIComponent(err)}`);
      }
    },
    completeBill : async (req, res) => {
      try{
        const user = req.user;

        if(!user){  
          res.render('a-login',{
            title: "Advaxo",
            error: "User Not Found"
          })   
        }

        const orderId = req.body.orderId; 

        res.redirect(`/admin/inventory/products-detail/${orderId}?success="Order Created Successfully"`);
      }catch(err){
        console.log(err)
        res.redirect(`/admin/order/select-customer?error="${encodeURIComponent(err)}"`);
      }
    },

  inventoryBill : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const vendor_id = req.params.vendor_id;

      const bill = await models.ProductModel.InventoryBill.findOne({bill_no : vendor_id}).sort({ created_date: -1 });
      const totalPriceInWords = NumberHelper.convertNumberToWords(bill.grand_total);
      const vendor = await models.ProductModel.Vendor.findOne({ _id : bill.vendor_id}).sort({ created_date: -1 });
      console.log(bill)
      const products = await models.ProductModel.BillProduct.find({bill_no : vendor_id}).sort({ created_date: -1 });
      const payment = await models.ProductModel.InventoryPay.find({bill_no : vendor_id}).sort({ created_date: -1 });

      console.log(vendor)

      res.render('admin/invoices/inventory-bill',{user ,bill,vendor_id, totalPriceInWords, vendor,options,products, payment , error: "Product Details"})
    }catch(err){
      console.log(err);
      res.redirect(`${referer}?error=${encodeURIComponent(err)}`)
    }
  },
  deleteBill : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;

      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      const bill_no = req.params.bill_no;
      const bill = await models.ProductModel.InventoryBill.findOne({bill_no : bill_no});
      console.log("Bill --- ",bill)
      const vendor = await models.ProductModel.Vendor.findOne({ _id : bill.vendor_id});
      console.log("Vendor --- ",vendor)
      const billed_products = await models.ProductModel.BillProduct.find({bill_no : bill_no});
      console.log("Deleted Products: ", billed_products);

      if(billed_products.length == 0) {
        console.log("No Products Found");
        const deleteBill = await models.ProductModel.InventoryBill.findByIdAndDelete(bill._id);
        res.json({success: true , message : "Deleted Successfully"});
      }else{
        const expense = await models.ProductModel.Expense.find({ name : billed_products[0].name});  
      if (expense.length > 0) {
        console.log("Products already in use :", billed_products[0].name);
        res.json({success: true , message : "Cannot Delete Product is already issued to Work Order"});
      }else{
        for (const billed_product of billed_products) {
          const expensesWithSameName = await models.ProductModel.BillProduct.find({ bill_no: billed_product.bill_no , name : billed_product.name});
          console.log("Expenses with same bill No :", expensesWithSameName);
  
         
  
          const products = await models.ProductModel.Product.findOne({ name : billed_product.name});
  
          if (products) {
            const deduct = expensesWithSameName;
  
            const totalArea = deduct.reduce((sum, e) => sum + parseFloat(e.area), 0).toFixed(2);
            const totalQuantity = deduct.reduce((sum, e) => sum + parseFloat(e.quantity), 0).toFixed(2);
            const totalAmount = deduct.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2);
            const totalHeight = deduct.reduce((sum, e) => sum + parseFloat(e.height), 0).toFixed(2);
            const totalWidth = deduct.reduce((sum, e) => sum + parseFloat(e.width), 0).toFixed(2);
  
            const deductUnit = deduct.length > 0 ? deduct[0].unit : '';
            const quantityChange = parseFloat(products.quantity) - parseFloat(totalQuantity);
            const areaChange = deductUnit === 'SQRFT' ? parseFloat(products.area) - parseFloat(totalArea) : 0;
            const amountChange = parseFloat(products.amount) - parseFloat(totalAmount);
            const heightChange = parseFloat(products.height) - parseFloat(totalHeight);
            const widthChange = parseFloat(products.width) - parseFloat(totalWidth);
  
            products.quantity = quantityChange;
            products.area = areaChange;
            products.amount = amountChange;
            products.height = heightChange;
            products.width = widthChange;
  
            await products.save();
            console.log("Updated Product:", products);
  
            const live_stocks = await models.ProductModel.Stocks.findOne({product_id : products._id});
            if (live_stocks) {
                const deduct = expensesWithSameName;
  
                const totalArea = deduct.reduce((sum, e) => sum + parseFloat(e.area), 0).toFixed(2);
                const totalQuantity = deduct.reduce((sum, e) => sum + parseFloat(e.quantity), 0).toFixed(2);
                const totalAmount = deduct.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2);
  
                const deductUnit = deduct.length > 0 ? deduct[0].unit : '';
                const quantityChange = parseFloat(totalQuantity) - parseFloat(live_stocks.quantity);
                const areaChange = deductUnit === 'SQRFT' ?  parseFloat(totalArea) - parseFloat(live_stocks.area) : 0;
                const amountChange = parseFloat(live_stocks.amount) - parseFloat(totalAmount) ;
  
                live_stocks.quantity = quantityChange;
                live_stocks.area = areaChange;
                live_stocks.amount = amountChange;
                
                await live_stocks.save();
                console.log("Updated Live Stock:", live_stocks);
  
            } else {
                console.log("Live Stock not found for product ID:", products._id);
            }
            const deleteExpense = await models.ProductModel.BillProduct.findOneAndDelete(billed_product._id);
          } else {
              console.log("Products not found:", billed_product.name);
          }
          
  
          const payments = await models.ProductModel.InventoryPay.find({bill_no : bill_no});
          
          if(payments){
            for (const payment of payments) {
              const from = await models.ProductModel.Bank.findOne({ name : payment.payment_method});
              from.amount = (Number(from.amount) + Number(payment.amount));
              await from.save();
  
              const debitTransactionData = {
                type: from.name, // You can adjust the type based on your requirements
                from: "Inventory Return -- "  + vendor.name,
                to: from.name,
                transaction_id: uuidv4(), // Assuming bank _id is unique identifier for transaction
                debited: 0.0,
                credited: payment.amount,
                date: formattedDate
              }; 
              
              const debitTransaction = await models.ProductModel.Transaction.create(debitTransactionData);
              await debitTransaction.save();
  
              const deletePayment = await models.ProductModel.InventoryPay.findByIdAndDelete(payment._id);
  
              console.log(deletePayment);
            }
          }
  
          const deleteBill = await models.ProductModel.InventoryBill.findByIdAndDelete(bill._id);
          
          res.json({success: true , message : "Bill Deleted Successfully"});
        }
      }
      }

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error=${encodeURIComponent(err)}`);
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

      const vendors = await models.ProductModel.Vendor.find();
      res.render('admin/reports/reports-inventory',{user, data : null, vendors, error: "Find all Vendors Reports"})

    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  },
  postSearch : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;
      console.log(req.body);
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


      const customers = await models.ProductModel.Vendor.find();
      const vendors = await models.ProductModel.Vendor.findOne({_id : name});
      const customer_id = vendors._id;

      const bills = await models.ProductModel.InventoryBill.find({vendor_id : customer_id}).populate("vendor_id").sort({ date : -1 });
      
      const billWithType = bills.map(bill => ({
        ...bill._doc,
        type: "bill",
        date: new Date(bill.date) // Convert to Date object
      }));
      
      const ledger = await models.CustomerModel.LedgerIventory.find({vendor_id : customer_id, status : true }).sort({ date : -1 });
      console.log(ledger);

      const LedgerWithType = ledger.map(bill => ({
        ...bill._doc,
        type: "ledger",
        date: new Date(bill.date) // Convert to Date object
      }));

      console.log("Testt ",LedgerWithType);
      const billData = [...billWithType, ...LedgerWithType];

      const combinedData = billData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      })

      let overallGrandTotal = 0.0;
      let overallRemainingBalance = 0.0;
      let overallClientBalance = 0.0;
      let paidOrderCount = 0;
      let unpaidOrderCount = 0;
      let totalOrders = bills.length;
      
      bills.forEach(bill => {
        console.log(bill);
          overallGrandTotal += parseFloat(bill.grand_total);
          overallRemainingBalance += parseFloat(bill.remaining_balance);
          overallClientBalance += parseFloat(bill.client_balance);
      
          if (bill.payment_status === 'paid') {
              paidOrderCount++;
          } else if (bill.payment_status === 'Unpaid' || bill.payment_status === 'partially_paid') {
              unpaidOrderCount++;
          }
      });

        const data = {
          client_name : bills[0].vendor_id.name,
          grand_total : overallGrandTotal,
          remaining_balance : overallRemainingBalance,
          client_balance : overallClientBalance,  
          paid_order_count : paidOrderCount,
          unpaid_order_count : unpaidOrderCount,
          total_orders : totalOrders        
        }

        res.render('admin/reports/reports-inventory',{user, inventory : bills,vendors : customers, combinedData, data, options,  error: "Reports"})
      
    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
    }
  },

  getUnpaidBills : async (req, res) => {
    const referer = req.get('Referer');
    try{
      const user = req.user;
      
      if(!user){
        res.render('a-login',{
          title: "Advaxo",
          error: "User Not Found"
        })   
      }

      // Access the client_id from req.query, not req.data
      const client_id = req.query.client_id;
  
      console.log('Vendor ID:', client_id);
  
      const orders = await models.ProductModel.InventoryBill.find({
        payment_status: { $in: ["Unpaid", "partially_paid"] },
        vendor_id: client_id
      });
  
      console.log('Orders:', orders);
  
      return res.json({
        message: "success",
        status: 200,
        data: orders
      });
    }catch(err){
      console.log(err)
      res.redirect(`${referer}?error="${encodeURIComponent(err)}"`);
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

      const vendors = await models.ProductModel.Vendor.find();
      res.render('admin/reports/ledger-inventory',{user, data : null, vendors, error: "Find all Vendors Ledger"})

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
  
      const vendorId = req.body.customer_id;
      if (!vendorId) {
        return res.render('admin/search', {
          title: "Advaxo",
          error: "Vendor Not Found"
        });
      }
  
      const vendors = await models.ProductModel.Vendor.find();
      const ledgers = await models.CustomerModel.LedgerIventory.find({ vendor_id: vendorId , status : true })
        .populate("vendor_id")
        .sort({ created_date: -1 });



      res.render('admin/reports/ledger-inventory', {
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

      const ledgers = await models.CustomerModel.LedgerIventory.findOne({ ledger_id: ledger_id })
        .populate("vendor_id")
        .sort({ created_date: -1 });

      const bills = await models.ProductModel.InventoryPay.find({ ledger_id: ledger_id })
        .sort({ date : -1 });

      const payments = await models.ProductModel.Transaction.find({ ledger_id : ledger_id })
        .sort({ date : -1 });

        console.log(payments)


      res.render('admin/reports/ledger-detail', {
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

      const ledger = await models.CustomerModel.LedgerIventory.findOne({ ledger_id: ledger_id });

      if (ledger) {
          // Set status to false
          ledger.status = false;
          await ledger.save();
      
          // Find all related payments
          const payments = await models.ProductModel.InventoryPay.find({ ledger_id: ledger_id });
      
          for (let i = 0; i < payments.length; i++) {
              const order = payments[i];
              
              // Find the associated order
              const orders = await models.ProductModel.InventoryBill.findOne({ bill_no: order.bill_no }).populate("vendor_id");

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
              await models.ProductModel.InventoryPay.deleteOne({ _id: order._id });
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

