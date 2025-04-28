const router = require("express").Router();
const axios = require("axios");
const moment = require('moment');
const User = require('../models/User')
const {addIncome, getIncomes, deleteIncome}= require('../Controllers/AddIncome');
const { addExpense, getExpense, deleteExpense } = require("../Controllers/Expenses");
const { addSaving, getSavings, deleteSaving } = require("../Controllers/Saving");
const { verifyUser, signUp, signInUser, AuthVerify, LogoutUser, UpdateUser, fetchUserData, ResetPassword, FinalizeResetPassword,getAccessToken, StkPush, Initiate, handleCallBack, handleAccountDeletion, UserTransactions, ExpenseCap, BalanceCap,Limits, resetBalanceCap, resetExpenseCap, SendMessage } = require("../Controllers/User");

router.post('/add-income',addIncome)
            .get('/get-incomes/:id',getIncomes)
            .get('/getlimits/:userId',Limits)
            .get('/verifyuser',verifyUser,AuthVerify)
            .get('/userdata/:id',fetchUserData)
            .get('/check-expired-users', async (req, res) => {
              const now = new Date();
              try {
                await User.updateMany(
                  { expires: { $lt: now }, isSuspended: false },
                  { $set: { isSuspended: true } }
                );
                res.status(200).json({ message: 'Checked and updated user statuses' });
              } catch (err) {
                res.status(500).json({ error: 'Something went wrong' });
              }
            })

            .get("/mpesa", (req, res) => {
                res.send("MPESA DARAJA API WITH NODE JS BY UMESKIA SOFTWARES");
                var timeStamp = moment().format("YYYYMMDDHHmmss");
                console.log(timeStamp);
              })

              .get("/access_token", (req, res) => {
                getAccessToken()
                  .then((accessToken) => {
                    res.send("😀 Your access token is " + accessToken);
                  })
                  .catch(console.log);
              })

.post('/initiate',Initiate)
              .post("/callback", handleCallBack)

         
              


            .post('/signup',signUp)
            .post('/login',signInUser)
            .post('/logout',verifyUser,LogoutUser)
            .post('/user/delete',handleAccountDeletion)
            .post('/reset-password',ResetPassword)
            .post('/reset-password/:id/:token',FinalizeResetPassword)
            .post('/user/update',UpdateUser)
            .post('/expensecap',ExpenseCap)
            .post('/balanceCap',BalanceCap)
            .post('/resetBalance',resetBalanceCap)
            .post('/resetExpense',resetExpenseCap)
            .delete('/delete-income/:id',deleteIncome)
            .post('/message',SendMessage)
            .post('/add-saving',addSaving)
            .get('/get-savings/:id',getSavings)
            .delete('/delete-saving/:id',deleteSaving)
            .post('/add-expense',addExpense)
            .get('/user/transactions/:userId',UserTransactions)
            .get('/get-expenses/:id',getExpense)
            .delete('/delete-expense/:id',deleteExpense)
module.exports = router;