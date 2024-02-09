const express = require('express');
const { authMiddleware } = require('../middleware');
const { Account } = require('../db');
const { default: mongoose } = require('mongoose');

const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
    try {
        const account = await Account.findOne({
            userId: req.userId
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        res.json({
            balance: account.balance
        });
    } catch (error) {
        console.error("Error fetching account balance:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    session.startTransaction();
    const { amount, to } = req.body;

    // Fetch the accounts within the transaction
    const account = await Account.findOne({ userId: req.userId }).session(session);

    if (!account || account.balance < amount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "Insufficient balance"
        });
    }

    const toAccount = await Account.findOne({ userId: to }).session(session);

    if (!toAccount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "Invalid account"
        });
    }

    // Perform the transfer
    await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
    await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

    // Commit the transaction
    await session.commitTransaction();
    res.json({
        message: "Transfer successful"
    });
});

// router.post("/transfer", authMiddleware, async (req, res) => {
//     try {
//       const { amount, to } = req.body;
  
//       // Fetch the accounts
//       const account = await Account.findOne({ userId: req.userId });
//       const toAccount = await Account.findOne({ userId: to });
  
//       if (!account || !toAccount || account.balance < amount) {
//         return res.status(400).json({
//           message: "Insufficient balance or invalid account"
//         });
//       }
  
//       // Perform the transfers individually with optimistic locking
//       const updatedAccount = await Account.findOneAndUpdate(
//         { userId: req.userId, balance: { $gte: amount } },
//         { $inc: { balance: -amount } },
//         { new: true } // Return the updated document
//       );
//       if (!updatedAccount) {
//         return res.status(409).json({ message: "Insufficient balance" }); // Conflict error
//       }
  
//       const updatedToAccount = await Account.findOneAndUpdate(
//         { userId: to },
//         { $inc: { balance: amount } },
//         { new: true }
//       );
//       if (!updatedToAccount) {
//         // Handle potential race condition (unlikely with low volume)
//         // You could either rollback the first update or retry the entire operation
//         console.error("Unexpected error during transfer. Consider rolling back or retrying.");
//       }
  
//       res.json({ message: "Transfer successful" });
//     } catch (error) {
//       console.error("Error during transfer:", error);
//       res.status(500).json({ message: "Transfer failed" });
//     }
//   });
  


module.exports = router;