import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Data = buffer.toString('base64');
        const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

        if (!scriptUrl) {
            return NextResponse.json({ error: 'Server configuration error: Missing Script URL' }, { status: 500 });
        }

        const payload = {
            file: base64Data,
            type: file.type,
            fileName: file.name
        };

        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('GAS Error Response:', text);
            throw new Error(`Script returned ${response.status}`);
        }

        const data = await response.json().catch(() => ({ status: 'success' }));
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
