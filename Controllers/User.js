require('dotenv').config();
const axios = require("axios")
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
const bcrypt = require('bcryptjs');
const ResetToken = require('../models/ResetPasswordToken')
const UserModel = require('../models/User');
exports.createUser = async (req,res)=>{
    try {
        const {username,email,password}=req.body;
        if(!username || !email || !password){
            return res.status(400).json({message:"Fill in required fields"})
        }
        const newUser = User.createUser({
            username,
            email,
            password
        })
        return res.status(200).json({message:"Ok"}) 
    } catch (error) {
        return res.status(500).json({message:"Server Error"}) 
    }
}

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
exports.signUp = async(req,res)=>{

    try {
        const { username, email, password } = req.body;
      
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: "Account already exists with this email" });
        }
      
        const hashedPassword = await bcrypt.hash(password, 10);
        const userDoc = await User.create({ username, email, password: hashedPassword });
      
        return res.json('Ok')
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Something went wrong. Please try again later." });
      }
      
}

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
    const frontEndEnpoint = process.env.FRONT_END_URL;
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


exports.getAccessToken = async ()=> {
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
