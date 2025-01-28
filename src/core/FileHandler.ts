import { promises as fs } from 'fs';
import path from 'path';
import { ConversionResult } from '../types';

export class FileHandler {
  async readTestFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  async writeTestFile(filePath: string, content: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  async findCypressTests(directory: string): Promise<string[]> {
    async function scanDirectory(dir: string): Promise<string[]> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const results = await Promise.all(entries.map(async entry => {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          return scanDirectory(fullPath);
        }
        return entry.isFile() && /\.cy\.ts$/.test(entry.name) ? [fullPath] : [];
      }));
      
      return results.flat();
    }

    return scanDirectory(directory);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
        throw new Error(`Failed to delete file ${filePath}: ${error}`);
      }
    }
  }
}