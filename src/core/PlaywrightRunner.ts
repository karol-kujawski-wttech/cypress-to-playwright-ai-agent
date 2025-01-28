import { exec } from 'child_process';
import { promisify } from 'util';
import { Config } from '../config/config';

const execAsync = promisify(exec);

export interface TestRunResult {
  success: boolean;
  error?: string;
}

export class PlaywrightRunner {
  private readonly numberOfRuns: number = 3;
  private readonly config: Config;

  constructor() {
    this.config = Config.getInstance();
  }

  async runTest(testPath: string): Promise<TestRunResult[]> {
    const results: TestRunResult[] = [];

    for (let i = 0; i < this.numberOfRuns; i++) {
      try {
        console.log(`\n🎭 Running test attempt ${i + 1}/${this.numberOfRuns}: ${testPath}`);
        
        const { stdout, stderr } = await execAsync(
          'npm run test', 
          { 
            cwd: this.config.playwrightProjectDir,
            env: {
              ...process.env,
              PW_TEST_HTML_REPORT_OPEN: 'never'
            }
          }
        );
        
        console.log('📋 Test execution output:', stdout);
        
        const testsPassedPattern = /\d+ passed/;
        const testsFailedPattern = /\d+ failed/;
        
        const passed = testsPassedPattern.test(stdout) && !testsFailedPattern.test(stdout);
        
        if (!passed) {
          console.error('❌ Test execution failed');
          results.push({
            success: false,
            error: stderr || 'Tests failed without error message'
          });
        } else {
          console.log('✅ Test passed');
          results.push({
            success: true
          });
        }
      } catch (error) {
        console.error('💥 Test execution error:', error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }

    return results;
  }

  private isExpectedError(stderr: string): boolean {
    // Some npm outputs go to stderr but aren't actual errors
    const expectedPatterns = [
      /npm WARN/i,
      /npm notice/i,
    ];
    
    return expectedPatterns.some(pattern => pattern.test(stderr));
  }

  isStable(results: TestRunResult[]): boolean {
    return results.every(result => result.success);
  }
} 