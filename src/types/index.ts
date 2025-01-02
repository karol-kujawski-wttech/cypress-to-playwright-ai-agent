export interface ConversionConfig {
  cypressTestsPath: string;
  playwrightTestsPath: string;
  openAIApiKey: string;
  model: string;
}

export interface ConversionResult {
  originalFile: string;
  convertedContent: string;
  success: boolean;
  error?: string;
}

export interface GPTResponse {
  content: string;
  success: boolean;
  error?: string;
} 