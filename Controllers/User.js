require('dotenv').config();
const mongoose=require("mongoose")
const axios = require("axios")
const User = require('../models/User');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
const bcrypt = require('bcryptjs');
const ResetToken = require('../models/ResetPasswordToken')
const Transaction = require('../models/TransactionModel')
const UserModel = require('../models/User');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const frontEndEnpoint = process.env.FRONT_END_URL;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace(/['"]+/g, '').split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    jwt.verify(token, "manu-secret-key", (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = decoded; // Attach user info to request
      next();
    });
  };

  


  exports.verifyUser = (req, res, next) => {

 
    const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.replace(/['"]+/g, '').split(' ')[1];
  
  

    if (!token) {
      return res.status(401).json({ message: "Token is missing" });
    } else {
      jwt.verify(token, "manu-secret-key", (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Token verification failed" });
        } else {
          if (decoded.role === 'visitor') {
            req.user = decoded; // Attach decoded token to the request object
            next(); // Pass control to the next middleware
          } else {
            return res.status(403).json({ message: "Invalid access" });
          }
        }
      });
    }
  };

 exports.AuthVerify = (req,res)=>{
  res.json({message:"ok",user:req.user})
 }
 exports.signUp = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Fill in required fields" });
    }
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Account already exists with this email" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate trialEndsAt: 30 days + 2 minutes from now
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);
    trialEndsAt.setMinutes(trialEndsAt.getMinutes() + 2);

    // Create user with trial info
    const userDoc = await User.create({
      username,
      email,
      password: hashedPassword,
      trialEndsAt,
      subscriptionType: 'trial',
      subscriptionEndsAt:trialEndsAt
    });

    return res.status(201).json("Ok");

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong. Please try again later." });
  }
};


exports.signInUser = async (req,res)=>{
    const { email, password } = req.body;

  try {
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      bcrypt.compare(password, userExist.password, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }

        if (isMatch) {
          const token = jwt.sign({
          
            username:userExist.username,
            id: userExist._id,
            role: userExist.role,
            active:userExist.activeAccess,
            isSuspended:userExist.isSuspended,
           
          }, 
          'manu-secret-key', 
          { expiresIn: '1d' });

          // Send the token in the response
          res.json({ token, user: userExist, message: 'Login success' });
        } else {
          
           res.status(401).json({ message: 'Your credentials are invalid' }); 
        }
      });
    } else {
      res.status(404).json({ message: 'Account does not exist' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    console.log(error.response)
    res.status(500).json({ message: 'Internal server error' });
  }
}



exports.LogoutUser = (req,res)=>{
  

    const expiredToken = jwt.sign(
      { userId: req.user.id },
      "manu-secret-key",
      { expiresIn: '1s' } // Token expires in 1 second
    );
  
    // Optionally, send this expired token to the client (though this is not necessary)
    return res.status(200).json({
      message: 'Logout successful',
      token: expiredToken,
    });

}

exports.UpdateUser = async (req, res) => {
  const { userId, email, username, password, currency } = req.body;

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    // Compare provided password with stored hash
    bcrypt.compare(password, user.password, async (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (!isMatch) {
        return res.status(401).json({ message: 'Failed to update!Invalid password submitted' });
      }

      // Update user fields
      user.email = email;
      user.username = username;
      user.currency = currency;

      try {
        await user.save();
        return res.status(200).json({ message: 'User updated successfully' });
      } catch (saveError) {
        console.error('Error saving user:', saveError);
        return res.status(500).json({ message: 'Failed to update user' });
      }
    });

  } catch (error) {
    console.error('Error finding user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.fetchUserData = async (req,res)=>{
  const {id}=req.params;
  const user = await UserModel.findById(id);
  if(user){
    const userData = {
      username:user.username,
      email:user.email,
      password:user.password,
      currency:user.currency
    }
    res.json({message:"Ok",userData})
  }
}

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use any other email service provider
  auth: {
    user: process.env.EMAIL_USER,  // Email user from .env file
    pass: process.env.EMAIL_PASS   // Email password from .env file
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Forgot Password Route
exports.ResetPassword=async (req,res)=>{
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User with this email does not exist" });
    }

    // Generate a reset token (JWT)
    const resetToken = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_RESET_PASSWORD_KEY,
      { expiresIn: '15m' }
    );

    // Save the token in the database
    await ResetToken.create({ token: resetToken, userId: user._id });

    // Define the reset URL to be sent in the email
   
    const resetURL = `${frontEndEnpoint}/reset-password/${user._id}/${resetToken}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Click the following link to reset your password: <a href="${resetURL}">${resetURL}</a></p>
        <p>This link will expire in 15 minutes.</p>
      `
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to send email" });
      } else {
        console.log('Email sent: ' + info.response);
        return res.json("success");
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
}


exports.FinalizeResetPassword= async (req,res)=>{

  const { id, token } = req.params;
  const { password } = req.body;

  try {
    console.log(`Resetting password for user ID: ${id}, token: ${token}`);

    // Find the reset token in the database
    const resetToken = await ResetToken.findOne({token: token,userId: id });
    console.log(resetToken); // Log the found token

    // Check if the token is valid and not used
    if (!resetToken) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    if (resetToken.isUsed) {
      return res.status(400).json({ error: "Token has already been used" });
    }

    // Verify the JWT
    const decoded = jwt.verify(token, process.env.JWT_RESET_PASSWORD_KEY);
    console.log(`Decoded JWT: ${JSON.stringify(decoded)}`); // Log the decoded token

    // Find the user and update the password
    const user = await UserModel.findById(decoded.id);
    user.password = await bcrypt.hash(password, 10); // Ensure password is hashed
    await user.save();

    // Mark the token as used
    resetToken.isUsed = true;
    await resetToken.save();

    return res.json({ message: "Password successfully reset" });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: "Server error" });
  }

}


const getAccessToken = async ()=> {
  const consumer_key = process.env.CONSUMER_KEY;
  const consumer_secret = process.env.CONSUMER_SECRET;
  const url =  "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const auth =
    "Basic " +
    new Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: auth,
      },
    });
   
    const dataresponse = response.data;
    // console.log(data);
    const accessToken = dataresponse.access_token;
    return accessToken;
  } catch (error) {
    throw error;
  }
}


const StkPush = async (accessToken, phonNumber,userId, amount) => {
  try {
    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const auth = "Bearer " + accessToken;
    const passkey = process.env.PASS_KEY;
    const ShortCode = process.env.MPESA_SHORTCODE;
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = Buffer.from(ShortCode + passkey + timestamp).toString("base64");

    const requestBody = {
      BusinessShortCode: ShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount, // or "1"
      PartyA: phonNumber,
      PartyB: ShortCode,
      PhoneNumber: phonNumber,
      CallBackURL: "https://mpesa-node-einu6olp0-mak-pentaroks-projects.vercel.app/api/v1/callback",
      AccountReference: "FinNance",
      TransactionDesc: "Mpesa Daraja API stk push test",
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: auth,
      },
    });

    
  const newTransaction = new Transaction({
    CheckoutRequestID:response.data.CheckoutRequestID,
    user: userId, // 👈 passing the user ID
    amount: 100,
    phoneNumber: phonNumber,
    status: 'pending',
    description: "STK push initiated"
  });
  
  await newTransaction.save();

    return response.data; // ✅ return only the safe part
  } catch (error) {
    console.error("STK Push error:", error?.response?.data || error.message);
    throw error;
  }
};


exports.Initiate = async (req, res) => {
  try {
    const { phonNumber,userId} = req.body;
    console.log(userId)
    const accessToken = await getAccessToken();
    const stkResponse = await StkPush(accessToken,phonNumber,userId, "1");

    res.json({ success: true, stkResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
  
};
exports.handleCallBack = async (req, res) => {
  try {
    const CheckoutRequestID = req.body.Body.stkCallback.CheckoutRequestID;
    const ResultCode = req.body.Body.stkCallback.ResultCode;
    const stkCallbackData = req.body.Body;
    let status = null;

    const transaction = await Transaction.findOne({ CheckoutRequestID });

    if (ResultCode == 0 && transaction) {
      status = "Success";
      transaction.status = "complete";
      await transaction.save();

      // 🔍 Subscription logic
      const user = await User.findById(transaction.user);
      if (user) {
        const now = new Date();

        // Helper to add 30 days
        const addDays = (date, days) => {
          const result = new Date(date);
          result.setDate(result.getDate() + days);
          return result;
        };

        let newSubscriptionEnd;

        if (user.trialEndsAt && user.trialEndsAt > now) {
          // On trial
          newSubscriptionEnd = addDays(user.trialEndsAt, 30);
        } else if (user.subscriptionEndsAt && user.subscriptionEndsAt > now) {
          // On active subscription
          newSubscriptionEnd = addDays(user.subscriptionEndsAt, 30);
        } else {
          // Expired or no trial/sub
          newSubscriptionEnd = addDays(now, 30);
        }

        // Update user access
        user.subscriptionEndsAt = newSubscriptionEnd;
        user.subscriptionType = "paid";
        user.activeAccess = true;
    

        await user.save();
      }

      console.log(transaction);
    } else {
      status = "Failed";
    }

    res.json({ status, stkCallbackData });
    console.log(req.body);
  } catch (error) {
    console.log("Callback Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.handleAccountDeletion = async (req,res)=>{
const {userId,password}=req.body;
console.log(req.body)
try {
const user= await User.findById(userId);
if(!user){
  return res.json({message:"Account does not exist"})
}
   // Compare provided password with stored hash
   bcrypt.compare(password, user.password, async (err, isMatch) => {
    if (err) {
      console.error('Error comparing passwords:', err);
      console.log(error)
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (!isMatch) {
      console.log(isMatch)
      return res.status(401).json({ message: 'Failed to update!Invalid password submitted' });
    }else{
       await User.findByIdAndDelete(userId);
      res.json({status:200,message:"Account deleted successfully"})
    }

})

 
} catch (error) {
  console.log(error)
  res.json({message:"Failed to delete!An error occurred!"})
}
}

exports.UserTransactions= async (req,res)=>{
  const {userId}=req.params;
  console.log("userId from req.body:", userId);
  try {
 
    const userTransactions = await Transaction.find({
      user: new mongoose.Types.ObjectId(userId),
    });

    res.json({message:"success",userTransactions})
  } catch (error) {
    console.log(error)
    res.json({message:"error occured",error})
  }
}

exports.ExpenseCap = async (req,res)=>{
  const {expense,userId}=req.body
  const user = await User.findById(userId);
  if (!user){
    return res.json({message:"No such user exists"})
  }
  user.expenseAlert == false;
  user.expenseCap=expense;
  await user.save()
  res.json({status:"Ok",message:"Limit set successfully"})
}

exports.BalanceCap = async (req,res)=>{
  const {balance,userId}=req.body
  const user = await User.findById(userId);
  if (!user){
    return res.json({message:"No such user exists"})
  }
  user.balanceCap=balance;
  await user.save()
  res.json({status:"Ok",message:"Limit set successfully"})
}
exports.Limits = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    const expenses = await Expense.find({ userId: userId });
    const incomes = await Income.find({ userId: userId }); // Assuming you have an Income model

    const expenseLimit = user.expenseCap;
    const balanceLimit = user.balanceCap;

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const balance = totalIncome - totalExpenses;

    // Check expense cap and send alert if necessary
    if (totalExpenses && expenseLimit!==null && totalExpenses > expenseLimit && !user.expenseAlert) {
      const loginUrl = frontEndEnpoint + "/login";
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Expense Cap Exceeded',
        html: `
          <p>You have exceeded your expense cap of <strong>${expenseLimit}</strong>.</p>
<p>Your current total expenses amount to <strong>${totalExpenses}</strong>.</p>
<p>Please log in to review your spending: <a href="${loginUrl}">${loginUrl}</a></p>
<p>Need help? Contact us at <em>support@FinNance.com</em></p>

          `
      };

      transporter.sendMail(mailOptions, async (error, info) => {
        if (!error) {
          user.expenseAlert = true;
          await user.save();
        } else {
          console.error("Expense alert email failed:", error);
        }
      });
    }

    // Check balance cap and send alert if necessary
    let balanceCapMessage = null;

    if (balanceLimit !== null && balance < balanceLimit && !user.balanceAlert) {

      const loginUrl = frontEndEnpoint + "/login";
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Balance Cap Exceeded',
        html: `
        <p>Your account balance of <strong>${balance}</strong> has fallen below your set cap of <strong>${balanceLimit}</strong>.</p>
<p>Please log in to review your finances: <a href="${loginUrl}">${loginUrl}</a></p>
<p>Need help? Contact us at <em>support@FinNance.com</em></p>

        `
      };

      transporter.sendMail(mailOptions, async (error, info) => {
        if (!error) {
          user.balanceAlert = true;
          await user.save();
        } else {
          console.error("Balance alert email failed:", error);
        }
      });

      balanceCapMessage = "Balance cap exceeded";
    }

    const Limits = {
      expenseCap: expenseLimit,
      balanceCap: balanceLimit,
      totalExpenses,
      totalIncome,
      balance
    };

    return res.json({
      status: "Ok",
      Limits,
      alert: balanceCapMessage || "No alerts"
    });

  } catch (error) {
    console.error("Error in Limits:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.resetBalanceCap = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    user.balanceCap = null; // or 0, depending on your logic
    user.balanceAlert = false; // reset alert flag too
    await user.save();

    res.json({ message: "Balance cap reset successfully" });
  } catch (error) {
    console.error("Error resetting balance cap:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.resetExpenseCap = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    user.expenseCap = null; // or 0, based on your logic
    user.expenseAlert = false; // reset alert flag
    await user.save();

    res.json({ message: "Expense cap reset successfully" });
  } catch (error) {
    console.error("Error resetting expense cap:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
