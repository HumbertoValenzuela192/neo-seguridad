export const nowLabel = () => new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
export function validRut(value: string) {
  const rut = value.replace(/[.\-\s]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(rut)) return false;
  let sum = 0, m = 2;
  for (const digit of rut.slice(0, -1).split('').reverse()) {
    sum += Number(digit) * m;
    m = m === 7 ? 2 : m + 1;
  }
  const dv = 11 - (sum % 11);
  return rut.at(-1) === (dv === 11 ? '0' : dv === 10 ? 'K' : String(dv));
}
