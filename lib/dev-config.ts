import { z } from 'zod';

const DevConfigSchema = z.object({
    mockOtp: z.boolean().default(false),

    mockEmails: z.boolean().default(false),

});

const parseBooleanEnv = (val: string | undefined) => val === 'true' || val === '1';

const isDev = process.env.NODE_ENV === 'development';

export const devConfig = DevConfigSchema.parse({
    mockOtp: isDev && parseBooleanEnv(process.env.NEXT_PUBLIC_MOCK_OTP),
    mockEmails: isDev && parseBooleanEnv(process.env.NEXT_PUBLIC_MOCK_EMAILS),
});
