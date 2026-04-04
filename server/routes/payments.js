import express from 'express';
import User from '../models/User.js';
import Claim from '../models/Claim.js';

const router = express.Router();

// ==========================================
// THE 5-STAR ZERO-TOUCH PAYOUT ROUTE
// ==========================================
router.post('/process-payout', async (req, res) => {
    const { userId, aiTrustScore } = req.body;

    try {
        // 1. Actuarial Rule Check: Get the user
        const worker = await User.findById(userId);
        if (!worker) return res.status(404).json({ error: "Worker not found." });
        
        if (!worker.policyActive) {
            return res.status(400).json({ error: "Policy inactive. Weekly premium not paid." });
        }
        
        // Guidewire Slide 2 Requirement: Must have 7 active days!
        if (worker.activeDeliveryDays < 7) {
            return res.status(400).json({ error: "Ineligible: Minimum 7 active delivery days required." });
        }

        // 2. Create the Pending Claim in the Database
        const newClaim = await Claim.create({
            userId: worker._id,
            aiTrustScore: aiTrustScore,
            status: 'Pending'
        });

        // 3. SIMULATE RAZORPAY API CALL (The Hackathon Sandbox)
        console.log("Initiating Razorpay Sandbox Transfer of ₹400...");
        
        // Simulating a random network failure 10% of the time to prove the rollback works
        const razorpaySuccess = Math.random() > 0.10; 

        if (!razorpaySuccess) {
            // ROLLBACK LOGIC: Razorpay failed! Do not give the user the money!
            newClaim.status = 'Failed';
            await newClaim.save();
            throw new Error("Razorpay Gateway Timeout.");
        }

        // 4. TRANSACTION SUCCESS: Update Wallet and Claim
        worker.walletBalance += 400;
        await worker.save();

        newClaim.status = 'Paid';
        await newClaim.save();

        res.status(200).json({
            status: "success",
            message: "₹400 Payout successful via Razorpay Sandbox.",
            newBalance: worker.walletBalance
        });

    } catch (error) {
        console.error("Payout Failed / Rolled Back:", error.message);
        res.status(500).json({ error: "Transaction rolled back due to gateway failure." });
    }
});

export default router;