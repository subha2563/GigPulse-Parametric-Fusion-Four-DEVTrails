import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Claim from '../models/Claim.js';
import { checkIdempotency } from '../middleware/idempotency.js';

const router = express.Router();

router.post('/initiate-claim', checkIdempotency, async (req, res) => {
    console.log("🚀 Payout Request Received!");
    try {
        // 1. Get a valid user (Bypassing Kavi's dummy ID)
        let worker = await User.findOne();
        
        if (!worker) {
            console.log("⚠️ No user found, creating mock for demo...");
            worker = await User.create({
                name: "Ravi Kumar",
                phone: "9876543210",
                walletBalance: 0,
                activeDeliveryDays: 26,
                policyActive: true
            });
        }

        const userIdStr = worker._id.toString();
        console.log(`🔍 Checking claims for User: ${userIdStr}`);

        // 2. EXTRACTED TO MIDDLEWARE
        // The checkIdempotency middleware now handles blocking duplicate transactions within 24 hours.

        // 3. Save the Claim
        const newClaim = new Claim({
            userId: userIdStr,
            amount: 400,
            status: 'Paid',
            timestamp: new Date(),
            aiTrustScore: 92,
            isFraud: false,
            reason: 'Verified via Sensor Fusion (Demo Mode)',
            idempotencyKey: req.idempotencyKey
        });

        await newClaim.save();
        console.log('DEBUG: Just saved ID ' + userIdStr);
        console.log("✅ Payout Successful! Claim Saved.");

        return res.status(200).json({ 
            success: true, 
            message: "₹400 Payout Disbursed Successfully!" 
        });

    } catch (error) {
        console.error("🔥 BACKEND CRASH ERROR:", error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;