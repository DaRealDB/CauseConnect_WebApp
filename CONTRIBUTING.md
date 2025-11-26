# Contributing to CauseConnect

Thank you for your interest in contributing to CauseConnect! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Issue Submission](#issue-submission)

## 🤝 Code of Conduct

Be respectful, inclusive, and professional. We are committed to providing a welcoming environment for all contributors.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/CauseConnect.git
   cd CauseConnect
   ```
3. **Set up development environment** (see [README.md](./README.md#getting-started))
4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🔄 Development Workflow

### Branch Naming Conventions

Use descriptive branch names following these patterns:

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/component-name` - Code refactoring
- `docs/update-readme` - Documentation updates
- `style/formatting-changes` - Formatting/style changes
- `test/add-tests` - Adding or updating tests
- `chore/maintenance` - Maintenance tasks

Examples:
- `feature/add-dark-mode`
- `fix/payment-webhook-error`
- `refactor/auth-service`
- `docs/api-documentation`

### Branch Workflow

1. Always branch from `main`
2. Keep branches focused (one feature/fix per branch)
3. Keep branches up to date with `main`
4. Delete branches after merging

### Keeping Your Branch Updated

```bash
# Fetch latest changes
git fetch origin

# Rebase your branch on main
git checkout feature/your-feature
git rebase origin/main
```

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types/interfaces
- Avoid `any` types when possible
- Use meaningful variable and function names

### Code Style

- **Frontend**: Follow Next.js and React best practices
- **Backend**: Follow Express.js and Node.js conventions
- Use ESLint and Prettier (if configured)
- Maintain consistent formatting

### File Organization

- Keep files focused and modular
- Group related functionality
- Use appropriate file naming conventions
- Follow existing project structure

### Frontend Guidelines

- Use functional components with hooks
- Implement proper error handling
- Optimize for performance (memoization, lazy loading)
- Ensure responsive design
- Follow accessibility best practices

### Backend Guidelines

- Follow RESTful API conventions
- Implement proper error handling
- Use middleware for common logic
- Validate input with express-validator
- Document API endpoints

### Database

- Always use Prisma migrations for schema changes
- Never edit migration files after they've been applied
- Test migrations on local database first

## 💬 Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config, etc.)
- `ci`: CI/CD changes

### Scope (Optional)

The scope should be the name of the package/area affected:
- `auth` - Authentication related
- `payments` - Payment processing
- `events` - Event features
- `ui` - UI components
- `api` - API endpoints
- `db` - Database changes

### Examples

```
feat(auth): add email verification flow

Implement email verification with OTP codes sent via SMTP.
Users must verify their email before accessing certain features.

Closes #123

---

fix(payments): handle Stripe webhook signature validation

Fix issue where webhook events were being rejected due to
incorrect signature validation logic.

Fixes #456

---

docs(readme): update installation instructions

Add section for setting up SMTP configuration and clarify
database setup steps.

---

refactor(api): extract payment logic into service layer

Move payment processing logic from controller to dedicated
service for better separation of concerns and testability.
```

### Commit Best Practices

- Write clear, concise commit messages
- Use present tense ("add feature" not "added feature")
- Reference issues/PRs when applicable
- Break down large changes into logical commits
- Each commit should be a complete, working unit

## 🔀 Pull Request Process

### Before Submitting

1. **Ensure your code works**:
   - Test all functionality
   - Run linter (if available)
   - Check for TypeScript errors
   - Test both frontend and backend integration

2. **Update documentation**:
   - Update README if needed
   - Add/update code comments
   - Update API documentation if applicable

3. **Check your changes**:
   ```bash
   # Run linter
   npm run lint
   
   # Check TypeScript
   npm run type-check
   
   # Run tests (if available)
   npm test
   ```

### Creating a Pull Request

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub:
   - Use a descriptive title
   - Reference related issues
   - Provide a clear description of changes
   - Include screenshots for UI changes

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   How has this been tested?
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tests added/updated
   ```

### PR Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Keep the PR focused and avoid unrelated changes
- Update the PR description if scope changes

### After Approval

- Maintainers will merge the PR
- Delete your branch after merging
- Celebrate your contribution! 🎉

## 🐛 Issue Submission

### Before Creating an Issue

1. Check existing issues to avoid duplicates
2. Search closed issues for similar problems
3. Gather relevant information

### Bug Reports

Use the bug report template and include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps to reproduce
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Environment**:
  - OS and version
  - Node.js version
  - Browser (if frontend issue)
- **Additional Context**: Any other relevant information

### Feature Requests

Use the feature request template and include:

- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other solutions considered
- **Additional Context**: Examples, mockups, etc.

## 📚 Resources

- [Project README](./README.md)
- [API Documentation](./backend/README.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)

## ❓ Questions?

If you have questions:

1. Check existing documentation
2. Search existing issues
3. Create a new issue with the "question" label
4. Reach out to maintainers

Thank you for contributing to CauseConnect! 🙏

