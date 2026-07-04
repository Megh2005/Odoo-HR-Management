import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: String, // YYYY-MM-DD
            required: true,
        },
        checkIn: {
            type: Date,
        },
        checkOut: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["present", "absent", "leave"],
            default: "present",
        },
        workingHours: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to guarantee only one record per employee per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

if (mongoose.models.Attendance) {
    (Attendance as any).schema = AttendanceSchema;
}

export default Attendance;
