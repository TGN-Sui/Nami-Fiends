export function decodeMoveBytes(value: unknown): string {
  if (typeof value === 'string') {
    if (value.trim() === '') {
      return '';
    }

    if (/^[\x20-\x7e]+$/.test(value)) {
      return value;
    }

    try {
      const decoded = Buffer.from(value, 'base64').toString('utf8');

      if (decoded.trim()) {
        return decoded;
      }
    } catch {
      return value;
    }

    return value;
  }

  if (Array.isArray(value)) {
    try {
      return new TextDecoder().decode(
        new Uint8Array(value.filter((entry): entry is number => typeof entry === 'number'))
      );
    } catch {
      return '';
    }
  }

  const record = value as { bytes?: unknown } | null;

  if (record && Array.isArray(record.bytes)) {
    return decodeMoveBytes(record.bytes);
  }

  return '';
}