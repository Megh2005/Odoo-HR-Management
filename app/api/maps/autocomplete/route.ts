import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const input = searchParams.get("input");

        if (!input) {
            return NextResponse.json({ predictions: [] }, { status: 200 });
        }

        const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ message: "Google Maps API Key is not configured" }, { status: 500 });
        }

        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`
        );

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error("Autocomplete proxy error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
