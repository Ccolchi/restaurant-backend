import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'

import { productsRoutes } from './routes/products.routes.js'
import { usersRoutes } from './routes/users.routes.js'


dotenv.config()

const EXPRESS_PORT = process.env.EXPRESS_PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'

const app = express()
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({
    origin: '*' // Se aceptan solicitudes desde cualquier origen
}));
app.use(express.urlencoded({ extended: true }));

app.use('/api/products', productsRoutes());
app.use('/api/users', usersRoutes());

app.all('*', (req, res) => {
    res.status(404).send({ status: 'ERR', data: 'No se encuentra el endpoint solicitado' })
})


 mongoose.connection.on('open', () => console.log(`db connected`) )

// Init server
  app.listen(EXPRESS_PORT, async () => {
      try {
         // Conectamos al motor de base de datos MongoDB
       await mongoose.connect(MONGODB_URI)

         console.log(`Backend inicializado puerto ${EXPRESS_PORT}`)
         
     } catch (err) {
         console.error(err.message)
      }
  })