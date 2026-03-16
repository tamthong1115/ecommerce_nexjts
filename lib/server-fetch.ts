export const serverFetch = {
  get: async <T>(url: string): Promise<T> => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    return res.json();
  },
};
