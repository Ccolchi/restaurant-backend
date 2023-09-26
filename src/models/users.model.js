// Mongoose necesita un modelo que "describa" los datos que guarda cada colección.
// A través de este modelo se invocarán los distintos métodos para consultar la base de datos.
// (Ver archivo de rutas en routes)

import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

mongoose.pluralize(null)

const collection = 'users'

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    cart: { type: Array, required: true, default: [] },
    deleted: { type: Boolean, required: true, default: false }
})
schema.plugin(mongoosePaginate)

const userModel = mongoose.model(collection, schema)

export default userModel