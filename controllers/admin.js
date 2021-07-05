const Mongoose = require('mongoose')
const Product = require('../models/product');
const {validationResult} = require('express-validator/check') //allows you to gather all the error from the validation middleware set in route.js

const fileHelper = require('../util/file')

exports.getAddProduct = (req, res, next) => {
  let message = req.flash("error")
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    formsCSS: true,
    productCSS: true,
    activeAddProduct: true,
    isAuthenticated: req.session.isLoggedIn,
    validationErrors: [],
    errorMessage: message,
    oldInput: {
      title: '',
      imageUrl: '',
      price: '',
      description: ''
    }
  });
};

exports.postAddProduct = (req, res, next) => {
  const errors = validationResult(req)
  const title = req.body.title;
  const image = req.file //an object 
  const price = req.body.price;
  const description = req.body.description;



  if(!image) {
    return  res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      isAuthenticated: req.session.isLoggedIn,
      validationErrors: [],
      errorMessage: 'Attached file is not an image',
      oldInput: {
        title: title,
        description: description,
        price: price,
      }
    });
  } //if image is not set/ undefined
  console.log(image)

  if(!errors.isEmpty()) {
    console.log(errors.array())
    return  res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      isAuthenticated: req.session.isLoggedIn,
      validationErrors: errors.array(),
      errorMessage: errors.array()[0].msg,
      oldInput: {
        title: title,
        description: description,
        price: price,
      }
    });
  }

  const imageUrl = image.path; //the path to the file on the operating system will be stored as the imageurl which is then stored in the database.
  const product = new Product({title: title, 
    price: price, 
    description: description, 
    imageUrl: imageUrl,
     userId: req.user}) // use the Product class to create a new product instance and run the .save method
  product.save().then(result => {
    console.log(result)
    res.redirect('/admin/products')
  }).catch(err => {
    // console.log(err)
    // return  res.status(500).render('admin/edit-product', {
    //   pageTitle: 'Add Product',
    //   path: '/admin/add-product',
    //   editing: false,
    //   isAuthenticated: req.session.isLoggedIn,
    //   validationErrors: [],
    //   errorMessage: 'Database operation failed, please try again',
    //   oldInput: {
    //     title: title,
    //     description: description,
    //     price: price,
    //     imageUrl: imageUrl
    //   } //in case there is an error from the database
    // });
    // res.redirect('/500') //redirect to the 500 error page in case an error occured.

    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error)   //lets epress know that there is an error, and this skips the other middlewares and go to the special error handling middleeware.
  }) 
} // the save method here is from mongoose

exports.getEditProduct = (req, res, next) => {
  let message = req.flash("error")
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  if(!req.session.isLoggedIn) {
    return res.redirect('/login')
  } //if users is not loggedin users cant access edit products
  const editMode =  req.query.edit;
  if(!editMode) {
   return res.redirect('/')
  }
  const prodId = req.params.productId 
  Product.findById(prodId).then(product => {
    if (!product) {
      return res.redirect('/');
    }
     res.render('admin/edit-product', {
       pageTitle: 'Edit Product',
       path: '/admin/edit-product',
       editing: editMode,
       product: product,
       isAuthenticated: req.session.isLoggedIn,
       validationErrors: [],
       errorMessage: '',
       oldInput: {
         title: product.title,
         price: product.price,
         imageUrl: product.imageUrl,
         description: product.description
       }
     });
  }).catch(err => {
  
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error)
  })
};

exports.postEditProduct = (req, res, next) => {
   const editMode = req.query.edit
  const errors = validationResult(req)
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;




 

  // const product = new Product({title: updatedTitle, imageUrl: updatedImageUrl, price: updatedPrice, description: updatedDescription, })
  Product.findById(prodId).then(product => {
    if(product.userId.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    } //only users that created the products can delete  them
  
    product.title = updatedTitle;
    product.price = updatedPrice;
    if(image) {
      fileHelper.deleteFile(product.imageUrl)
      product.imageUrl = image.path;
    } //changes the image only if a new image is picked, otherwise the old image is retained
    product.description = updatedDescription

    console.log(errors.array())
    if(!errors.isEmpty()) {
      return  res.status(422).render(`admin/edit-product`, {
        pageTitle: 'Add Product',
        path: `admin/edit-product`,
        editing: true,
        product: product,
        isAuthenticated: req.session.isLoggedIn,
        validationErrors: errors.array(),
        errorMessage: errors.array()[0].msg,
        oldInput: {
          title: updatedTitle,
          description: updatedDescription,
          price: updatedPrice,
        }
      });
    }

   return product.save().then(result => {
    console.log('UPDATED PRODUCT')
    res.redirect('/admin/products')
  })
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error)  //trigger the special error handling middleware in app.js
  })

}  // the save method here is from mongoose

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId
  console.log('clicking')
  Product.findById(prodId).then(product => {
    if(!product) {
      return next(new Error('Product not found.'))
    }
    fileHelper.deleteFile(product.imageUrl)
   return Product.deleteOne({_id: prodId, userId: req.user._id})
  }).then(result => {
    console.log("PRODUCT DESTROYED")
    // res.redirect('/admin/products') //instead of redirecting you can send json data
    res.status(200).json({message: "success"})


  }).catch(err => {
     console.log(err)
     res.status(500).json({message: "deleting product failed"})
  })
} // findByIdAndRemove() is a built in method in mongoose allowing you to remove a document


exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id}) //only the user who created the products have access to get it as admin products
  // .populate("userId")
  .then(products => {
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin products',
      path: '/admin/products',
      isAuthenticated: req.session.isLoggedIn
    });
  }).catch(err => {
    console.log(err)
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error)
  })

}; //find() from mongoose. in mongoose there is a populate() method that you can add after find that tellls mongoose to populate a certain field using the id
// select() can be added after find to get a specific part of the data e.g when you want only the price or name, not the description