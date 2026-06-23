const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = {
  getItems: async () => {
    const res = await fetch(`${API_URL}/items`);
    return res.json();
  },
};
