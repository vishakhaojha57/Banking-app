const mongoose = require("mongoose")

const ledgerSchema = new mongoose.Schema({

    account:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, " Ledger must be associated with an aacount"],
        index: true,
        immutable:true
    },

    amount:{
        type:Number,
        required:[true,"Amount is required for creating a ledgerentry"],
        immutable:true,
        ref:"transaction",
        index:true

    },

    transaction :{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transaction",
        required:[true,"Amount is required for creating a ledgerentry"],
        index:true,
        immutable:true

    },

    type:{
        type:String,
        enum:{
            values:["CREDIT","DEBIT"],
            message: "Type can be either CREDIT OR DEBIT"
        },

        required: [true, "LEdger type is required"],
        immutable: true

    }

})

function preventLedgerModification() {
    throw new Error("Ledger entries are immutable and can not be modify or deleted");
}


ledgerSchema.pre("findOneAndUpdate",preventLedgerModification);
ledgerSchema.pre("updateOne",preventLedgerModification);
ledgerSchema.pre("deleteOne",preventLedgerModification);
ledgerSchema.pre("remove",preventLedgerModification);
ledgerSchema.pre("deleteMany",preventLedgerModification);
ledgerSchema.pre("updateMany",preventLedgerModification);
ledgerSchema.pre("findOneAndDelete",preventLedgerModification);
ledgerSchema.pre("findOneAndReplace",preventLedgerModification);


const ledgerModel = mongoose.model("ledger" , ledgerSchema);

module.exports = ledgerModel;