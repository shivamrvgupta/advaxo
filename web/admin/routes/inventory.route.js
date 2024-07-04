const router = require('express').Router();
const { InventoryController }= require('../controllers');
const { AuthMiddleware } = require('../middlewares');

router.get('/select-vendor', AuthMiddleware.authenticateToken ,InventoryController.getVendors);
router.get('/update-vendor/:bill_no', AuthMiddleware.authenticateToken ,InventoryController.getUpdateVendors);
router.post('/select-vendor', AuthMiddleware.authenticateToken ,InventoryController.postVendors);
router.post('/update-vendor/:bill_no', AuthMiddleware.authenticateToken ,InventoryController.postUpdateVendors);
router.get('/add-products/:bill_no', AuthMiddleware.authenticateToken ,InventoryController.getAddInventory);
router.get('/product-list', AuthMiddleware.authenticateToken ,InventoryController.getInventoryList);
router.get('/update-product/:product_id', AuthMiddleware.authenticateToken ,InventoryController.getUpdateInventory);
router.get('/all-bills', AuthMiddleware.authenticateToken ,InventoryController.getAllBills);
router.get('/products/:product_id', AuthMiddleware.authenticateToken, InventoryController.getProduct);
router.get('/products-detail/:vendor_id', AuthMiddleware.authenticateToken , InventoryController.productDetails);
router.get('/get-quantity/:product_id', AuthMiddleware.authenticateToken , InventoryController.productDetails);
router.post('/save-bill', AuthMiddleware.authenticateToken , InventoryController.completeBill);
router.get('/add-payment/:vendor_id', AuthMiddleware.authenticateToken, InventoryController.getAddPayment)
router.post('/add-payment/:vendor_id', AuthMiddleware.authenticateToken, InventoryController.postAddPayment);

router.get('/update-payment/:paymentId', AuthMiddleware.authenticateToken, InventoryController.getUpdatePayment)
router.post('/update-payment/:paymentId', AuthMiddleware.authenticateToken, InventoryController.postUpdatePayment);

router.post('/delete-payment/:paymentId', AuthMiddleware.authenticateToken , InventoryController.deletePayment);
router.post('/update-product/:product_id', AuthMiddleware.authenticateToken ,InventoryController.postUpdateInventory);
router.post('/save-products', AuthMiddleware.authenticateToken ,InventoryController.saveProducts);

router.get('/invoice/:vendor_id' , AuthMiddleware.authenticateToken, InventoryController.inventoryBill);

router.delete('/delete-product/:product_id', AuthMiddleware.authenticateToken, InventoryController.deleteInventory);
router.post('/delete-bill/:bill_no', AuthMiddleware.authenticateToken, InventoryController.deleteBill);

router.get('/search', AuthMiddleware.authenticateToken, InventoryController.getSearch);
router.post('/search', AuthMiddleware.authenticateToken, InventoryController.postSearch);
module.exports = router;