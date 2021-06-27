
const Product = require('../models/product');


exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    formsCSS: true,
    productCSS: true,
    activeAddProduct: true,
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product({title: title, price: price, description: description, imageUrl: imageUrl, userId: req.user}) // use the Product class to create a new product instance and run the .save method
  product.save().then(result => {
    console.log(result)
    res.redirect('/admin/products')
  }).catch(err => {
    console.log(err)
  })
} // the save method here is from mongoose

exports.getEditProduct = (req, res, next) => {
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
       isAuthenticated: req.session.isLoggedIn
     });
  }).catch(err => {
    console.log(err)
  })
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImageUrl = req.body.imageUrl;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;
  // const product = new Product({title: updatedTitle, imageUrl: updatedImageUrl, price: updatedPrice, description: updatedDescription, })
  Product.findById(prodId).then(product => {
    if(product.userId.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    } //only users that created the products can delete  them
    product.title = updatedTitle;
    product.price = updatedPrice;
    product.imageUrl = updatedImageUrl,
    product.description = updatedDescription
   return product.save().then(result => {
    console.log('UPDATED PRODUCT')
    res.redirect('/admin/products')
  })
  }).catch(err => console.log(err))

}  // the save method here is from mongoose

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  Product.deleteOne({_id: prodId, userId: req.user._id}).then(result => {
    console.log("PRODUCT DESTROYED")
    res.redirect('/admin/products')
  }).catch(err => {
    console.log(err)
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
  })

}; //find() from mongoose. in mongoose there is a populate() method that you can add after find that tellls mongoose to populate a certain field using the id
// select() can be added after find to get a specific part of the data e.g when you want only the price or name, not the description