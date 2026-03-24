const transactionModel = require("../models/transaction.model");
const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const emailService = require('../services/email.service');
const { default: mongoose } = require("mongoose");


/**
 * 
 * The 10 - steps tranfer flow
 * 1. Validate request
 * 2. Validate idempotency Key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. CREATE debit ledger entry
 * 7. CREATE credit ledger entry
 * 8. mark the transaction completed
 * 7. commit mongoDB session
 * 10. send email notification
 * 
 * from 5-8 either all will be completed or none of them
 *  
 *
 */
// we are using idempotancy key so that same payment do bar n ho 

async function  createTransaction(req,res) {
    

       
        const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
        const user = req.user;

        // Validate input
        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: "Amount must be positive" });
        }

        // Check if fromAccount belongs to user
        const fromUserAccount = await accountModel.findOne({ _id: fromAccount});
        if (!fromUserAccount) {
            return res.status(403).json({ message: "Invalid or inactive from account" });
        }

        // Check if toAccount exists and is active
        const toUserAccount = await accountModel.findOne({ _id: toAccount});
        if (!toUserAccount) {
            return res.status(400).json({ message: "Invalid or inactive to account" });
        }

        // Check idempotency
        const isTransactionAlreadyExists = await transactionModel.findOne({ idempotencyKey });

        if(isTransactionAlreadyExists)  {
            
            if (isTransactionAlreadyExists.status === "COMPLETED") {
                return res.status(200).json({ message: "Transaction already exists", transaction: isTransactionAlreadyExists });}
            
            if (isTransactionAlreadyExists.status === "PENDING") {
                return res.status(200).json({ message: "Transaction still in processing"});}
            
            if(isTransactionAlreadyExists.status === "FAILED"){
                return res.status(500).json({message: "transaction processing failed"})}
            
            if(isTransactionAlreadyExists.status === "REVERSED") {
                return res.status(500).json({message: "transaction reversed, please retry"})
            }

        }
        
        
        /**check account status */
        if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({ message: "One or both accounts are not active" });
        }


        /**4 -> Derive sender balance frokm ledger */
        const balance = await fromUserAccount.getBalance();

        if(balance < amount) {
            return res.status(400).json({message:`Insufficient Balance. current balanace is ${balance} and requested amount is ${amount}`})
        }
        


        // 5 -> Create transaction(PENDING)
        const session = await mongoose.startSession();
        session.startTransaction();


        const transaction = await transactionModel.create({
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"

        }, {session});

        
        const debitLedgerEntry  = await ledgerModel.create({
            account : fromAccount,
            amount: -amount, // Debit should be negative
            transaction: transaction._id,
            type: "DEBIT"
            
        }, {session})


        const creditLedgerEntry  = await ledgerModel.create({
            account : toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"

        }, {session})


        transaction.status = "COMPLETED";
        await transaction.save({session})

        await session.commitTransaction();
        session.endSession()


        /** 10-> send email  */
        await emailService.sendTransactionEmail(req.user.email, req.user.name , transaction._id , amount, toAccount, "Completed" );

            return  res.status(201).json({
                message: "Transaction completed",
                transaction: transaction
            })           
} 




async function createInitialFundsTransaction(req,res) {


    const {toAccount , amount , idempotencyKey} = req.body

    if(!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount , amount and idempotency Key are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if(!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        systemUser: true,
        user: req.user._id
    })

    if(!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }
     
    const session = await mongoose.startSession();
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"

    },{session})

    const debitLedgerENtry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"

    }], { session})

    const creditLedgerENtry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"

    }], { session})


    transaction.status = "COMPLETED"
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successful",
        transcation: transaction
    })
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
};

