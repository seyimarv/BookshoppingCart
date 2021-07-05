const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');

const { check, body } = require('express-validator/check') //for validation

const isAuth = require('../middleware/is-auth')

const router = express.Router();

// // /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);


// // // /admin/products => GET
router.get('/products',  isAuth, adminController.getProducts);

// // /admin/add-product => POST
router.post('/add-product' , isAuth, [
    body('title', 'title must be at least three characters long').isString().isLength({min:3}),
    body('price', 'Price must be a number').isFloat(),
    body('description', 'description must be at least 5 characters long').isLength({min:5})
], adminController.postAddProduct);


router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);


router.post('/edit-product',  isAuth, [
    body('title', 'title must be at least three characters long').isString().isLength({min:3}).trim(),
    body('price', 'Price must be a number').isFloat(),
    body('description', 'description must be at least 5 characters long').isLength({min:5})
], adminController.postEditProduct);

router.delete('/product/:productId',  isAuth, adminController.deleteProduct) //you can use delete here(http word) since rrequest is sent via client-side javascript


module.exports = router;
