const mongoose = require('mongoose')

const Schema = mongoose.Schema; // constructor allowas you to create new schemas

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // refeerring to the user model
        required: true
    }
}) // construct a schema with simple key value pairs and their type e.g title must be type "string". the schema is a blueprint

module.exports = mongoose.model("Product", productSchema ) // connect a schema with a name(model). in this case the name of the model is Product and schema "productSchema"

