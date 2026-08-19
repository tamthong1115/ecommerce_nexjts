'use server';

import { requireAdmin } from "@/lib/require-admin";
import { UpdateEmailSettingsDTO, UpdateEmailSettingsSchema } from "../system-settings.dto";
import { updateEmailSettings } from "../system-settings.service";
import { revalidatePath } from "next/cache";
import { paths } from "@/lib/path";
import { ResponseFactory } from "@/lib/api-response";

export async function updateEmailSettingsAction(data: UpdateEmailSettingsDTO) {
    try {
        await requireAdmin();
        const body = UpdateEmailSettingsSchema.parse(data);
        await updateEmailSettings(body);
        
        // revalidatePath(paths.manager.system_settings.email);
        revalidatePath(paths.manager.system_settings.default);
        
        return ResponseFactory.success({ message: "Email settings updated successfully" });
    } catch (error) {
        return ResponseFactory.handleError(error);
    }
}
