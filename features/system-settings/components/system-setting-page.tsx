import EmailSettingsForm from "./email/EmailSettingsForm";
import { getEmailSettingsData } from "../server/controller/system-settings.data";

export default async function SystemSettingPage() {
  const result = await getEmailSettingsData();

  if (!result.success || !result.data) {
    return (
      <div className="w-full p-6 flex flex-col items-center">
        <p className="text-destructive">Failed to load system settings.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 flex flex-col justify-start items-center overflow-y-auto">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Manage your system configurations including email providers and SMTP configurations.
          </p>
        </div>
        
        <div className="flex flex-col gap-6 w-full pb-10">
          <EmailSettingsForm initialData={result.data} />
        </div>
      </div>
    </div>
  );
}
