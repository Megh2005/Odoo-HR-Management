import { NextRequest, NextResponse } from 'next/server';
import { imagekit } from '@/lib/imagekit';

export async function POST(request: NextRequest) {
    try {
        // Check if all required environment variables are present
        if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
            return NextResponse.json(
                { error: 'Missing required ImageKit configuration' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = 'communities'; // Upload to communities folder

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload an image.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = file.name || `image_${Date.now()}`;

        // Upload to ImageKit
        const uploadResult = await imagekit.files.upload({
            file: buffer.toString('base64'),
            fileName: fileName,
            folder: folder,
        });

        return NextResponse.json({
            secure_url: uploadResult.url || '',
            public_id: uploadResult.fileId || '',
            width: uploadResult.width || 0,
            height: uploadResult.height || 0,
        });

    } catch (error) {
        console.error('ImageKit upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload image to ImageKit' },
            { status: 500 }
        );
    }
}