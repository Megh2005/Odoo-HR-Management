import mongoose from "mongoose";

const SalarySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        // Base salary in ₹ (required)
        basic: {
            type: Number,
            required: true,
            min: 0,
        },
        // Credit components (% of basic)
        hra: { type: Number, default: 0, min: 0 },       // House Rent Allowance
        da: { type: Number, default: 0, min: 0 },        // Dearness Allowance
        bonus: { type: Number, default: 0, min: 0 },     // Performance Bonus
        otherAllowances: { type: Number, default: 0, min: 0 },

        // Debit components (% of basic)
        pf: { type: Number, default: 0, min: 0 },        // Provident Fund
        tax: { type: Number, default: 0, min: 0 },       // Income Tax
        otherDeductions: { type: Number, default: 0, min: 0 },
    },
    {
        timestamps: true,
    }
);

// One salary record per employee per org
SalarySchema.index({ userId: 1, organizationId: 1 }, { unique: true });

const Salary = mongoose.models.Salary || mongoose.model("Salary", SalarySchema);

if (mongoose.models.Salary) {
    (Salary as any).schema = SalarySchema;
}

export default Salary;
