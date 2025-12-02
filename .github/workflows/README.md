# GitHub Actions Workflows

This directory contains CI/CD workflows for automated testing, deployment, and maintenance.

## Workflows

### CI (`ci.yml`)

Runs on every push and pull request to main/develop branches.

**Jobs:**

- **Lint**: ESLint and Prettier checks
- **Type Check**: TypeScript compilation
- **Build**: Next.js build verification
- **Security**: npm audit and Trivy vulnerability scanning

### Deploy (`deploy.yml`)

Deploys to production or staging environments.

**Triggers:**

- Push to main branch (auto-deploy to production)
- Manual workflow dispatch with environment selection

**Jobs:**

- Database migrations
- Application build
- Vercel deployment
- Post-deployment health checks

### Pull Request (`pr.yml`)

Automated checks for pull requests.

**Jobs:**

- **Validate**: PR title format and merge conflict detection
- **Size Check**: Bundle size comparison with base branch
- **Preview Deploy**: Deploy preview environment
- **Label PR**: Auto-label based on changed files

### Dependencies (`dependencies.yml`)

Weekly dependency management and security audits.

**Schedule:** Every Monday at 9 AM UTC

**Jobs:**

- Update npm dependencies
- Security audit with npm audit and Snyk
- License compliance checking

### CodeQL (`codeql.yml`)

Security analysis using GitHub CodeQL.

**Triggers:**

- Push to main/develop
- Pull requests
- Daily scheduled scan at 6 AM UTC

### Stale (`stale.yml`)

Manages stale issues and pull requests.

**Schedule:** Daily at midnight UTC

**Configuration:**

- Issues/PRs marked stale after 60 days of inactivity
- Closed after 7 additional days
- Exempt labels: pinned, security, bug

## Required Secrets

Configure these secrets in repository settings:

### Database

- `DATABASE_URL`: PostgreSQL connection string

### Authentication

- `BETTER_AUTH_SECRET`: Authentication secret key
- `BETTER_AUTH_URL`: Authentication service URL

### Deployment

- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### Application

- `NEXT_PUBLIC_APP_URL`: Public application URL

### Security (Optional)

- `SNYK_TOKEN`: Snyk security scanning token

## Dependabot

Dependabot is configured to automatically create PRs for:

- npm package updates (weekly)
- GitHub Actions updates (weekly)

See `dependabot.yml` for configuration details.

## Auto-labeling

PRs are automatically labeled based on changed files:

- `dependencies`: package.json, lock files
- `database`: Prisma schema and migrations
- `frontend`: App, components, hooks
- `backend`: Server, lib, emails
- `documentation`: Markdown files
- `ci/cd`: GitHub Actions workflows
- `config`: Configuration files
- `styles`: CSS and Tailwind files
- `tests`: Test files

See `labeler.yml` for full configuration.
