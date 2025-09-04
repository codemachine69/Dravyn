# Universal Diff Discipline

## Output Format Requirements

### Always Use Unified Diffs
- **Format**: `@@ -start,count +start,count @@`
- **Context lines**: Include 3 lines before and after changes
- **File headers**: Show complete file paths
- **Line numbers**: Include line numbers for all changes

### Diff Structure
```
--- a/path/to/file.ts
+++ b/path/to/file.ts
@@ -10,7 +10,7 @@ existing code
 context line 1
 context line 2
 context line 3
-old code
+new code
 context line 4
 context line 5
 context line 6
```

## Allowed File Patterns

### Server Package
- `packages/server/src/**/*.ts` → Backend code
- `packages/server/src/**/*.js` → JavaScript files
- `packages/server/package.json` → Dependencies
- `packages/server/tsconfig.json` → TypeScript config

### UI Package  
- `packages/ui/src/**/*.jsx` → React components
- `packages/ui/src/**/*.js` → JavaScript files
- `packages/ui/src/**/*.css` → Stylesheets
- `packages/ui/src/**/*.scss` → SCSS files
- `packages/ui/package.json` → Dependencies

### Components Package
- `packages/components/src/**/*.ts` → Node implementations
- `packages/components/src/**/*.js` → JavaScript files
- `packages/components/package.json` → Dependencies

### API Documentation Package
- `packages/api-documentation/src/**/*.ts` → Documentation code
- `packages/api-documentation/src/**/*.yml` → YAML definitions
- `packages/api-documentation/package.json` → Dependencies

### Root Configuration
- `package.json` → Root dependencies
- `pnpm-workspace.yaml` → Workspace config
- `turbo.json` → Build configuration
- `.eslintrc.js` → Linting rules

## Prohibited File Patterns

### Never Modify
- `packages/**/node_modules/**` → Dependencies
- `packages/**/dist/**` → Build outputs
- `packages/**/build/**` → Build outputs
- `packages/**/.next/**` → Next.js cache
- `packages/**/coverage/**` → Test coverage
- `packages/**/cypress/videos/**` → Test recordings
- `packages/**/cypress/screenshots/**` → Test screenshots

### Avoid Modifying
- `packages/**/package-lock.json` → Use pnpm-lock.yaml
- `packages/**/yarn.lock` → Use pnpm-lock.yaml
- `packages/**/pnpm-lock.yaml` → Only when adding dependencies
- `packages/**/README.md` → Only for significant changes
- `packages/**/LICENSE.md` → Never modify

## Change Validation

### Before Outputting Diffs
1. **Verify file exists** in the repository
2. **Check file is in allowed pattern** list
3. **Ensure changes are minimal** and focused
4. **Validate syntax** for the file type
5. **Confirm no sensitive data** is included

### Diff Quality Checks
- [ ] Unified diff format used
- [ ] File paths are correct and complete
- [ ] Line numbers are accurate
- [ ] Context lines provide sufficient context
- [ ] Changes are minimal and focused
- [ ] No unnecessary whitespace changes
- [ ] No sensitive data exposed

## Error Handling

### Invalid File Patterns
If a file doesn't match allowed patterns:
- **Reject the change** with explanation
- **Suggest correct file location** if applicable
- **Provide guidance** on proper package structure

### Syntax Errors
If changes introduce syntax errors:
- **Fix the syntax** before outputting diff
- **Validate with appropriate linter** (ESLint, TypeScript)
- **Test compilation** if applicable

### Large Changes
If changes are too large:
- **Break into smaller chunks** with focused changes
- **Explain the reasoning** for each change
- **Provide context** for why changes are necessary

## Best Practices

### Minimal Changes
- **Only change what's necessary** to implement the feature
- **Preserve existing formatting** and style
- **Maintain consistent indentation** and spacing
- **Avoid reformatting** unrelated code

### Clear Context
- **Include enough context** to understand the change
- **Show the complete function** or block being modified
- **Highlight the specific change** within the context

### Descriptive Diffs
- **Use meaningful variable names** in changes
- **Add comments** when logic is complex
- **Include error handling** where appropriate
- **Follow existing code patterns** in the file
