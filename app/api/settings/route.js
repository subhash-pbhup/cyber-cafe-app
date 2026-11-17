import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema({
  cafeName: { type: String, default: "CyberCafe" },
  phone: { type: String, default: "" },
  address: { type: String, default: "Dwivedi Market, Sangam Chauraha, Lalganj Ajhara, Pratapgarh" }, // Updated Address
  defaultRate: { type: Number, default: 50 },
  graceMinutes: { type: Number, default: 10 },
}, { timestamps: true });

const Setting = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);

export async function GET() {
  try {
    await connectMongoDB();
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        address: "Dwivedi Market, Sangam Chauraha, Lalganj Ajhara, Pratapgarh"
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching settings" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectMongoDB();
    const body = await request.json();

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(body);
    } else {
      settings = await Setting.findOneAndUpdate({}, body, { new: true });
    }

    return NextResponse.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    return NextResponse.json({ message: "Error updating settings" }, { status: 500 });
  }
}