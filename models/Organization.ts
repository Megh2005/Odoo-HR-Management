import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide organization name"],
        },
        logo: {
            type: String, // URL of the logo image
        },
        address: {
            type: String,
        },
        additionalInfo: {
            type: Map,
            of: String,
            default: {},
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        checkInStart: {
            type: String,
            default: "09:00",
        },
        checkInEnd: {
            type: String,
            default: "11:00",
        },
    },
    {
        timestamps: true,
    }
);

const Organization = mongoose.models.Organization || mongoose.model("Organization", OrganizationSchema);
if (mongoose.models.Organization) {
    (Organization as any).schema = OrganizationSchema;
}

export default Organization;
