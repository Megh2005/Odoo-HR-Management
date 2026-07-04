import ImageKit from '@imagekit/nodejs';

if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    throw new Error('Missing ImageKit configuration');
}

export const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

export function extractFilenameAndPath(url: string): { filename: string; relativePath: string } | null {
    try {
        const urlObj = new URL(url);
        const endpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';
        const endpointObj = new URL(endpoint);

        // Extract path relative to endpoint
        const relativePath = urlObj.pathname.startsWith(endpointObj.pathname)
            ? urlObj.pathname.slice(endpointObj.pathname.length)
            : urlObj.pathname;

        const normalizedPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
        const filename = normalizedPath.substring(normalizedPath.lastIndexOf('/') + 1);

        return { filename, relativePath: normalizedPath };
    } catch (error) {
        console.error('Error extracting filename/path:', error);
        return null;
    }
}

export async function deleteImage(url: string) {
    const isImageKitUrl = url.includes('imagekit.io') || url.includes('ik.imagekit.io');
    if (!isImageKitUrl) {
        return { result: 'ignored', message: 'Not an ImageKit URL' };
    }

    const extraction = extractFilenameAndPath(url);
    if (!extraction) {
        throw new Error('Could not extract filename and path from URL');
    }

    const { filename, relativePath } = extraction;

    // Search for the file in ImageKit
    const files = await imagekit.assets.list({
        searchQuery: `name="${filename}"`,
    });

    if (!files || files.length === 0) {
        return { result: 'not found' };
    }

    // Find the file that matches the relative path or URL
    const file = files.find((f: any) => f.filePath === relativePath || f.url === url);
    if (!file) {
        return { result: 'not found' };
    }

    const fileId = (file as any).fileId;
    if (!fileId) {
        return { result: 'not found' };
    }

    await imagekit.files.delete(fileId);
    return { result: 'ok' };
}
