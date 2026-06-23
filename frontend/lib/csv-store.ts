let csvStore: string | null = null;

export function setCsvStore(csv: string) {
  csvStore = csv;
}

export function getCsvStore(): string | null {
  return csvStore;
}
