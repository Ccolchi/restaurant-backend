import mongoose from 'mongoose'

mongoose.pluralize(null)

const collection = 'pedidos'

const schema = new mongoose.Schema({
    cliente: { type: String, required: true },
    direccion: { type: String, required: true },
    total: { type: Number, required: true },
    estado: { type: Number, default: 0 },
 }
);

const pedidosModel = mongoose.model(collection, schema);

export default pedidosModel;