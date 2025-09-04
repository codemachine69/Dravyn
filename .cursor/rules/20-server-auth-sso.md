# Server Authentication & SSO Rules

**Pattern:** `packages/server/**`

## Authentication Architecture

### Core Components
- **Identity Manager**: `src/IdentityManager.ts` → User management and permissions
- **Passport Middleware**: `src/enterprise/middleware/passport/` → Auth strategies
- **SSO Providers**: `src/enterprise/sso/` → OIDC/SAML implementations
- **Auth Controllers**: `src/enterprise/controllers/auth/` → Auth endpoints

### Current SSO Providers
- **Auth0**: `src/enterprise/sso/Auth0SSO.ts`
- **Azure AD**: `src/enterprise/sso/AzureSSO.ts` 
- **Google**: `src/enterprise/sso/GoogleSSO.ts`
- **GitHub**: `src/enterprise/sso/GithubSSO.ts`

## Adding New SSO Provider

### Required Steps
1. **Create provider class** extending `SSOBase` in `src/enterprise/sso/`
2. **Implement required methods**:
   - `initialize()` → Set up routes and passport strategy
   - `setSSOConfig()` → Configure passport with credentials
   - `testSetup()` → Validate configuration
3. **Add environment variables** for OAuth credentials
4. **Register in IdentityManager** → Add to SSO provider list
5. **Update API documentation** → Add new endpoints to swagger

### Implementation Pattern
```typescript
class NewProviderSSO extends SSOBase {
    static LOGIN_URI = '/api/v1/newprovider/login'
    static CALLBACK_URI = '/api/v1/newprovider/callback'
    
    initialize() {
        // Set up routes and passport strategy
    }
    
    setSSOConfig(ssoConfig: any) {
        // Configure passport with OAuth settings
    }
    
    static async testSetup(ssoConfig: any) {
        // Validate configuration
    }
}
```

## Security Rules

### Environment Variables
- **Always gate** new SSO behind environment variables
- **Use secure defaults** for missing configuration
- **Never log** sensitive credentials
- **Validate required fields** before initialization

### Route Protection
- **Use middleware** for authentication checks
- **Implement proper error handling** for auth failures
- **Set secure cookies** with appropriate flags
- **Handle session regeneration** properly

### Configuration Validation
```typescript
if (!this.getSSOConfig()) {
    return res.status(400).json({ error: 'SSO is not configured.' })
}
```

## Discovery-First Approach

### Before Making Changes
1. **Search existing patterns** in current SSO implementations
2. **Check passport strategies** in middleware directory
3. **Review error handling** patterns across providers
4. **Examine session management** in IdentityManager

### Minimal Patch Diffs
- **Follow existing patterns** exactly
- **Reuse common utilities** from SSOBase
- **Maintain consistent error responses**
- **Use same route naming conventions**

## API Documentation Updates

### When Adding Routes
- **Update swagger.yml** in `packages/api-documentation/src/yml/`
- **Add endpoint documentation** with examples
- **Include error response codes**
- **Document required environment variables**

### Route Documentation Pattern
```yaml
/api/v1/newprovider/login:
  get:
    summary: Initiate SSO login
    parameters:
      - name: redirect
        in: query
        schema:
          type: string
    responses:
      302:
        description: Redirect to SSO provider
      400:
        description: SSO not configured
```

## Testing Requirements

### SSO Testing
- **Test with invalid credentials** → Should fail gracefully
- **Test with missing configuration** → Should return 400 error
- **Test callback handling** → Should create proper session
- **Test error scenarios** → Should redirect to signin with error

### Environment Testing
- **Test with SSO disabled** → Should not register routes
- **Test with partial config** → Should fail validation
- **Test with valid config** → Should work end-to-end

## Related Files
- `src/enterprise/sso/SSOBase.ts` → Base class for SSO providers
- `src/enterprise/middleware/passport/AuthStrategy.ts` → Passport strategies
- `src/enterprise/controllers/auth/index.ts` → Auth controller endpoints
- `src/IdentityManager.ts` → User and permission management
