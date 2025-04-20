const Saving = require('../models/Savings')

exports.addSaving = async (req,res)=>{
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
    const saving = await Saving.create({
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

exports.getSavings = async(req,res)=>{
    const {id}=req.params
  
    try {
        const Savings = await Saving.find({userId:id}).sort({createdAt:-1});
        return res.status(200).json(Savings);

    } catch (error) {
        res.status(500).json({message:"Server error"})
    }
  
}

exports.deleteSaving = async(req,res)=>{
    try {
      const {id}= req.params;
      console.log(req.params,id)
      const deletedSaving = await Saving.findByIdAndDelete(id);
  if(deletedSaving){
    return res.status(200).json({message:"Saving deleted successfully",status:"Ok"})
  }

      
        
    } catch (error) {
        res.status(500).json({message:"Server error"})
    }
  
}