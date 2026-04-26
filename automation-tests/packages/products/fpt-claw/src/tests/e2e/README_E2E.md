# FPT CLAW E2E Test Suite

## Overview
This E2E test suite provides comprehensive end-to-end testing for the FPT CLAW web application (https://stg-claw.fptcloud.net/).

## Test Coverage

### TC-E2E-001: Authentication Flow
- User can login with valid credentials
- User cannot login with invalid credentials

### TC-E2E-002: Dashboard Navigation
- User can navigate to chat interface from dashboard
- User can navigate to Agent page
- User can navigate to Agent Teams page

### TC-E2E-003: Chat Functionality
- User can send a message and receive AI response
- User can select different AI agents
- User can use quick action templates

### TC-E2E-004: Recent Tasks
- User can view recent tasks from sidebar

### TC-E2E-005: User Profile
- User can view profile information

### TC-E2E-006: Workspace Settings
- User can navigate to workspace settings

### TC-E2E-007: Integration Page
- User can navigate to integration page

### TC-E2E-008: Complete User Journey
- Complete user journey from login to task completion

## Prerequisites

- Node.js installed
- Playwright installed
- Valid test credentials (root / d96a449c7d2b28dd0f4c745be31d2940)

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Run all E2E tests
```bash
npx playwright test fptclaw_e2e.spec.ts
```

### Run specific test suite
```bash
# Authentication tests only
npx playwright test fptclaw_e2e.spec.ts --grep "TC-E2E-001"

# Dashboard navigation tests only
npx playwright test fptclaw_e2e.spec.ts --grep "TC-E2E-002"

# Chat functionality tests only
npx playwright test fptclaw_e2e.spec.ts --grep "TC-E2E-003"
```

### Run tests in headed mode (visible browser)
```bash
npx playwright test fptclaw_e2e.spec.ts --headed
```

### Run tests in debug mode
```bash
npx playwright test fptclaw_e2e.spec.ts --debug
```

### Run tests with UI mode
```bash
npx playwright test fptclaw_e2e.spec.ts --ui
```

## Test Data

- **Test URL**: https://stg-claw.fptcloud.net/
- **Valid Username**: root
- **Valid Password**: d96a449c7d2b28dd0f4c745be31d2940

## Test Results

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Features Implemented (Following checklist_automation_testing.md)

### Planning & Design
- ? Clear test objectives defined
- ? Test cases organized by functionality
- ? Test data prepared and documented

### Code Structure
- ? Follows TypeScript/ESLint standards
- ? Modular design with Page Object Model
- ? Reusable page objects (ClawLoginPage, ClawChatPage)
- ? DRY principle applied
- ? Single responsibility for each test
- ? Meaningful naming conventions

### Test Implementation
- ? Clear, descriptive test names
- ? Proper assertions with expected vs actual
- ? Error handling with try-catch blocks
- ? Dynamic waits instead of hard sleeps
- ? Setup and teardown with beforeEach hooks

### Element Locators
- ? Stable locators using getByRole
- ? Avoid brittle selectors
- ? Consistent locator strategy
- ? Wait for elements with timeouts

### Reporting & Logging
- ? Detailed console logs for each step
- ? Step-by-step progress tracking
- ? Pass/Fail indicators

### Performance & Reliability
- ? Appropriate timeouts for AI responses
- ? Resource cleanup
- ? No hard waits where possible

### Error Handling
- ? Graceful failure handling
- ? Descriptive error messages
- ? Validation checkpoints

### Maintainability
- ? Well-commented code
- ? Organized test structure
- ? Clear test descriptions

### Testing Best Practices
- ? Independent tests
- ? Deterministic results
- ? Test isolation
- ? Positive and negative test cases

## Troubleshooting

### Tests failing due to slow AI responses
- Increase timeout values in the test cases
- Check network connectivity
- Verify staging environment is operational

### Element not found errors
- Run tests in headed mode to inspect the page
- Update locators if UI has changed
- Check for dynamic content loading

### Login failures
- Verify credentials are still valid
- Check if staging environment is accessible
- Ensure no CAPTCHA or additional security measures

## Maintenance

Regular maintenance tasks:
- Update test data if credentials change
- Review and update locators after UI changes
- Add new test cases for new features
- Update documentation as needed

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Use descriptive test names (TC-E2E-XXX format)
3. Include proper assertions
4. Add console logging for each step
5. Update this README with new test coverage

## Notes

- Some tests have extended timeouts (3-5 minutes) to accommodate AI response times
- Tests are designed to run on staging environment
- Consider running tests during off-peak hours to avoid performance issues

---

*Last updated: 2026-04-25*
*Author: Automation Team*
