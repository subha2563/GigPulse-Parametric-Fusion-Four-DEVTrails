import Claim from '../models/Claim.js';

/**
 * Idempotency Middleware: The "Steel Trap"
 * Prevents duplicate transactions within a 24-hour window using a unique claimID or transactionID.
 */
export const checkIdempotency = async (req, res, next) => {
    const idempotencyKey = req.body.claimID || req.body.transactionID || req.headers['x-idempotency-key'];

    if (!idempotencyKey) {
        // If no key is provided, we allow the request to proceed but log a warning.
        // In a production environment, you might want to enforce this.
        console.warn("⚠️ No Idempotency Key provided for transaction.");
        return next();
    }

    try {
        // Look back 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const existingClaim = await Claim.findOne({
            idempotencyKey,
            timestamp: { $gte: twentyFourHoursAgo }
        });

        if (existingClaim) {
            console.log(`🛑 Idempotent Lock Triggered for Key: ${idempotencyKey}`);
            return res.status(409).json({
                status: "fail",
                message: "Idempotent Lock: Transaction already processed."
            });
        }

        // Attach key to request for use in the route handler
        req.idempotencyKey = idempotencyKey;
        next();
    } catch (error) {
        console.error("🔥 Idempotency Middleware Error:", error);
        res.status(500).json({ error: "Internal server error during idempotency check." });
    }
};
