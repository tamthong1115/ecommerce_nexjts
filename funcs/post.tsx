export const postData = async ({
  url,
  body,
  contentType,
}: {
  url: string;
  body: FormData | Record<string, number | string>;
  contentType: string | undefined;
}) => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`,
  };

  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: !contentType ? (body as BodyInit) : JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }
    return response;
  } catch (e) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error('Failed to post data:', error);
    throw e; // Re-throw the error after logging it
  }
};
