import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Computer from "@/models/Computer";

// GET: Sabhi PCs fetch karna
export async function GET() {
  try {
    await connectMongoDB();
    const computers = await Computer.find({});
    return NextResponse.json(computers);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching computers" },
      { status: 500 },
    );
  }
}

// POST: Naya PC add karna
export async function POST(request) {
  try {
    await connectMongoDB();
    const { name, hourlyRate } = await request.json();
    const newComputer = await Computer.create({ name, hourlyRate });
    return NextResponse.json(
      { message: "Computer added", newComputer },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error adding computer" },
      { status: 500 },
    );
  }
}

// PATCH: PC ki details update karna (Edit)
export async function PATCH(request) {
  try {
    await connectMongoDB();
    const { id, name, hourlyRate, isActive } = await request.json();
    const updatedComputer = await Computer.findByIdAndUpdate(
      id,
      { name, hourlyRate, isActive },
      { new: true },
    );
    return NextResponse.json(
      { message: "Computer updated", updatedComputer },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating computer" },
      { status: 500 },
    );
  }
}

// DELETE: PC ko system se hatana
export async function DELETE(request) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await Computer.findByIdAndDelete(id);
    return NextResponse.json({ message: "Computer deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error deleting computer" },
      { status: 500 },
    );
  }
}
