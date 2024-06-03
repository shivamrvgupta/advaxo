const router = require('express').Router();
const AuthRoutes = require('./auth.route');
const InventoryRoutes = require('./inventory.route');
const OrderRoutes = require('./order.route');

router.use('/auth', AuthRoutes);
router.use('/inventory', InventoryRoutes);
router.use('/order', OrderRoutes);

module.exports = router;