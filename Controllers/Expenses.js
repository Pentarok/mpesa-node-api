const Expense = require('../models/Expense')

exports.addExpense = async (req,res)=>{
    try {
        
   
    const {title, amount, description,date,userId}= req.body;
if(!amount || !title){
 return   res.status(400).json({message:"Fill in required fields"})
}
if(amount<1){
 return   res.status(400).json({message:"Amount must be a positive number"})
}
    const addedExpense = await Expense.create({
        title,
        amount,
        description,
        userId,
        date:date?date:null
    })
 
  return res.status(200).json({message:"Ok"}) 
} catch (error) {
       return res.status(500).json({message:"Server Error"}) 
}
}

exports.getExpense = async(req,res)=>{
    const { id }=req.params;
    try {
        const Expenses = await Expense.find({userId:id}).sort({createdAt:-1});
        return res.status(200).json(Expenses);
        
    } catch (error) {
        res.status(500).json({message:"Server error"})
    }
  
}

exports.deleteExpense = async(req,res)=>{
    try {
      const {id}= req.params;
      console.log(req.params,id)
      const deletedExpense = await Expense.findByIdAndDelete(id);
  if(deletedExpense){
    return res.status(200).json({message:"Expense deleted successfully",status:"Ok"})
  }

      
        
    } catch (error) {
        res.status(500).json({message:"Server error"})
    }
  
}
