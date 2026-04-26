# GitLab Pipeline Trigger Scripts

Collection of scripts to trigger GitLab CI/CD pipelines for E2E tests.

## 📁 Files

- `trigger-gitlab-pipeline.js` - Node.js script
- `trigger-gitlab-pipeline.py` - Python script
- `trigger-gitlab-pipeline.ps1` - PowerShell script
- `gitlab-config.example` - Example configuration file

## 🚀 Quick Start

### 1. Setup Configuration

Copy the example config and fill in your values:

```bash
# Copy example config to .env
cp scripts/gitlab-config.example .env

# Edit .env with your GitLab credentials
nano .env
```

Required variables:
- `GITLAB_PROJECT_ID` - Your project ID or path (e.g., `namespace/project`)
- `GITLAB_PRIVATE_TOKEN` - Personal access token with `api` scope

Optional variables:
- `GITLAB_URL` - GitLab instance URL (default: `https://gitlab.com`)
- `GITLAB_TRIGGER_TOKEN` - Pipeline trigger token (alternative to private token)

### 2. Install Dependencies

**For Node.js:**
```bash
npm install axios dotenv
```

**For Python:**
```bash
pip install python-dotenv requests
```

**For PowerShell:** No additional dependencies needed.

## 💻 Usage

### Node.js

```bash
# Basic usage
node scripts/trigger-gitlab-pipeline.js

# Trigger regression tests on staging
node scripts/trigger-gitlab-pipeline.js --env stg --suite regression

# Trigger API tests on production
node scripts/trigger-gitlab-pipeline.js --env prod --suite api --branch master

# With custom variables
node scripts/trigger-gitlab-pipeline.js --var BASE_URL=https://custom.url

# Dry run
node scripts/trigger-gitlab-pipeline.js --env prod --dry-run

# Help
node scripts/trigger-gitlab-pipeline.js --help
```

### Python

```bash
# Basic usage
python scripts/trigger-gitlab-pipeline.py

# Trigger regression tests on staging
python scripts/trigger-gitlab-pipeline.py --env stg --suite regression

# Trigger API tests on production
python scripts/trigger-gitlab-pipeline.py --env prod --suite api --branch master

# With custom variables
python scripts/trigger-gitlab-pipeline.py --var BASE_URL=https://custom.url

# Wait for pipeline to complete
python scripts/trigger-gitlab-pipeline.py --env prod --wait

# Dry run
python scripts/trigger-gitlab-pipeline.py --env prod --dry-run

# Help
python scripts/trigger-gitlab-pipeline.py --help
```

### PowerShell

```powershell
# Basic usage
.\scripts\trigger-gitlab-pipeline.ps1

# Trigger regression tests on staging
.\scripts\trigger-gitlab-pipeline.ps1 -Env stg -Suite regression

# Trigger API tests on production
.\scripts\trigger-gitlab-pipeline.ps1 -Env prod -Suite api -Branch master

# With custom variables
.\scripts\trigger-gitlab-pipeline.ps1 -Variables @{"BASE_URL"="https://custom.url"}

# Wait for pipeline to complete
.\scripts\trigger-gitlab-pipeline.ps1 -Env prod -Wait

# Dry run
.\scripts\trigger-gitlab-pipeline.ps1 -Env prod -DryRun

# Help
.\scripts\trigger-gitlab-pipeline.ps1 -Help
```

## 🎯 Common Scenarios

### 1. Daily Regression Tests

```bash
# Run regression tests on staging every day at 2 AM
node scripts/trigger-gitlab-pipeline.js --env stg --suite regression
```

### 2. Pre-deployment Tests

```bash
# Run full test suite on production before deployment
node scripts/trigger-gitlab-pipeline.js --env prod --suite regression --wait
```

### 3. API Tests Only

```bash
# Run API tests on both VN and JP environments
node scripts/trigger-gitlab-pipeline.js --env prod --suite api
```

### 4. Smoke Tests

```bash
# Quick smoke tests on staging
node scripts/trigger-gitlab-pipeline.js --env stg --suite smoke
```

## 🔧 Options

| Option | Description | Default |
|--------|-------------|---------|
| `--ref`, `--branch` | Branch to run pipeline on | `master` |
| `--env` | Environment: `stg`, `prod`, `jp` | `stg` |
| `--suite` | Test suite: `smoke`, `regression`, `api` | - |
| `--var` | Custom variable in format `key=value` | - |
| `--trigger-token` | Use trigger token instead of private token | `false` |
| `--wait` | Wait for pipeline to complete | `false` |
| `--dry-run` | Show what would be triggered | `false` |

## 🔐 Authentication

### Using Personal Access Token

1. Go to https://gitlab.com/-/user_settings/personal_access_tokens
2. Create a new token with scopes:
   - `api`
   - `read_repository`
   - `write_repository`
3. Add to `.env`:
   ```
   GITLAB_PRIVATE_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
   ```

### Using Trigger Token

1. Go to Project Settings → CI/CD → Pipeline triggers
2. Create a new trigger token
3. Add to `.env`:
   ```
   GITLAB_TRIGGER_TOKEN=your-trigger-token
   ```

## 📊 Pipeline Jobs

Based on your `.gitlab-ci.yml`, the following jobs are available:

| Job | Stage | Environment | Description |
|-----|-------|-------------|-------------|
| `regression` | regression | STG | Full regression tests |
| `api-inference-vn-jp` | api | PROD (VN+JP) | API inference tests |
| `checkly-deploy` | monitoring | - | Deploy Checkly checks |

## 🔄 Integration with CI/CD

### GitHub Actions

```yaml
name: Trigger GitLab Pipeline
on:
  push:
    branches: [main]

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install axios dotenv
      - name: Trigger Pipeline
        env:
          GITLAB_PROJECT_ID: ${{ secrets.GITLAB_PROJECT_ID }}
          GITLAB_PRIVATE_TOKEN: ${{ secrets.GITLAB_PRIVATE_TOKEN }}
        run: node scripts/trigger-gitlab-pipeline.js --env stg --suite regression
```

### Jenkins

```groovy
pipeline {
    agent any
    stages {
        stage('Trigger GitLab Pipeline') {
            steps {
                sh '''
                    export GITLAB_PROJECT_ID=${GITLAB_PROJECT_ID}
                    export GITLAB_PRIVATE_TOKEN=${GITLAB_PRIVATE_TOKEN}
                    python scripts/trigger-gitlab-pipeline.py --env stg --suite regression
                '''
            }
        }
    }
}
```

## 📝 Troubleshooting

### Error: "GITLAB_PROJECT_ID is required"

Make sure you've set the `GITLAB_PROJECT_ID` variable in your `.env` file.

### Error: "401 Unauthorized"

Check that your `GITLAB_PRIVATE_TOKEN` is valid and has the required scopes.

### Error: "404 Not Found"

Verify that the `GITLAB_PROJECT_ID` is correct and you have access to the project.

### Pipeline not triggering

1. Check that the `.gitlab-ci.yml` file exists in the project root
2. Verify that GitLab runners are available
3. Check pipeline rules in `.gitlab-ci.yml`

## 📚 Additional Resources

- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [GitLab Pipeline Triggers](https://docs.gitlab.com/ee/ci/triggers/)
- [Playwright CI/CD Integration](https://playwright.dev/docs/ci)
- [Full Guide](../docs/GITLAB_CI_CD_TRIGGER_GUIDE.md)

## 🤝 Contributing

Feel free to add more features or improvements to these scripts!

## 📄 License

ISC