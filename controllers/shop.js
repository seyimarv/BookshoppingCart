const Product = require('../models/product');

const Order = require("../models/order")

const fs = require('fs')

const path = require('path')

const PDFDocument = require('pdfkit') //use to create a pdf

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId).then((product) => {
    res.render('shop/product-detail',{
      pageTitle: product.title,
      product: product,
      path: '/products',
      isAuthenticated: req.session.isLoggedIn
    })
  }).catch(err => {
 
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error)
  }) 
} // findByid is from mongoose

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      console.log(numProducts)
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      console.log(err)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

};  // find() here from mongoose. Read official docs

exports.getCart = (req, res, next) => {
  req.user.populate('cart.items.productId').execPopulate().then(user => {
   const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        isAuthenticated: req.session.isLoggedIn
      });
    }).catch(err => {
  
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error)
    }) 
    // in mongoose there is a populate() method that you can add after find that tellls mongoose to populate a certain field using the id
  // Cart.getCart(cart => {
  //   Product.fetchAll().then(([rows, fieldData]) => {
  //     const cartProducts = []
  //     for (product of rows) {
  //       const cartProductData = cart.products.find(prod => prod.id === product.id)
  //       if(cartProductData) {
  //           cartProducts.push({productData: product, qty:cartProductData.qty})
  //       }
  //     }
  //     res.render('shop/cart', {
  //       path: '/cart',
  //       pageTitle: 'Your Cart',
  //       products: cartProducts
  //     });
  //   }).catch((err) => {
  //     console.log(err)
  //   })


  // })

};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then(product => {
    return req.user.addToCart(product)
  }).then(result => {
    console.log(result)
    res.redirect('/cart')
  }).catch(err => {
 
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error)
  })
  
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
req.user.deleteProductFromCart(prodId).then(result => {
    console.log(result)
    res.redirect('/cart')
  }).catch(err => {
    
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error)
  })
  // req.user.getCart().then(cart => {
  //   return cart.getProducts({where: {id: prodId}})
  // }).then(products => {
  //   const product = products[0];
  //   return product.CartItem.destroy()
  // }).then(result => {
  //   res.redirect('/cart')
  // }).catch(err => console.log(err))
  // // Cart.deleteProduct(prodId, productPrice);



}

exports.getOrders = (req, res, next) => {

Order.find({'user.userId': req.session.user._id}).then(orders => {
  const reducer = (accumulator, currentValue) => accumulator + currentValue;
  let productQuantity = []
  const getQuantity = () => orders.map(order => {
    order.products.map(product => {
      console.log(product.quantity)
      productQuantity.push(product.quantity)
    })
  })
  getQuantity()
  res.render('shop/orders', {
    path: '/orders',
    pageTitle: 'Your Orders',
    orders: orders,
    total: productQuantity.length !== 0 ? productQuantity.reduce(reducer) : null, //get the total quantity of the products that is ordered
    isAuthenticated: req.session.isLoggedIn
  });
}).catch(err => {
 
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error)
})


};

exports.postOrder = (req, res, next) => {
  // req.user.getCart().then(cart => {
  //  return cart.getProducts()
  // }).then(products => {
  //    return req.user.createOrder().then(order => {
  //     return order.addProducts(products.map(product => {
  //        product.OrderItem = {  Quantity: product.CartItem.Quantity}
  //        return product;
  //      }))
  //    })
  //  })
  // .then(result => {
  //   res.redirect("/orders")
  // })
  req.user.populate('cart.items.productId').execPopulate().then(user => {

    const products = user.cart.items.map(i => {
      return {quantity: i.quantity, product:{ ...i.productId._doc}};
    });

    const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user.id
        
      },
      products: products,
    })
   return order.save()
   }).then(result => {
     return req.user.clearCart()
   }).then(result => {
    res.redirect("/orders")
   }).catch(err => {
     
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error)
   })
}
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId).then(order=> {
    if(!order) {
      return next(new Error('No order found'))
    }
    if(order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error('Unauthorized'))
    }
    const invoiceName = "Invoice-" + orderId + ".pdf";
    const invoicePath = path.join('data', 'invoices', invoiceName)


    //creating a pdf when we get an invoice
    const pdfDoc = new PDFDocument(); //create a readable stream
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition', 
      'inline; filename=" ' + invoiceName + '"'
    )

    pdfDoc.pipe(fs.createWriteStream(invoicePath)) //pipe the output into a writeable file-stream
    pdfDoc.pipe(res); //return into the response

    pdfDoc.fontSize(26).text('Invoice', {
      underline: true
    }) //allows us to add a line of text into the document, and you can also style
    pdfDoc.text('------------------------');
    let totalPrice = 0
    order.products.forEach(prod => {
      pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' * ' + '$' + prod.product.price)
      totalPrice = totalPrice + prod.quantity  * prod.product.price
    }) //filling the pdf with the order details
     pdfDoc.text('-----------------.---------')
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice)

    pdfDoc.end() //to tell you are done.

    // fs.readFile(invoicePath, (err, data) => {
    //   if(err) {
    //     return next(err)
    //   }
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')
    //   res.send(data);
    // }) //this way consumes more memory. as all the data in the file has to be read first.
    // const file = fs.createReadStream(invoicePath); //a huge advantage for large data.
  
    // file.pipe(res);

  }).catch( err => {
    console.log(err)
    next(err)
  })
 
}
exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};
