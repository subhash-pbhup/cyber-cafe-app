import mongoose, { Schema } from "mongoose";

const bookingSchema = new Schema(
  {
    computerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Computer",
      required: true,
    },
    computerName: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    idNumber: { type: String, default: "" },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, default: "CONFIRMED" },
    bookingType: { type: String, default: "OFFLINE" }, // NAYA: Online ya Offline pehchanne ke liye
  },
  { timestamps: true },
);

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;
