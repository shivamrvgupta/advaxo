const router = require('express').Router();
const { OrderControllers }= require('../controllers');
const { AuthMiddleware } = require('../middlewares');

router.get('/all-orders', AuthMiddleware.authenticateToken , OrderControllers.woplist);
router.get('/select-customer', AuthMiddleware.authenticateToken , OrderControllers.getCreateUser);
router.get('/create-order/:userId', AuthMiddleware.authenticateToken , OrderControllers.getDetail);
router.get('/add-products/:orderId', AuthMiddleware.authenticateToken , OrderControllers.getAddProduct);
router.get('/order-summary/:orderId', AuthMiddleware.authenticateToken , OrderControllers.orderSummary);
router.get('/add-expense/:orderId', AuthMiddleware.authenticateToken , OrderControllers.getAddExpense);
router.get('/update-product/:productId', AuthMiddleware.authenticateToken , OrderControllers.getUpdateProducts);
// router.get('/add-payment/:orderId', AuthMiddleware.authenticateToken , OrderControllers.getAddPayment);
// router.get('/update-payment/:paymentId', AuthMiddleware.authenticateToken , OrderControllers.getUpdatePayment);
router.get('/update-expense/:expenseId', AuthMiddleware.authenticateToken , OrderControllers.getUpdateExpense);
router.get('/other-expenses', AuthMiddleware.authenticateToken , OrderControllers.getAllExpenses);
router.get('/add-other-expenses', AuthMiddleware.authenticateToken , OrderControllers.getAddOtherExpenses);
router.get('/update-other-expenses/:expenseId', AuthMiddleware.authenticateToken , OrderControllers.getEditOtherExpenses);
router.get('/validate-orderid/:orderId', AuthMiddleware.authenticateToken , OrderControllers.validOrderId);
router.get('/update-order/:orderId', AuthMiddleware.authenticateToken , OrderControllers.getUpdateOrder);
router.get('/invoice/:order_id' , AuthMiddleware.authenticateToken, OrderControllers.getBill);

router.post('/select-customer', AuthMiddleware.authenticateToken, OrderControllers.postCreateUser);
router.post('/create-order', AuthMiddleware.authenticateToken , OrderControllers.postDetails);
router.post('/save-order', AuthMiddleware.authenticateToken , OrderControllers.completeOrder);
router.post('/save-products', AuthMiddleware.authenticateToken, OrderControllers.postAddproducts);
router.post('/add-expense/:orderId', AuthMiddleware.authenticateToken , OrderControllers.postAddExpense);
router.post('/update-product/:productId', AuthMiddleware.authenticateToken , OrderControllers.postUpdateProducts);
// router.post('/add-payment/:orderId', AuthMiddleware.authenticateToken , OrderControllers.postAddPayment);
// router.post('/update-payment/:paymentId', AuthMiddleware.authenticateToken , OrderControllers.postUpdatePayment);
router.post('/update-expense/:expenseId', AuthMiddleware.authenticateToken , OrderControllers.postUpdateExpense);
router.post('/add-other-expense', AuthMiddleware.authenticateToken , OrderControllers.postAddOtherExpenses);
router.post('/update-other-expenses/:expenseId', AuthMiddleware.authenticateToken , OrderControllers.postEditOtherExpenses);
router.post('/update-order-status/:orderId', AuthMiddleware.authenticateToken , OrderControllers.updateOrderStatus);
router.post('/update-order/:orderId', AuthMiddleware.authenticateToken , OrderControllers.postUpdateOrder);

router.post('/delete-product/:productId', AuthMiddleware.authenticateToken , OrderControllers.deleteProduct);
// router.post('/delete-payment/:paymentId', AuthMiddleware.authenticateToken , OrderControllers.deletePayment);
router.post('/delete-expense/:expenseId', AuthMiddleware.authenticateToken , OrderControllers.deleteExpense);
router.post('/delete-order/:wopId', AuthMiddleware.authenticateToken , OrderControllers.deleteWOP);
router.post('/delete-other-expenses/:expenseId', AuthMiddleware.authenticateToken , OrderControllers.deleteOtherExpenses);

router.get('/search', AuthMiddleware.authenticateToken, OrderControllers.search);
router.get('/expense/search', AuthMiddleware.authenticateToken, OrderControllers.expenseSearch);
router.post('/expense/search', AuthMiddleware.authenticateToken, OrderControllers.getExpenseSearch);

router.post('/search', AuthMiddleware.authenticateToken, OrderControllers.getSearch);

router.get('/ledger-wop', AuthMiddleware.authenticateToken, OrderControllers.getLedgerSearch);
router.post('/ledger-wop', AuthMiddleware.authenticateToken, OrderControllers.postLedgerSearch);

router.get('/get-unpaid-orders', AuthMiddleware.authenticateToken, OrderControllers.getUnpaidOrders);

router.get('/ledger-details/:ledger_id', AuthMiddleware.authenticateToken, OrderControllers.ledgerDetail);

router.post('/delete-ledger/:ledger_id', AuthMiddleware.authenticateToken, OrderControllers.deleteLedger);
module.exports = router;