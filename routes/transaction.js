const router = require("express").Router();
const axios = require("axios");
const moment = require('moment');

const {addIncome, getIncomes, deleteIncome}= require('../Controllers/AddIncome');
const { addExpense, getExpense, deleteExpense } = require("../Controllers/Expenses");
const { addSaving, getSavings, deleteSaving } = require("../Controllers/Saving");
const { verifyUser, signUp, signInUser, AuthVerify, LogoutUser, UpdateUser, fetchUserData, ResetPassword, FinalizeResetPassword,getAccessToken } = require("../Controllers/User");

router.post('/add-income',addIncome)
            .get('/get-incomes/:id',getIncomes)
            .get('/verifyuser',verifyUser,AuthVerify)
            .get('/userdata/:id',fetchUserData)

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

              .get("/stkpush", (req, res) => {
                getAccessToken()
                  .then((accessToken) => {
                    const url =
                      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
                    const auth = "Bearer " + accessToken;
                    const timestamp = moment().format("YYYYMMDDHHmmss");
                    const password = new Buffer.from(
                      "174379" +
                        "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" +
                        timestamp
                    ).toString("base64");
              
                    axios
                      .post(
                        url,
                        {
                          BusinessShortCode: "174379",
                          Password: password,
                          Timestamp: timestamp,
                          TransactionType: "CustomerPayBillOnline",
                          Amount: "1",
                          PartyA: "254705670506", //phone number to receive the stk push
                          PartyB: "174379",
                          PhoneNumber: "254705670506",
                          CallBackURL: "https://mydomain.com/pat",
                          AccountReference: "FinNance",
                          TransactionDesc: "Mpesa Daraja API stk push test",
                        },
                        {
                          headers: {
                            Authorization: auth,
                          },
                        }
                      )
                      .then((response) => {
                        res.send("😀 Request is successful done ✔✔. Please enter mpesa pin to complete the transaction");
                      })
                      .catch((error) => {
                        console.log(error);
                        res.status(500).send("❌ Request failed");
                      });
                  })
                  .catch(console.log);
              })

              .post("/callback", (req, res) => {
                console.log("STK PUSH CALLBACK");
                const CheckoutRequestID = req.body.Body.stkCallback.CheckoutRequestID;
                const ResultCode = req.body.Body.stkCallback.ResultCode;
                var json = JSON.stringify(req.body);
                fs.writeFile("stkcallback.json", json, "utf8", function (err) {
                  if (err) {
                    return console.log(err);
                  }
                  console.log("STK PUSH CALLBACK JSON FILE SAVED");
                });
                console.log(req.body);
              })

              .get("/registerurl", (req, resp) => {
                getAccessToken()
                  .then((accessToken) => {
                    const url = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl";
                    const auth = "Bearer " + accessToken;
                    axios
                      .post(
                        url,
                        {
                          ShortCode: "174379",
                          ResponseType: "Complete",
                          ConfirmationURL: "http://example.com/confirmation",
                          ValidationURL: "http://example.com/validation",
                        },
                        {
                          headers: {
                            Authorization: auth,
                          },
                        }
                      )
                      .then((response) => {
                        resp.status(200).json(response.data);
                      })
                      .catch((error) => {
                        console.log(error);
                        resp.status(500).send("❌ Request failed");
                      });
                  })
                  .catch(console.log);
              })

              .get("/confirmation", (req, res) => {
                console.log("All transaction will be sent to this URL");
                console.log(req.body);
              })

              .get("/validation", (req, resp) => {
                console.log("Validating payment");
                console.log(req.body);
              })

              .get("/b2curlrequest", (req, res) => {
                getAccessToken()
                  .then((accessToken) => {
                    const securityCredential =
                      "N3Lx/hisedzPLxhDMDx80IcioaSO7eaFuMC52Uts4ixvQ/Fhg5LFVWJ3FhamKur/bmbFDHiUJ2KwqVeOlSClDK4nCbRIfrqJ+jQZsWqrXcMd0o3B2ehRIBxExNL9rqouKUKuYyKtTEEKggWPgg81oPhxQ8qTSDMROLoDhiVCKR6y77lnHZ0NU83KRU4xNPy0hRcGsITxzRWPz3Ag+qu/j7SVQ0s3FM5KqHdN2UnqJjX7c0rHhGZGsNuqqQFnoHrshp34ac/u/bWmrApUwL3sdP7rOrb0nWasP7wRSCP6mAmWAJ43qWeeocqrz68TlPDIlkPYAT5d9QlHJbHHKsa1NA==";
                    const url = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
                    const auth = "Bearer " + accessToken;
                    axios
                      .post(
                        url,
                        {
                          InitiatorName: "testapi",
                          SecurityCredential: securityCredential,
                          CommandID: "PromotionPayment",
                          Amount: "1",
                          PartyA: "600996",
                          PartyB: "",//phone number to receive the stk push
                          Remarks: "Withdrawal",
                          QueueTimeOutURL: "https://mydomain.com/b2c/queue",
                          ResultURL: "https://mydomain.com/b2c/result",
                          Occasion: "Withdrawal",
                        },
                        {
                          headers: {
                            Authorization: auth,
                          },
                        }
                      )
                      .then((response) => {
                        res.status(200).json(response.data);
                      })
                      .catch((error) => {
                        console.log(error);
                        res.status(500).send("❌ Request failed");
                      });
                  })
                  .catch(console.log);
              })
              


            .post('/signup',signUp)
            .post('/login',signInUser)
            .post('/logout',verifyUser,LogoutUser)
            .post('/reset-password',ResetPassword)
            .post('/reset-password/:id/:token',FinalizeResetPassword)
            .post('/user/update',UpdateUser)
            .delete('/delete-income/:id',deleteIncome)
            .post('/add-saving',addSaving)
            .get('/get-savings/:id',getSavings)
            .delete('/delete-saving/:id',deleteSaving)
            .post('/add-expense',addExpense)
            .get('/get-expenses/:id',getExpense)
            .delete('/delete-expense/:id',deleteExpense)
module.exports = router;