import mongoose from 'mongoose'
import { Router } from 'express'
// productos recuperamos desde la base de datos
// import productos_data from '../helpers/giftcards.js'
// Importamos el modelo para poder invocar a través de él los distintos métodos de consulta
import productModel from '../models/products.model.js'

import { body, validationResult } from 'express-validator'
import { checkRequired, checkRoles, verifyToken, filterData, filterAllowed } from '../utils.js'

// Es muy común utilizar distintos archivos de rutas para organizar los endpoints,
// luego agregaremos el uso de clases.
export const productsRoutes = ()  => {
    const router = Router()

    const validateCreateFields = [
        body('title').isLength({ min: 2, max: 32 }).withMessage('El título debe tener entre 2 y 32 caracteres'),
        body('price').isNumeric().withMessage('El precio debe ser numérico')
    ]

    // ES MUY IMPORTANTE recordar siempre el uso de promesas, sea con then catch o async await
    // al consultar bases de datos o manejar archivos
    router.get('/', async (req, res) => {
        const products = await productModel.find()
        res.status(200).send({ status: 'OK', data: products })
    })

    router.get('/dishes', async (req, res) => {
        res.status(200).send({ status: 'OK', data: probadita })
    })



    router.get('/one/:prod_id', async (req, res) => {
        try {
            if (mongoose.Types.ObjectId.isValid(req.params.prod_id)) {
                const product = await productModel.findById(req.params.prod_id)

                if (product === null) {
                    res.status(404).send({ status: 'ERR', data: 'No existe Producto con ese ID' })
                } else {
                    res.status(200).send({ status: 'OK', data: product })
                }
            } else {
                res.status(400).send({ status: 'ERR', data: 'Formato de ID no válido' })
            }
        } catch (err) {
            res.status(500).send({ status: 'ERR', data: err.message })
        }
    })

    router.post('/', verifyToken, checkRoles(['admin']), checkRequired(['title', 'price']), validateCreateFields, async (req, res) => {
        if (validationResult(req).isEmpty()) {
            try {
                const { title, price, image, description } = req.body
                const newProduct = { title: title, price: price, image: image, description: description }

                const process = await productModel.create(newProduct)
                
                res.status(200).send({ status: 'OK', data: filterData(process, ['password']) })
            } catch (err) {
                res.status(500).send({ status: 'ERR', data: err.message })
            }
        } else {
            res.status(400).send({ status: 'ERR', data: validationResult(req).array() })
        }
    })

    router.put('/:prod_id', verifyToken, checkRoles(['admin']), filterAllowed(['title', 'price', 'image']), async (req, res) => {
        try {
            const id = req.params.prod_id
            if (mongoose.Types.ObjectId.isValid(id)) {
                const productToModify = await productModel.findOneAndUpdate({ _id: id }, { $set: req.body }, { new: true })

                if (!productToModify) {
                    res.status(404).send({ status: 'ERR', data: 'No existe Producto con ese ID' })
                } else {
                    res.status(200).send({ status: 'OK', data: filterData(productToModify, ['password']) })
                }
            } else {
                res.status(400).send({ status: 'ERR', data: 'Formato de ID no válido' })
            }
        } catch (err) {
            res.status(500).send({ status: 'ERR', data: err.message })
        }
    })

    router.delete('/:prod_id', verifyToken, checkRoles(['admin']), async (req, res) => {
        try {
            const id = req.params.prod_id
            if (mongoose.Types.ObjectId.isValid(id)) {
                const productToDelete = await productModel.findOneAndDelete({ _id: id });

                if (!productToDelete) {
                    res.status(404).send({ status: 'ERR', data: 'No existe tarjeta con ese ID' })
                } else {
                    res.status(200).send({ status: 'OK', data: productToDelete })
                }
            } else {
                res.status(400).send({ status: 'ERR', data: 'Formato de ID no válido' })
            }
        } catch (err) {
            res.status(500).send({ status: 'ERR', data: err.message })
        }
    })

    return router
}