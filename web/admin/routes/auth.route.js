const router = require('express').Router();
const { AuthController , ExpenseController }= require('../controllers');
const { AuthMiddleware, MulterMiddleware } = require('../middlewares');

router.get('/login', AuthController.getLogin);
router.get('/dashboard', AuthMiddleware.authenticateToken ,AuthController.getdashboard);
router.get('/all-profit', AuthMiddleware.authenticateToken ,AuthController.getProfit);
router.get('/all-billed', AuthMiddleware.authenticateToken ,AuthController.getBilled);
router.get('/all-dues', AuthMiddleware.authenticateToken ,AuthController.getDues);
router.get('/all-expense', AuthMiddleware.authenticateToken ,AuthController.getExpenses);
router.get('/all-billed-inventory', AuthMiddleware.authenticateToken ,AuthController.getAllInventory);
router.get('/all-paid-inventory', AuthMiddleware.authenticateToken ,AuthController.getPaidInventory);
router.get('/all-unbilled-inventory', AuthMiddleware.authenticateToken ,AuthController.getUnbilledInventory);
router.get('/all-unbilled-expenses', AuthMiddleware.authenticateToken ,AuthController.getUnbilledExpenses);
router.get('/all-paid-expenses', AuthMiddleware.authenticateToken ,AuthController.getBilledExpenses);
router.get('/get-user/:userId', AuthMiddleware.authenticateToken, AuthController.getuser);
router.get('/get-vendor/:userId', AuthMiddleware.authenticateToken, AuthController.getVendor);
router.get('/all-banks', AuthMiddleware.authenticateToken, AuthController.getBank);
router.get('/add-bank-data', AuthMiddleware.authenticateToken, AuthController.getAddBank);
router.get('/update-bank-data/:id', AuthMiddleware.authenticateToken, AuthController.getPostBank);
router.get('/internal-transfer', AuthMiddleware.authenticateToken, AuthController.getInternalTransfer);
router.get('/transcation-list/:data', AuthMiddleware.authenticateToken, AuthController.transactionLists);

router.post('/login', AuthController.verifyLogin);
router.post('/add-bank-data', AuthMiddleware.authenticateToken, AuthController.postBankData);
router.post('/update-bank-data/:id', AuthMiddleware.authenticateToken, AuthController.postUpdateBank);
router.post('/internal-transfer', AuthMiddleware.authenticateToken, AuthController.postInternalTransfer);


router.get('/change-password', AuthMiddleware.authenticateToken ,AuthController.getChangePass );

router.post('/change-password', AuthMiddleware.authenticateToken ,AuthController.postChangePass );

router.get('/find-transaction', ExpenseController.findtransactionLists );
router.post('/update-transaction', ExpenseController.findAndUpdateTransaction );

router.get('/data-export', AuthMiddleware.authenticateToken ,ExpenseController.getMultiData );
router.post('/data-export', AuthMiddleware.authenticateToken , MulterMiddleware.upload.single('file') ,ExpenseController.postMultiData );

module.exports = router;