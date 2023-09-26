import mongoose from 'mongoose'



mongoose.pluralize(null)

const collection = 'products'

const schema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    },
);

const productsModel = mongoose.model(collection, schema);

export default productsModel;