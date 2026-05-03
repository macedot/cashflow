---
name: readme-generator
description: Generate or update README.md files following macedot project style (centered title, badges, features, docker quick-start, config tables, architecture, security, CI/CD). Trigger: "generate README", "write README", "update README", "README style".
---

# README Generator

Generate README.md files following the `macedot` project style established in the ports project.

## Template Structure

```
<h1 align="center">Project Name</h1>

<p align="center"><strong>One-line project description</strong></p>

<p align="center">
  <!-- Badges: license, languages, docker, etc -->
  <img src="https://img.shields.io/github/license/{owner}/{repo}?color=blue" alt="License" />
</p>

---

**Project Name** — detailed description paragraph.

## Features

- **Feature name** — description
- Each feature bold name + em dash + description

## Quick Start

docker compose up --build

### Pre-built images

GHCR_OWNER=owner IMAGE_TAG=latest docker compose up

## Configuration

### Environment variables table

| Variable | Default | Description |
|----------|---------|-------------|

## Development

### Prerequisites
### Local development commands
### Testing commands

## Architecture

ASCII diagram showing container layout, volumes, data flow.

**How it works:** numbered flow 1-6.

## Deployment

Table of services with base image and notes.

### Security subsection

## CI/CD

Description of automated build/release process.

## License

Link to LICENSE file.
```

## Rules

1. **Title**: Always `<h1 align="center">` with HTML, not markdown `#`
2. **Badges**: shields.io badges for license, languages, Docker, and any other key tech
3. **Features**: Bold name + em dash + description. One per line. No checkmarks.
4. **Quick Start**: Always show `docker compose up --build` first, then pre-built images
5. **Configuration**: Always use markdown tables for env vars
6. **Architecture**: ASCII box diagram, then numbered "How it works" flow
7. **Security**: Subsection under Deployment covering auth, hardening, non-root, TLS
8. **CI/CD**: Brief description of GitHub Actions workflow
9. **No emojis in headings** (emojis only in feature bullets if they already exist)
10. **Code blocks**: Use triple backticks with language tag

## When to Use

- New project needs a README
- Existing README needs to be restructured to match team style
- Adding Docker deployment instructions to a project
- User asks "write a README" or "generate README"
