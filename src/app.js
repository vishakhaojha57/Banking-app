const express = require('express')
const cookieParser = require('cookie-parser')


const app = express()

// middle ware --> req.body ke andr ke data to pdne ke liye
app.use(express.json())
app.use(cookieParser())


/* Routes */
const authRouter = require('./routes/auth.routes')
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require('./routes/transaction.routes');


app.get("/", (req, res) => {
    res.send("Ledger Service is up and running")
})



/* Use routes */
app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)


module.exports = app;


// config --> kon konse middle ware and api u are using