export function toPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

export function fromPaisa(paisa: number): number {
  return paisa / 100;
}

export function formatPkr(paisa: number): string {
  return `Rs ${fromPaisa(paisa).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}
