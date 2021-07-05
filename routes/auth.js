
const express = require('express');

const { check, body } = require('express-validator/check') //for validation

const router = express.Router();

const authController = require("../controllers/auth")

const User = require('../models/user')

router.get('/login', authController.getLogin)

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getReset)

router.get('/reset/:token', authController.getNewPassword)

router.post("/login", [check('email').isEmail().withMessage('Please enter a valid email').normalizeEmail().custom((value, {req}) => {
    //normalizeEmail is an email sanitizer
    return User.findOne({email: value}).then(user => {
        if (!user) {
          return Promise.reject('E-mail doesnt exist please try again')
        } //if the user email doesnt exist. 
        // check if the password is correct
    })
}),
 body('password', 'please enter a passsword only with numbers and at least 5 characters').isLength({min:5}).isAlphanumeric().trim()], authController.postLogin)

router.post('/signup', [check('email')
    .isEmail()
    .withMessage('Please enter a valid email').normalizeEmail()
    .custom((value, { req }) => {
        // if(value=== 'test@test.com') {
        //     throw new Error('This email adress is forbidden')
        // }
        // return true; 
       return User.findOne({ email: value }).then(userDoc => {
            if (userDoc) {
                return Promise.reject('E-mail exists already, please pick a different one.')
            }   // check if user email already exist

        })
    }),
    body("password", 'please enter a password with only numbers and at least 5 characters').isLength({ min: 5 })
    .isAlphanumeric().trim(), //checking for password in request body, //trim is an email sanitizer to eliminate white spaces
    body('confirmPassword').trim().custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords have to match')
                }
                return true;
            }) //checking for equality of confirmPassword and password
],
    authController.postSignup);

router.post("/logout", authController.postLogout)

router.post("/reset", authController.postReset)

router.post("/newpassword", authController.postNewPassword)

module.exports = router;