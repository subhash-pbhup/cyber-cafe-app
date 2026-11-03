import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";

export async function GET(request) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    let filter = {};
    if (date) filter.date = date;

    const bookings = await Booking.find(filter);

    const CANCEL_GRACE_MINUTES =
      Number(
        process.env.CANCEL_GRACE_MINUTES ||
          process.env.NEXT_PUBLIC_CANCEL_GRACE_MINUTES,
      ) || 10;
    const now = new Date();

    for (const b of bookings) {
      // FIX: Sirf tabhi auto-cancel hoga jab booking strictly PENDING ho. CONFIRMED ya COMPLETED ko touch nahi karna hai.
      if (b.bookingType === "ONLINE" && b.status === "PENDING") {
        const [year, month, day] = b.date.split("-").map(Number);
        const [hours, mins] = b.startTime.split(":").map(Number);

        const bStartDateTime = new Date(year, month - 1, day, hours, mins, 0);
        const graceTime = new Date(
          bStartDateTime.getTime() + CANCEL_GRACE_MINUTES * 60000,
        );

        if (now > graceTime) {
          await Booking.findByIdAndUpdate(b._id, { status: "CANCELLED" });
          b.status = "CANCELLED";
        }
      }
    }

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching bookings" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await connectMongoDB();
    const {
      computerId,
      computerName,
      customerName,
      customerPhone,
      idNumber,
      date,
      startTime,
      endTime,
      status,
      bookingType,
      amount,
    } = await request.json();

    const existingBookings = await Booking.find({
      computerId,
      date,
      status: { $in: ["CONFIRMED", "PENDING"] },
    });

    const isOverlapping = existingBookings.some((booking) => {
      return startTime < booking.endTime && endTime > booking.startTime;
    });

    if (isOverlapping)
      return NextResponse.json(
        { message: "Slot not available" },
        { status: 400 },
      );

    const newBooking = await Booking.create({
      computerId,
      computerName,
      customerName,
      customerPhone,
      idNumber,
      date,
      startTime,
      endTime,
      status: status || "CONFIRMED",
      bookingType: bookingType || "OFFLINE",
      amount: amount || 0,
    });

    return NextResponse.json(
      { message: "Booking successful", newBooking },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error making booking" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    await connectMongoDB();
    const {
      id,
      status,
      endTime,
      startTime,
      customerName,
      customerPhone,
      idNumber,
      action,
    } = await request.json();

    if (action === "START_SESSION") {
      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { status: "CONFIRMED", startTime, endTime },
        { new: true },
      );
      return NextResponse.json(
        { message: "Session Started", updatedBooking },
        { status: 200 },
      );
    }

    if (customerName) {
      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { customerName, customerPhone, idNumber },
        { new: true },
      );
      return NextResponse.json(
        { message: "Details updated", updatedBooking },
        { status: 200 },
      );
    }

    if (endTime && !startTime) {
      const booking = await Booking.findById(id);
      const existingBookings = await Booking.find({
        computerId: booking.computerId,
        date: booking.date,
        status: { $in: ["CONFIRMED", "PENDING"] },
        _id: { $ne: id },
      });
      const isOverlapping = existingBookings.some(
        (b) => booking.startTime < b.endTime && endTime > b.startTime,
      );

      if (isOverlapping)
        return NextResponse.json(
          { message: "Aage ka time book hai. Extend nahi kar sakte." },
          { status: 400 },
        );

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { endTime },
        { new: true },
      );
      return NextResponse.json(
        { message: "Time extended", updatedBooking },
        { status: 200 },
      );
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    return NextResponse.json(
      { message: "Booking updated", updatedBooking },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating booking" },
      { status: 500 },
    );
  }
}
