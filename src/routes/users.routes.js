import mongoose from 'mongoose'
import { Router } from 'express'
import userModel from '../models/users.model.js'

import { body, validationResult } from 'express-validator'
import { createHash, isValidPassword, checkRequired, checkRoles, verifyToken, filterData, filterAllowed } from '../utils.js'
import jwt from 'jsonwebtoken'

// Exportamos usersRoutes habilitando endpoints para las distintas operaciones deseadas
export const usersRoutes = ()  => {
    const router = Router()

    /**
     * Verifica si el email enviado en el body ya se encuentra registrado
     */
    const checkRegistered = async (req, res, next) => {
        const userAlreadyRegistered = await userModel.findOne({ email: req.body.email })
        
        if (userAlreadyRegistered === null) {
            next()
        } else {
            res.status(400).send({ status: 'ERR', data: 'El email ya se encuentra registrado' })
        }
    }

    /**
     * Verifica que el mail enviado en el body exista en la colección de usuarios
     */
    const checkReadyLogin = async (req, res, next) => {

        res.locals.foundUser = await userModel.findOne({ email: req.body.email })
        
        if (res.locals.foundUser !== null) {
            // Si se encuentra un registro con ese mail, se continúa la cadena del endpoint
            next()
        } else {
            // caso contrario se devuelve un error
            res.status(400).send({ status: 'ERR', data: 'El email no se encuentra registrado' })
        }
    }

    /**
     * Valida los elementos del body utilizando express-validator
     * Este middleware se inyecta en el endpoint de creación de usuario
     */
    const validateCreateFields = [
        body('name').isLength({ min: 2, max: 32 }).withMessage('El nombre debe tener entre 2 y 32 caracteres'),
        body('email').isEmail().withMessage('El formato de mail no es válido'),
        body('password').isLength({ min: 6, max: 12 }).withMessage('La clave debe tener entre 6 y 12 caracteres')
    ]

    const validateLoginFields = [
        body('email').isEmail().withMessage('El formato de mail no es válido'),
        body('password').isLength({ min: 6, max: 12 }).withMessage('La clave debe tener entre 6 y 12 caracteres')
    ]
    router.get('/list_users/', async (req, res) => {
        try {
            const users = await userModel.find()
            res.status(200).send({ status: 'OK', data: users })

        } catch (err) {
            res.status(500).send({ status: 'ERR', data: err.message })
        }
    })

    router.get('/paginated', async (req, res) => {
        try {
            const users = await userModel.paginate({}, { offset: req.query.offset || 0, limit: process.env.REQ_LIMIT || 50 })
            
            res.status(200).send({ status: 'OK', data: users })
        } catch (err) {
            res.status(500).send({ status: 'ERR', data: err.message })
        }
    })


    router.get('/search_user/:uid', async (req, res) => {
        try {
            // Importante siempre verificar los datos recibidos en request
            // En este caso estamos al menos controlando que el id enviado tenga un formato válido de MongoDB
            if (mongoose.Types.ObjectId.isValid(req.params.uid)) {
                const user = await userModel.findById(req.params.uid)

                if (user === null) {
                    res.status(404).send({ status: 'ERR', data: 'No existe usuario con ese ID' })
                } else {
                    res.status(200).send({ status: 'OK', data: filterData(user._doc, ['password']) })
                }
            } else {
                res.status(400).send({ status: 'ERR', data: 'Formato de ID no válido' })
            }
        } catch (err) {
            res.status(500).send({ status: 'ERR', data: err.message })
        }
    })


    /* Ruta protegida por token (verifyToken) y con control de roles (el usuario debe tener rol de admin para acceder al endpoint  */
    
    router.get('/protected_adm', verifyToken, checkRoles(['admin']), (req, res) => {
        res.status(200).send({ status: 'OK', data: 'Se muestran los datos protegidos ADMIN' })
    })


    router.post('/register', checkRequired(['name', 'email', 'password']), validateCreateFields, checkRegistered, async (req, res) => {
        // Ante todo chequeamos el validationResult del express-validator
        if (validationResult(req).isEmpty()) {
            try {
                // req es un parámetro inyectado por Express que contiene toda la información
                // relacionada a la solicitud (request)
                // res por su lado contiene todo lo relativo a la respuesta (response)
                
                // req.body permite acceder a los datos de usuario que se desea cargar, por supuesto
                // al "armar" el body del otro lado (en un formulario, postman, thunderclient, etc),
                // se deben especificar esos campos (name, email, password en este ejemplo)
                // por supuesto aquí falta un paso FUNDAMENTAL, que es la verificación de los datos
                const { name, email, password } = req.body
                                // Aquí agregamos el hasheo de clave, ya que nunca debemos almacenar una clave "plana"
                const newUser = { name: name, email: email, password: createHash(password) }
                // Una vez organizado el nuevo usuario, invocamos el método create() para enviarlo a la base de datos
                const process = await userModel.create(newUser)
                
                res.status(200).send({ status: 'OK', data: filterData(process, ['password']) })
            } catch (err) {
                res.status(500).send({ status: 'ERR', data: err.message })
            }
        } else {
            res.status(400).send({ status: 'ERR', data: validationResult(req).array() })
        }
    })


    router.post('/login', checkRequired(['email', 'password']), validateLoginFields, checkReadyLogin, async (req, res) => {
        // Ante todo chequeamos el validationResult del express-validator
        if (validationResult(req).isEmpty()) {
            try {
                const foundUser = res.locals.foundUser
                
                // Si la clave es válida, la autenticación es correcta
                if (foundUser.email === req.body.email && isValidPassword(foundUser, req.body.password)) {
                    // Generamos un nuevo token tipo JWT y lo agregamos a foundUser para que sea enviado en la respuesta
                    foundUser._doc.token = jwt.sign({
                        uid: foundUser._id,
                        name: foundUser.name,
                        email: foundUser.email,
                        role: foundUser.role
                    }, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_EXPIRATION });
                    res.status(200).send({ status: 'OK', data: filterData(foundUser._doc, ['password']) })
                } else {
                    res.status(401).send({ status: 'ERR', data: 'Credenciales no válidas' })
                }
            } catch (err) {
                res.status(500).send({ status: 'ERR', data: err.message })
            }
        } else {
            res.status(400).send({ status: 'ERR', data: validationResult(req).array() })
        }
    })


    router.put('/update_user/:uid', verifyToken, checkRoles(['admin']), filterAllowed(['name', 'email', 'avatar', 'role', 'cart']), async (req, res) => {
        try {
            const id = req.params.uid
            if (mongoose.Types.ObjectId.isValid(id)) {
                // Busca por ID, actualiza y retorna como resultado el objeto con los nuevos datos
                const userToModify = await userModel.findOneAndUpdate({ _id: id }, { $set: req.filteredBody }, { new: true })

                if (!userToModify) {
                    res.status(404).send({ status: 'ERR', data: 'No existe usuario con ese ID' })
                } else {
                    res.status(200).send({ status: 'OK', data: filterData(userToModify, ['password']) })
                }
            } else {
                res.status(400).send({ status: 'ERR', data: 'Formato de ID no válido' })
            }
        } catch (err) {
            res.status(500).send({ status: 'ERR', data: err.message })
        }
    })

    router.put('/cart/add', verifyToken, filterAllowed(['cart']), async (req, res) => {
        try {
            const userToModify = await userModel.findOneAndUpdate({ _id: req.loggedInUser.uid }, { $set: req.filteredBody }, { new: true })
            res.status(200).send({ status: 'OK', data: filterData(userToModify, ['password']) })
        } catch (err) {
            res.status(500).send({ status: 'ERR', data: err.message })
        }
    })


    router.delete('/delete_user/:uid', verifyToken, checkRoles(['admin']), async (req, res) => {
        try {
            const id = req.params.uid
            if (mongoose.Types.ObjectId.isValid(id)) {
                const userToDelete = await userModel.findOneAndDelete({ _id: id });

                if (!userToDelete) {
                    res.status(404).send({ status: 'ERR', data: 'No existe usuario con ese ID' })
                } else {
                    res.status(200).send({ status: 'OK', data: userToDelete })
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