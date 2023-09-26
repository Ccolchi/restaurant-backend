import * as url from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/**
 * 
 * Crea hash bcrypt
 * @param {*} pass clave original
 * @returns clave hasheada
 */
const createHash = (pass) => {
    return bcrypt.hashSync(pass, bcrypt.genSaltSync(10));
}

/**
 * 
 * Realiza comparación de claves bcrypt
 * @param {*} userInDb objeto con datos de usuario
 * @param {*} pass clave a comparar
 * @returns booleano
 */
const isValidPassword = (userInDb, pass) => {
    return bcrypt.compareSync(pass, userInDb.password);
}

/**
 * 
 * Verifica campos requeridos, el req.body debe contener sí o sí esos elementos y no estar vacíos
 * @param {*} requiredFields array de campos requeridos
 * @returns middleware
 */
const checkRequired = (requiredFields) => {
    return (req, res, next) => {
        for (const required of requiredFields) {
            console.log(req.body.username)
            if (!req.body.hasOwnProperty(required) || req.body[required].trim() === '') {
                return res.status(400).send({ status: 'ERR', data: `Faltan campos obligatorios (${requiredFields.join(',')})` })
            }
        }
        
        next()
    }
}

/**
 * 
 * Verifica que el rol indicado en el objeto req.loggedInUser (generado al verificar el token) coincida con uno de los requeridos
 * @param {*} requiredRoles array de roles con acceso habilitado al recurso
 * @returns middleware
 */
const checkRoles = (requiredRoles) => {
    return (req, res, next) => {
        try {
            if (!requiredRoles.includes(req.loggedInUser.role)) return res.status(403).send({ status: 'ERR', data: 'No tiene autorización para acceder a este recurso' })
            
            next()
        } catch (err) {
            return res.status(500).send({ status: 'ERR', data: err.message })
        }
    }
}

/**
 * 
 * Verifica presencia y validez de token JWT
 * @returns middleware
 */
const verifyToken = (req, res, next) => {
    try {
        // Se obtiene el token desde los headers de la solicitud
        const headerToken = req.headers.authorization

        // Si no hay token se devuelve directamente un error 401
        if (!headerToken) return res.status(401).send({ status: 'ERR', data: 'Se requiere header con token válido' })
        const token = headerToken.replace('Bearer ', '')

        jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).send({ status: 'ERR', data: 'El token ha expirado' })
                } else {
                    return res.status(401).send({ status: 'ERR', data: 'El token no es válido' })
                }
            }

            // Si la solicitud incluye un user id en los parámetros, se verifica que coincida con el del token)
            /* if (req.params.uid !== null && req.params.uid !== decoded.uid) {
                return res.status(401).send({ status: 'ERR', data: 'El user id no coincide con el token' })
            } */
            
            // En caso de llegar acá, significa que el token es válido y todo está ok, se sigue la cadena
            req.loggedInUser = decoded
            next()
        })
    } catch(err) {
        return res.status(500).send({ status: 'ERR', data: err.message })
    }
}

/**
 * 
 * Quita campos de un objeto en base a un array de no deseados
 * @param {*} data objeto a filtrar
 * @param {*} unwantedFields keys a quitar
 * @returns data filtrado
 */
const filterData = (data, unwantedFields) => {
    const { ...filteredData } = data
    unwantedFields.forEach(field => delete filteredData[field] )
    return filteredData
}

/**
 * 
 * Quita campos del req.body respetando un array de permitidos
 * @param {*} allowedFields array de keys permitidos
 * @returns middleware
 */
const filterAllowed = (allowedFields) => {
    return (req, res, next) => {
        req.filteredBody = {};
        
        for (const key in req.body) {
            if (allowedFields.includes(key)) req.filteredBody[key] = req.body[key]
        }
        
        next()
    }
}

export { __filename, __dirname, createHash, isValidPassword, checkRequired, checkRoles, verifyToken, filterData, filterAllowed };