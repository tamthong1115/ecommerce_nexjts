import { NextRequest } from 'next/server';
import { getEmailSettingsData } from '@/features/system-settings/server/controller/system-settings.data';
import { updateEmailSettingsAction } from '@/features/system-settings/server/controller/system-settings.action';
import { ResponseFactory } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    const result = await getEmailSettingsData();
    return ResponseFactory.toNextResponse(result);
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await updateEmailSettingsAction(body);
        return ResponseFactory.toNextResponse(result);
    } catch (error) {
        return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
    }
}
