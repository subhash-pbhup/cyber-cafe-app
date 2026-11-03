import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 },
    );

    // Cookie ko delete karne ke liye maxAge ko 0 kar dete hain
    response.cookies.set("admin-token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: "Error logging out" }, { status: 500 });
  }
}
