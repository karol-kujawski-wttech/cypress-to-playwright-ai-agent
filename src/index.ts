import { TestConverter } from './core/TestConverter';
import { Config } from './config/config';

async function main() {
  const config = Config.getInstance().getData();
  const converter = new TestConverter();
  
  const results = await converter.convertTests({
    cypressTestsPath: config.paths.cypressTests,
    playwrightTestsPath: config.paths.playwrightTests,
    openAIApiKey: config.openai.apiKey,
    model: config.openai.model,
  });

  console.log('Conversion Results:', results);
}

main().catch(console.error); 