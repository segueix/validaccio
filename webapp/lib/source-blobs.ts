// Funció 102 — Emmagatzematge local de fitxers.
// El contingut de cada font es desa com a ArrayBuffer a IndexedDB (mai incrustat
// al codi ni al bundle), enllaçat a la fitxa de la font per `sourceId`. Així es
// conserva offline i es pot recuperar o eliminar de manera controlada.

export type SourceBlobRecord = {
  sourceId: string;
  projectId: string;
  mime: string;
  size: number;
  data: ArrayBuffer;
};

export function createSourceBlobRecord(input: {
  sourceId: string;
  projectId: string;
  mime: string;
  data: ArrayBuffer;
}): SourceBlobRecord {
  if (typeof input.sourceId !== "string" || input.sourceId.trim() === "") {
    throw new TypeError("El contingut necessita una font associada");
  }
  if (typeof input.projectId !== "string" || input.projectId.trim() === "") {
    throw new TypeError("El contingut necessita un projecte associat");
  }
  return {
    sourceId: input.sourceId.trim(),
    projectId: input.projectId.trim(),
    mime: input.mime,
    size: input.data.byteLength,
    data: input.data,
  };
}

export function totalBlobSize(records: readonly { size: number }[]): number {
  return records.reduce(
    (sum, record) => sum + (Number.isFinite(record.size) ? record.size : 0),
    0,
  );
}

// Reconstrueix un Blob i en retorna una URL temporal per obrir o baixar la font.
// Només s'executa al navegador; qui la crida ha d'alliberar-la amb
// URL.revokeObjectURL quan ja no la necessiti.
export function sourceBlobToObjectUrl(record: SourceBlobRecord): string {
  const blob = new Blob([record.data], {
    type: record.mime || "application/octet-stream",
  });
  return URL.createObjectURL(blob);
}
