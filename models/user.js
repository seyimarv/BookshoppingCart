const mongoose = require("mongoose")


const Product = require('../models/product');

const Schema = mongoose.Schema;

const userSchema =  new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        requied: true
    },
    cart: {
        items: [{productId: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
         quantity: {type:Number, required: true}}], // meaning an array of documents
    }
})

// userSchema.methods.getCart = function() {
//     const productIds = this.cart.items.map(i => {
//       return i.productId
//     }) // gets the id of each products in the items
//    return Product.find({_id: {$in: productIds}}).then(products => {
//       return products.map(product => {
//           console.log(product)
//         return {...product, quantity: this.cart.items.find(i => {
//           return i.productId.toString() === product._id.toString(); 
//         }).quantity //extract the qunatity for each product
//       }
//       })
//     }); //extract the cart products from the products array in the db using their ids
// }

userSchema.methods.addToCart = function(product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString(); // returns true if product exist
      });
      let newQuantity = 1;
      const updatedCartItems = [...this.cart.items];
      if (cartProductIndex >= 0) {
         // if cart product exist 
          newQuantity = this.cart.items[cartProductIndex].quantity + 1 // increment quantity if item already exist
          updatedCartItems[cartProductIndex].quantity = newQuantity
      } else { 
        // add a new item
        updatedCartItems.push({ productId: product._id, quantity : newQuantity}) // get product id, and add new field "quantity"
      }
      
      const updatedCart = {items: updatedCartItems}
      this.cart = updatedCart 
     return this.save() 

} 
//this allows you to have your own logic

userSchema.methods.deleteProductFromCart = function (productId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString()
      })
      this.cart.items = updatedCartItems;
      return this.save()
}
userSchema.methods.clearCart = function() {
    this.cart = {items: []}
    return this.save()
}
module.exports = mongoose.model("User", userSchema)