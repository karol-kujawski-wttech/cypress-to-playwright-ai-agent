import { FileHandler } from './FileHandler';
import { GPTClient } from './GPTClient';
import { PlaywrightRunner } from './PlaywrightRunner';
import { ConversionConfig, ConversionResult } from '../types';
import path from 'path';

export class TestConverter {
  private fileHandler: FileHandler;
  private gptClient: GPTClient;
  private playwrightRunner: PlaywrightRunner;

  constructor() {
    this.fileHandler = new FileHandler();
    this.gptClient = new GPTClient();
    this.playwrightRunner = new PlaywrightRunner();
  }

  async convertTests(config: ConversionConfig): Promise<ConversionResult[]> {
    // Initialize Playwright project structure
    await this.fileHandler.setupPlaywrightProject();

    const results: ConversionResult[] = [];
    const cypressTests = await this.fileHandler.findCypressTests(config.cypressTestsPath);
    console.log('🔍 Found Cypress tests:', cypressTests);

    for (const testFile of cypressTests) {
      try {
        console.log(`\n📂 Processing test file: ${testFile}`);
        const cypressContent = await this.fileHandler.readTestFile(testFile);
        
        const gptResponse = await this.gptClient.convertTest(cypressContent);
        
        if (!gptResponse.success) {
          console.error('❌ Conversion failed:', gptResponse.error);
          results.push({
            originalFile: testFile,
            convertedContent: '',
            success: false,
            error: gptResponse.error,
          });
          continue;
        }

        const relativePath = path.relative(config.cypressTestsPath, testFile);
        const fileName = path.basename(relativePath).replace(/\.cy\.ts$/, '.spec.ts');
        
        const finalPath = path.join(
          config.playwrightTestsPath,
          fileName
        );

        console.log('💾 Saving converted test to:', finalPath);
        await this.fileHandler.writeTestFile(finalPath, gptResponse.content);

        console.log(`\n🧪 Running stability check for ${fileName}`);
        const runResults = await this.playwrightRunner.runTest(finalPath);
        
        const isStable = this.playwrightRunner.isStable(runResults);
        if (!isStable) {
          console.log('⚠️ Test is flaky, moving to flaky folder');
          const flakyPath = path.join(
            config.playwrightTestsPath,
            'flaky',
            fileName
          );
          await this.fileHandler.writeTestFile(flakyPath, gptResponse.content);
          await this.fileHandler.deleteFile(finalPath);
        } else {
          console.log('✨ Test is stable');
        }

        results.push({
          originalFile: testFile,
          convertedContent: gptResponse.content,
          success: true,
          isStable,
          runResults
        });
      } catch (error) {
        console.error('💥 Error processing test:', error);
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