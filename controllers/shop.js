const Product = require('../models/product');

const Order = require("../models/order")


exports.getProducts = (req, res, next) => {
  Product.find().then(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All products',
      path: '/products',    
      isAuthenticated: req.session.isLoggedIn
    });
  }).catch(err => {
    console.log(err)
  })
}; // find() here from mongoose. Read official docs

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
    console.log(err)
  }) 
} // findByid is from mongoose

exports.getIndex = (req, res, next) => {
  console.log(req.user)
  Product.find().then(products => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
    });
  }).catch(err => {
    console.log(err)
  })

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
      console.log(err)
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
    console.log(err)
  })
  
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
req.user.deleteProductFromCart(prodId).then(result => {
    console.log(result)
    res.redirect('/cart')
  }).catch(err => {
    console.log(err)
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
  console.log(err)
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
   }).catch(err => console.log(err))
}

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};
