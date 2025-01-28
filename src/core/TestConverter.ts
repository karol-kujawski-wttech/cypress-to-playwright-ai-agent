import { FileHandler } from './FileHandler';
import { GPTClient } from './GPTClient';
import { PlaywrightRunner } from './PlaywrightRunner';
import { ConversionConfig, ConversionResult } from '../types';
import path from 'path';
import fs from 'fs/promises';

export class TestConverter {
  private fileHandler: FileHandler;
  private gptClient: GPTClient;
  private playwrightRunner: PlaywrightRunner;

  constructor() {
    this.fileHandler = new FileHandler();
    this.gptClient = new GPTClient();
    this.playwrightRunner = new PlaywrightRunner();
  }

  private async fixFailedTest(testPath: string, results: any): Promise<boolean> {
    try {
      console.log('🔍 Analyzing test failure...');
      
      const testContent = await this.fileHandler.readTestFile(testPath);
      
      const errorDetails = this.extractErrorDetails(results);
      if (!errorDetails) {
        console.error('❌ Could not extract error details from test results');
        return false;
      }

      console.log(`📊 Error found at line ${errorDetails.location.line}, column ${errorDetails.location.column}`);
      console.log('💬 Error message:', errorDetails.message);

      const fixResponse = await this.gptClient.fixTest(testContent, errorDetails);
      
      if (!fixResponse.success) {
        console.error('❌ Failed to get fix suggestion');
        return false;
      }

      console.log('🔧 Applying fix to test...');
      await this.fileHandler.writeTestFile(testPath, fixResponse.content);
      
      console.log('🧪 Verifying fix...');
      const verificationResults = await this.playwrightRunner.runTest(testPath);
      
      const isFixed = this.playwrightRunner.isStable([verificationResults[0]]);
      
      if (isFixed) {
        console.log('✨ Test fixed successfully!');
      } else {
        console.log('⚠️ Fix attempt did not resolve the issue');
      }

      return isFixed;
    } catch (error) {
      console.error('💥 Error during test fixing:', error);
      return false;
    }
  }

  private extractErrorDetails(results: any): { message: string, location: { line: number, column: number } } | null {
    try {
      const firstSuite = results.suites[0];
      const firstSpec = firstSuite.suites[0].specs[0];
      const firstTest = firstSpec.tests[0];
      const firstResult = firstTest.results[0];
      
      if (firstResult.status === 'failed' && firstResult.error) {
        return {
          message: firstResult.error.message,
          location: firstResult.error.location
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting error details:', error);
      return null;
    }
  }

  async convertTests(config: ConversionConfig): Promise<ConversionResult[]> {
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
          console.log('⚠️ Test is unstable, attempting to fix...');
          
          const resultsPath = path.join(config.playwrightTestsPath, '..', 'results.json');
          const resultsContent = await fs.readFile(resultsPath, 'utf-8');
          const testResults = JSON.parse(resultsContent);
          
          const fixed = await this.fixFailedTest(finalPath, testResults);
          
          if (fixed) {
            console.log('✅ Test fixed and stable');
          } else {
            console.log('⚠️ Moving to flaky folder');
            const flakyPath = path.join(
              config.playwrightTestsPath,
              'flaky',
              fileName
            );
            await this.fileHandler.writeTestFile(flakyPath, gptResponse.content);
            await this.fileHandler.deleteFile(finalPath);
          }
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