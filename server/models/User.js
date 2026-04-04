import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    // The 5-Star Metric: Tracking active delivery days (Guidewire 7-day rule)
    activeDeliveryDays: { type: Number, default: 0 }, 
    // Is the ₹50 premium paid?
    policyActive: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 }
});

export default mongoose.model('User', userSchema);