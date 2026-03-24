const {Router} = require("express")
const {authMiddleware , authSystemUserMiddleware} = require('../middleware/auth.middleware')
const {createTransaction, createInitialFundsTransaction } = require('../controllers/transaction.controller')


const transactionRoutes = Router()

/** POST -> /api/transaction/
 *  create a new transaction
 */
transactionRoutes.post('/', authMiddleware, createTransaction)


/** POST -> /api/transaction/system/intial-funcds */

transactionRoutes.post("/system/initial-funds" ,authSystemUserMiddleware , createInitialFundsTransaction)
module.exports = transactionRoutes;


