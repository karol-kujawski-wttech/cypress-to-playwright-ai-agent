import OpenAI from 'openai';
import { GPTResponse } from '../types';
import { Config, ConfigData } from '../config/config';

export class GPTClient {
  private openai: OpenAI;
  private configData: ConfigData;

  constructor() {
    this.openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
    this.configData = Config.getInstance().getData();
  }

  async convertTest(cypressTest: string): Promise<GPTResponse> {
    try {
      console.log('\n🤖 Sending request to OpenAI...');
      const prompt = this.createConversionPrompt(cypressTest);
      
      const response = await this.openai.chat.completions.create({
        model: this.configData.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert test automation engineer. Convert the following Cypress test to Playwright test while maintaining the same test coverage and assertions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.configData.openai.maxTokens,
      });

      console.log('✅ Received response from OpenAI');
      console.log('📝 Converting test...\n');

      return {
        content: response.choices[0].message.content || '',
        success: true,
      };
    } catch (error) {
      console.error('❌ Error communicating with OpenAI:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private createConversionPrompt(cypressTest: string): string {
    return `
Please convert this Cypress test to Playwright according to the rules:

${cypressTest}

**Rules:**
1. All Cypress-specific commands are converted to Playwright equivalents
2. Maintain the same test coverage and assertions
3. Use Playwright's best practices
4. Return only the converted code without explanations, especially without \`\`\`javascript at the begining and \`\`\` at the end

`;
  }

  async fixTest(testContent: string, errorDetails: { message: string, location: { line: number, column: number } }): Promise<GPTResponse> {
    try {
      console.log('\n🔧 Sending test fix request to OpenAI...');
      const prompt = this.createFixPrompt(testContent, errorDetails);
      
      const response = await this.openai.chat.completions.create({
        model: this.configData.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert test automation engineer. Fix the Playwright test based on the error message and location.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.configData.openai.maxTokens,
      });

      console.log('✅ Received fix suggestion from OpenAI');
      console.log('📝 Applying fix...\n');

      return {
        content: response.choices[0].message.content || '',
        success: true,
      };
    } catch (error) {
      console.error('❌ Error getting fix from OpenAI:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private createFixPrompt(testContent: string, errorDetails: { message: string, location: { line: number, column: number } }): string {
    return `
Please fix this Playwright test that is failing. Here are the details:

**Test Content:**
${testContent}

**Error Message:**
${errorDetails.message}

**Error Location:**
Line: ${errorDetails.line}
Column: ${errorDetails.column}

**Rules:**
1. Return only the fixed test code
2. Keep the test structure and assertions similar
3. Fix only what's necessary to make the test pass
4. Return the complete test file content
5. Do not include any explanations or markdown code blocks
`;
  }
}