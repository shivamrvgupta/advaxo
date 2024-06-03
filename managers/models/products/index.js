const Product = require('./products');
const Order = require('./order');
const Purchased = require('./ordered_products');
const Expense = require('./expense');
const Payment = require('./payment');
const GenralExpense = require('./other_expense');
const Stocks = require('./live_stocks');
const Bank = require('./bank');
const Transaction = require('./transactions');
const InventoryPay = require('./payment_inventory');
const Vendor = require('./vendor');
const InventoryBill = require('./inventory_bill');
const BillProduct = require('./billing_inventory');

module.exports = {
    Product,
    Order,
    Vendor,
    Bank,
    Purchased,
    Expense,
    Payment,
    GenralExpense,
    Stocks,
    Transaction,
    InventoryPay,
    InventoryBill,
    BillProduct
}