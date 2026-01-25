import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export const putData = async ({
  url,
  body,
  contentType = undefined,
  t,
}: {
  url: string;
  body: FormData | Record<string, string | number>;
  contentType?: string | undefined;
  t: ReturnType<typeof useTranslations>;
}) => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`,
  };

  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: headers,
      body: !contentType ? (body as BodyInit) : JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.json();
      toast(t('t_action_failed_not'), {
        description: t(errorText.message || 't_unknown_error_noti'),
      });
    }
    return response;
  } catch (e) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error('Failed to post data:', error);
    throw e; // Re-throw the error after logging it
  }
};
