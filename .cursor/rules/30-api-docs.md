# API Documentation Rules

**Pattern:** `packages/api-documentation/**`

## Documentation Structure

### Core Files
- **Swagger Config**: `src/configs/swagger.config.ts` → OpenAPI configuration
- **API Definitions**: `src/yml/swagger.yml` → Endpoint documentation
- **Server Entry**: `src/index.ts` → Documentation server setup

### Documentation Server
- **Port**: 6655 (configurable)
- **URL**: `http://localhost:6655/api-docs`
- **Auto-discovery**: Scans `packages/server/src/routes/**/*.js` for JSDoc comments

## Keeping Docs Updated

### When Adding New Routes
1. **Add JSDoc comments** to route handlers in `packages/server/src/routes/`
2. **Update swagger.yml** with comprehensive endpoint documentation
3. **Include request/response schemas** with examples
4. **Document error responses** and status codes
5. **Add authentication requirements** if applicable

### JSDoc Comment Pattern
```javascript
/**
 * @swagger
 * /api/v1/endpoint:
 *   post:
 *     summary: Brief description
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field: { type: string, example: "value" }
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 */
```

### Swagger.yml Updates
```yaml
/api/v1/endpoint:
  post:
    summary: Brief description
    tags: [Category]
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/RequestModel'
    responses:
      200:
        description: Success
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ResponseModel'
```

## Documentation Standards

### Required Information
- **Summary** → Brief endpoint description
- **Tags** → Logical grouping (auth, chatflows, etc.)
- **Parameters** → Query, path, and header parameters
- **Request Body** → Schema with examples
- **Responses** → All possible response codes
- **Security** → Authentication requirements

### Schema Definitions
- **Define reusable schemas** in `components/schemas`
- **Use consistent naming** conventions
- **Include examples** for complex objects
- **Document required vs optional** fields

### Error Documentation
- **Document all error codes** (400, 401, 403, 404, 500)
- **Include error message formats**
- **Provide troubleshooting guidance**
- **Link to relevant documentation**

## Development Workflow

### Local Development
```bash
# Start Flowise server
cd packages/server
pnpm dev

# Start API docs server (separate terminal)
cd packages/api-documentation
pnpm start
```

### Documentation Updates
1. **Make code changes** in `packages/server/`
2. **Add/update JSDoc comments** in route files
3. **Update swagger.yml** for complex endpoints
4. **Test documentation** at `http://localhost:6655/api-docs`
5. **Verify examples work** with actual API calls

## Quality Checks

### Before Committing
- [ ] All new endpoints documented
- [ ] JSDoc comments follow standard format
- [ ] Swagger.yml schemas are complete
- [ ] Examples are accurate and testable
- [ ] Error responses documented
- [ ] Authentication requirements specified

### Documentation Testing
- [ ] Swagger UI loads without errors
- [ ] All endpoints appear in documentation
- [ ] Try-it-out functionality works
- [ ] Examples can be executed successfully
- [ ] Response schemas match actual responses

## File Organization

### Route Documentation
- **JSDoc in route files** → `packages/server/src/routes/*.ts`
- **Complex schemas** → `packages/api-documentation/src/yml/swagger.yml`
- **Shared components** → Define in swagger.yml components section

### Schema Reuse
```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id: { type: string }
        email: { type: string }
        name: { type: string }
    ErrorResponse:
      type: object
      properties:
        error: { type: string }
        message: { type: string }
```

## Related Files
- `packages/server/src/routes/` → Route implementations with JSDoc
- `packages/api-documentation/src/yml/swagger.yml` → API definitions
- `packages/api-documentation/src/configs/swagger.config.ts` → Configuration
