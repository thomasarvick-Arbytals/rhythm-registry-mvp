import fs from 'node:fs/promises';
import path from 'node:path';

export type StoredFile = {
  relativePath: string; // stored in DB
  absolutePath: string; // for server use
};

export interface StorageDriver {
  save(opts: { relativePath: string; buffer: Buffer }): Promise<StoredFile>;
  getAbsolutePath(relativePath: string): string;
}

export class LocalStorageDriver implements StorageDriver {
  constructor(private baseDir: string) {}

  getAbsolutePath(relativePath: string) {
    return path.join(this.baseDir, relativePath);
  }

  async save(opts: { relativePath: string; buffer: Buffer }) {
    const abs = this.getAbsolutePath(opts.relativePath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, opts.buffer);
    return { relativePath: opts.relativePath, absolutePath: abs };
  }
}

export function getStorage(): StorageDriver {
  // MVP: local storage. Swap to S3 later behind this interface.
  const uploadsDir = process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');
  return new LocalStorageDriver(uploadsDir);
}
