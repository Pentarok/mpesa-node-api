const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
    title:{
        type:String,
        reqired:true,
        trim:true,
        maxLength:60
    },
    amount:{
        type:Number,
        required:true,
        trim:true
    },
    description:{
        type:String,
        trim:true
    },
    userId:{
        type:String,
        required:true
    },
    date:
    {
        type:Date
    }

},
{ timestamps: true })
module.exports = mongoose.model('Expense',ExpenseSchema)