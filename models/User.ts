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
            required: [true, "Please provide a password"],
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
