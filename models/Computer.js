import mongoose, { Schema } from "mongoose";

const computerSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    hourlyRate: { type: Number, required: true },
  },
  { timestamps: true },
);

const Computer =
  mongoose.models.Computer || mongoose.model("Computer", computerSchema);
export default Computer;
