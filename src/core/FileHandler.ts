import { promises as fs } from 'fs';
import path from 'path';

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
    const files: string[] = [];
    
    async function scan(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && /\.cy\.ts$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }

    await scan(directory);
    return files;
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

  async setupPlaywrightProject(): Promise<void> {
    try {
      console.log('🔧 Setting up Playwright project structure...');
      const workdir = './.workdir';
      const playwrightConfigContent = `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});`;

      const testFixtureContent = `
import { test as base } from '@playwright/test';

interface TestFixtures {
  // Add your fixture types here
}

export const test = base.extend<TestFixtures>({
  // Add your fixtures here
});

export { expect } from '@playwright/test';`;

      const packageJsonContent = `{
  "name": "playwright-tests",
  "version": "1.0.0",
  "description": "Playwright tests converted from Cypress",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report"
  },
  "dependencies": {
    "@playwright/test": "^1.42.1"
  }
}`;

      // Create directory structure
      await fs.mkdir(path.join(workdir, 'tests', 'fixtures'), { recursive: true });

      // Write configuration files
      await fs.writeFile(
        path.join(workdir, 'playwright.config.ts'),
        playwrightConfigContent,
        'utf-8'
      );
      await fs.writeFile(
        path.join(workdir, 'tests', 'fixtures', 'test.ts'),
        testFixtureContent,
        'utf-8'
      );
      await fs.writeFile(
        path.join(workdir, 'package.json'),
        packageJsonContent,
        'utf-8'
      );
      console.log('✅ Playwright project setup complete');
    } catch (error) {
      console.error('❌ Failed to setup Playwright project:', error);
      throw new Error(`Failed to setup Playwright project: ${error}`);
    }
  }
}