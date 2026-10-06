export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${import.meta.env?.BASE_URL || '/'}api${path}`, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Portal-Request': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({
    error: 'El servidor no respondió correctamente. Reintenta sin cerrar esta página.',
  }));
  if (!response.ok)
    throw new APIError(data.error || 'No se pudo completar la operación.', response.status);
  return data as T;
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'No se pudo completar la operación.';
