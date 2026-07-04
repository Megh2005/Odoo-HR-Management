import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { text, fileData, mimeType } = await req.json();
        if ((!text || text.trim().length === 0) && (!fileData || !mimeType)) {
            return NextResponse.json({ message: "No resume text or file data provided" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ message: "Gemini API key is not configured on the server" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Analyze the attached resume file (or text) and extract:
1. A professional, engaging bio/summary (concise 2-4 sentences).
2. A list of key professional, technical, or soft skills.
3. Some important achievements, education, or career milestones as bullet points.

You must respond STRICTLY with a valid JSON object. Do not wrap the JSON in markdown code blocks, backticks, or any other formatting. The JSON object must strictly have this schema:
{
  "bio": "string",
  "skills": ["string"],
  "importantPoints": ["string"]
}`;

        const contentParts: any[] = [prompt];

        if (fileData && mimeType) {
            const base64Data = fileData.replace(/^data:.*?;base64,/, "");
            contentParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            });
        } else {
            contentParts.push(`Here is the resume text to analyze:\n${text}`);
        }

        const result = await model.generateContent(contentParts);
        let rawText = result.response.text().trim();

        // Strip markdown code block wrappers if Gemini outputs them
        if (rawText.startsWith("```")) {
            rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
        }

        let parsedData;
        try {
            parsedData = JSON.parse(rawText);
        } catch (parseError) {
            console.error("Gemini output parsing failed. Raw response:", rawText);
            return NextResponse.json({ 
                message: "Failed to parse AI response. Please try again.",
                rawText 
            }, { status: 422 });
        }

        return NextResponse.json(parsedData, { status: 200 });

    } catch (error: any) {
        console.error("Resume parsing error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
