---
name: "using-superpowers"
description: "Establishes how to find and use skills. Invoke at the start of any conversation or when user asks about skills, how to use skills, or skill discovery."
---

# Using Superpowers

Establishes how to find and use skills in this workspace.

## What Are Skills

Skills are specialized instructions that help me perform tasks more effectively. They provide:
- **Best practices** for specific domains
- **Workflow guidance** for complex tasks
- **Context-aware implementation** patterns

## How to Access Skills

In this environment (Trae IDE with Claude), use the `Skill` tool to load a skill.

## Available Skills in This Project

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `frontend-design` | Production-grade frontend interfaces | Creating UI components, pages, dashboards |
| `ui-ux-design` | UI/UX design guidance | User flows, wireframes, usability analysis |
| `using-superpowers` | Skill discovery and usage | Understanding how skills work |

## Skill Priority Rules

1. **User instructions always have highest priority**
2. **Process skills first** (brainstorming, debugging) - determine how to approach tasks
3. **Implementation skills second** (frontend-design, mcp-builder) - guide execution

## When to Use Skills

**ALWAYS invoke a skill when:**
- Starting any new task (even simple ones)
- There's even 1% chance a skill might apply
- User asks about skills or how to do something
- Before writing any code or making changes

**Red flags - STOP and check skills:**
- "This is just a simple question" → Check skills anyway
- "I need to explore first" → Skills tell you how to explore
- "I remember this skill" → Skills get updated, read current version
- "This doesn't need a formal skill" → If it exists, use it

## Chinese-Specific Skills

When working with Chinese teams or projects:
- `chinese-code-review` - Code review adapted for Chinese team culture
- `chinese-git-workflow` - Git workflow for Gitee/Coding/极狐 GitLab
- `chinese-documentation` - Chinese technical documentation standards
- `chinese-commit-conventions` - Commit message conventions for Chinese projects

## Usage Examples

```
User: "Create a login page"
→ Invoke: brainstorming skill first
→ Then: frontend-design skill

User: "Fix this bug"
→ Invoke: systematic-debugging skill

User: "Review my code"
→ Invoke: requesting-code-review skill
```

## Adding New Skills

To add a skill to this project:
1. Create directory: `.trae/skills/<skill-name>/`
2. Create file: `SKILL.md` with frontmatter and content
3. Frontmatter format:
   ```yaml
   ---
   name: "skill-name"
   description: "What it does. Invoke when X happens."
   ---
   ```

## Skill Discovery

To see all available skills:
1. Check `.trae/skills/` directory
2. Read each skill's `SKILL.md` for details
3. Use `Skill` tool to load and follow the skill
