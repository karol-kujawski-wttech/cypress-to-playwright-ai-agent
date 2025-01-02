import { FileHandler } from './FileHandler';
import { GPTClient } from './GPTClient';
import { ConversionConfig, ConversionResult } from '../types';
import path from 'path';

export class TestConverter {
  private fileHandler: FileHandler;
  private gptClient: GPTClient;

  constructor() {
    this.fileHandler = new FileHandler();
    this.gptClient = new GPTClient();
  }

  async convertTests(config: ConversionConfig): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    const cypressTests = await this.fileHandler.findCypressTests(config.cypressTestsPath);
    console.log(cypressTests);

    for (const testFile of cypressTests) {
      try {
        const cypressContent = await this.fileHandler.readTestFile(testFile);
        
        const gptResponse = await this.gptClient.convertTest(cypressContent);
        
        if (!gptResponse.success) {
          results.push({
            originalFile: testFile,
            convertedContent: '',
            success: false,
            error: gptResponse.error,
          });
          continue;
        }

        const relativePath = path.relative(config.cypressTestsPath, testFile);
        const playwrightPath = path.join(
          config.playwrightTestsPath,
          relativePath.replace(/\.cy\.ts$/, '.spec.ts')
        );

        await this.fileHandler.writeTestFile(playwrightPath, gptResponse.content);

        results.push({
          originalFile: testFile,
          convertedContent: gptResponse.content,
          success: true,
        });
      } catch (error) {
        results.push({
          originalFile: testFile,
          convertedContent: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }

    return results;
  }
} 