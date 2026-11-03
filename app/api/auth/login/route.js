import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Default Username aur Password (Aap ise badal sakte hain)
    if (username === "admin" && password === "admin123") {
      const response = NextResponse.json(
        { message: "Login successful" },
        { status: 200 },
      );

      // Token 1 din ke liye set hoga
      response.cookies.set("admin-token", "authenticated", {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return response;
    } else {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
