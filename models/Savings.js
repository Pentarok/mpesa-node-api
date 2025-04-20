const mongoose = require("mongoose");

const SavingSchema = new mongoose.Schema({
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
    userId:{
        type:String,
        required:true
    },
    description:{
        type:String,
        trim:true
    },
date:{
    type:Date
}
},
{ timestamps: true })
module.exports = mongoose.model('Saving',SavingSchema)