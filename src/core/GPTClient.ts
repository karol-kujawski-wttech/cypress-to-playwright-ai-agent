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
Please convert this Cypress test to Playwright according to the rules:

${cypressTest}

**Rules:**
1. All Cypress-specific commands are converted to Playwright equivalents
2. Maintain the same test coverage and assertions
3. Use Playwright's best practices
4. Return only the converted code without explanations, especially without \`\`\`javascript at the begining and \`\`\` at the end
5. Fixtures section contains the list of available fixtures. You can use them in your test.
6. Base URLs are already configured and you don't need to care about them, so 'cy.visit(path)' you MUST simply convert to 'page.goto(path)'.

**Fixtures:**
export const test = base.extend<TestOptions>({
    pageRTL: async ({ page }, use) => {
        await page.addInitScript(() => {
            const currentUrl = new URL(window.location.href);
            if (!currentUrl.searchParams.has('rtl')) {
                currentUrl.searchParams.append('rtl', 'true');
                window.location.href = currentUrl.toString();
            }
        });
        await use(page);
    },
};
`;
  }
}