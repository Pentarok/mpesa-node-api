const Income = require('../models/Income')

exports.addIncome = async (req,res)=>{
    try {
        
   
    const {title, amount, description,userId,date}= req.body;
    if(!userId){
        res.status(400).json({message:"You are not authorized to perform this"})
    }
if(!amount || !title){
 return   res.status(400).json({message:"Fill in required fields"})
}
if(amount<1){
 return   res.status(400).json({message:"Amount must be a positive number"})
}
    const income = await Income.create({
        title,
        amount,
        description,
        date:date?date:null,
        userId
    })
 
  return res.status(200).json({message:"Ok"}) 
} catch (error) {
    console.log(error)
       return res.status(500).json({message:"Server Error"}) 
}
}

exports.getIncomes = async(req,res)=>{
    const {id}=req.params
  
    try {
        const incomes = await Income.find({userId:id}).sort({createdAt:-1});
        return res.status(200).json(incomes);

    } catch (error) {
        res.status(500).json({message:"Server error"})
    }
  
}

exports.deleteIncome = async(req,res)=>{
    try {
      const {id}= req.params;
      console.log(req.params,id)
      const deletedIncome = await Income.findByIdAndDelete(id);
  if(deletedIncome){
    return res.status(200).json({message:"Income deleted successfully",status:"Ok"})
  }

      
        
    } catch (error) {
        res.status(500).json({message:"Server error"})
    }
  
}

//{"_id":{"$oid":"67a328260621c2ceca7a1fc4"},"title":"Laptop","amount":{"$numberInt":"1200"},"description":"A high-performance laptop with 16GB RAM and 512GB SSD.","createdAt":{"$date":{"$numberLong":"1738745894708"}},"updatedAt":{"$date":{"$numberLong":"1738745894708"}},"__v":{"$numberInt":"0"}}