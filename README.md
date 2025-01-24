# 🎭 Cypress to Playwright Test Converter

An intelligent agent for automatically converting Cypress tests to Playwright tests using AI, with built-in stability checking.

## ✨ Features

- 🤖 Uses OpenAI's GPT to convert tests
- 🧪 Automatic stability checking (runs each test 3 times)
- 📊 Separates stable and flaky tests
- 🔄 Maintains test coverage and assertions
- 🎯 Follows Playwright best practices
- 📝 Detailed conversion logging

## 📁 Project Structure 
.workdir/
├── cypress     / # Source Cypress tests
├── playwright  / # Playwright project
│ ├── tests     / # Converted PW tests
│ │ ├── stable  / # Stable tests
│ │ └── flaky   / # Flaky tests
src             / # Agent implementation    


## 🔄 Conversion Process

1. **Test Discovery**: Scans the Cypress directory for `.cy.ts` files
2. **AI Conversion**: Uses GPT to convert each test to Playwright
3. **Stability Check**: Runs each converted test 3 times
4. **Classification**: 
   - If all runs pass → Stable folder
   - If any run fails → Flaky folder
5. **Fixing flaky tests**: Uses GPT to fix instability or any other error - to be implemented

## 🛠️ Configuration

The converter uses environment variables for configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `CYPRESS_TESTS_PATH` | Path to Cypress tests | `./.workdir/cypress` |
| `PLAYWRIGHT_TESTS_PATH` | Path for converted tests | `./.workdir/playwright/tests/` |
| `PLAYWRIGHT_PROJECT_DIR` | Playwright project directory | `./.workdir/playwright/` 