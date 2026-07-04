import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide a name"],
        },
        email: {
            type: String,
            required: [true, "Please provide an email"],
            unique: true,
        },
        password: {
            type: String,
        },
        employeeId: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: ["employee", "hr"],
            default: "employee",
            required: [true, "Please provide a role"],
        },
        status: {
            type: String,
            enum: ["pending", "active"],
            default: "active",
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
        },
        avatar: {
            type: String,
        },
        gender: {
            type: String,
            enum: ["male", "female", "non binary"],
            default: "male",
        },
        state: {
            type: String,
        },
        city: {
            type: String,
        },
        pincode: {
            type: String,
        },
        isAddressUpdated: {
            type: Boolean,
            default: false,
        },
        bio: {
            type: String,
            default: "",
        },
        skills: {
            type: [String],
            default: [],
        },
        importantPoints: {
            type: [String],
            default: [],
        },
        // ── Security / Private Info fields ──────────────────────────────
        dateOfBirth: {
            type: String,
        },
        residingAddress: {
            type: String,
        },
        nationality: {
            type: String,
        },
        personalEmail: {
            type: String,
        },
        maritalStatus: {
            type: String,
            enum: ["single", "married", "divorced", "widowed"],
        },
        dateOfJoining: {
            type: String,
        },
        bankAccountNumber: {
            type: String,
        },
        bankName: {
            type: String,
        },
        ifscCode: {
            type: String,
        },
        panNo: {
            type: String,
        },
        uanNo: {
            type: String,
        },
        empCode: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
if (mongoose.models.User) {
    (User as any).schema = UserSchema;
}

export default User;
