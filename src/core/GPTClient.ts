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

      return {
        content: response.choices[0].message.content || '',
        success: true,
      };
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private createConversionPrompt(cypressTest: string): string {
    return `
Please convert this Cypress test to Playwright:

${cypressTest}

Please ensure:
1. All Cypress-specific commands are converted to Playwright equivalents
2. Maintain the same test coverage and assertions
3. Use Playwright's best practices
4. Return only the converted code without explanations
`;
  }
}