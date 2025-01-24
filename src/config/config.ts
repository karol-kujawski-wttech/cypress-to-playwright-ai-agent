export interface ConfigData {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  paths: {
    cypressTests: string;
    playwrightTests: string;
    playwrightProjectDir: string;
  };
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class Config {
  private static instance: Config | null = null;
  private configData: ConfigData | null = null;

  private constructor() {
    this.validateConfig();
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private validateConfig(): void {
    const requiredEnvVars = {
      'CYPRESS_TESTS_PATH': process.env.CYPRESS_TESTS_PATH,
      'PLAYWRIGHT_TESTS_PATH': process.env.PLAYWRIGHT_TESTS_PATH,
      'PLAYWRIGHT_PROJECT_DIR': process.env.PLAYWRIGHT_PROJECT_DIR,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new ConfigurationError(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
      );
    }
  }

  getData(): ConfigData {
    if (!this.configData) {
      this.validateConfig();
      
      this.configData = {
        openai: {
          apiKey: process.env.OPENAI_API_KEY!,
          model: 'gpt-4o-mini',
          maxTokens: 2048,
        },
        paths: {
          cypressTests: process.env.CYPRESS_TESTS_PATH!,
          playwrightTests: process.env.PLAYWRIGHT_TESTS_PATH!,
          playwrightProjectDir: process.env.PLAYWRIGHT_PROJECT_DIR!,
        },
      };
    }
    
    return this.configData;
  }

  get cypressTestsPath(): string {
    return this.getData().paths.cypressTests;
  }

  get playwrightTestsPath(): string {
    return this.getData().paths.playwrightTests;
  }

  get playwrightProjectDir(): string {
    return this.getData().paths.playwrightProjectDir;
  }
} 