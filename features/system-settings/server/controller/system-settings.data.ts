import { requireAdmin } from "@/lib/require-admin";
import { getEmailSettingsPublic } from "../system-settings.service";
import { ResponseFactory } from "@/lib/api-response";
import { EmailSettingsPublicDTO } from "../system-settings.dto";

export async function getEmailSettingsData() {
    try {
        await requireAdmin();
        const data = await getEmailSettingsPublic();
        return ResponseFactory.success<EmailSettingsPublicDTO>({ data });
    } catch (error) {
        return ResponseFactory.handleError(error);
    }
}
