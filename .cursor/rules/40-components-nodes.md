# Components & Nodes Rules

**Pattern:** `packages/components/**`

## Node Architecture

### Core Interfaces
- **INode**: `src/Interface.ts` → Base node interface
- **INodeData**: `src/Interface.ts` → Runtime node data
- **INodeProperties**: `src/Interface.ts` → Node metadata and configuration

### Node Categories
- **LLMs**: `src/nodes/llms/` → Language model providers
- **Chat Models**: `src/nodes/chatmodels/` → Chat-specific models
- **Embeddings**: `src/nodes/embeddings/` → Text embedding providers
- **Vector Stores**: `src/nodes/vectorstores/` → Vector database integrations
- **Tools**: `src/nodes/tools/` → External tool integrations
- **Chains**: `src/nodes/chains/` → Workflow chain components
- **Agents**: `src/nodes/agents/` → AI agent implementations

## Node Implementation Rules

### Required Properties
```typescript
class MyNode implements INode {
    label: string
    name: string
    type: string
    icon: string
    version: number
    category: string
    baseClasses: string[]
    description?: string
    credential?: INodeParams
    inputs?: INodeParams[]
    output?: INodeOutputsValue[]
}
```

### Implementation Pattern
```typescript
class MyNode implements INode {
    constructor() {
        this.label = 'My Node'
        this.name = 'myNode'
        this.type = 'MyNode'
        this.icon = 'myicon.svg'
        this.version = 1.0
        this.category = 'Tools'
        this.baseClasses = ['MyNode']
        this.description = 'Description of what this node does'
    }

    async init(nodeData: INodeData, input: string, options?: ICommonObject): Promise<any> {
        // Initialization logic
    }

    async run(nodeData: INodeData, input: string, options?: ICommonObject): Promise<string | ICommonObject> {
        // Main execution logic
    }
}
```

## Node Development Constraints

### Package Boundaries
- **Only modify** files within `packages/components/`
- **Do not touch** server or UI code when working on nodes
- **Maintain interfaces** defined in `src/Interface.ts`
- **Follow existing patterns** in similar node implementations

### File Organization
- **One node per file** → `src/nodes/category/NodeName.ts`
- **Icons in same directory** → `src/nodes/category/icon.svg`
- **Credentials separate** → `src/credentials/CredentialName.ts`

### Icon Requirements
- **SVG format preferred** for scalability
- **Consistent sizing** (typically 24x24 or 32x32)
- **Clear visual representation** of node function
- **Place in same directory** as node implementation

## Credential Management

### Credential Structure
```typescript
interface INodeParams {
    label: string
    name: string
    type: string
    default?: string
    optional?: boolean
    description?: string
    options?: Array<{ label: string; name: string }>
}
```

### Credential Rules
- **Separate credentials** from node logic
- **Use environment variables** for sensitive data
- **Validate credentials** before use
- **Provide clear error messages** for invalid credentials

## Node Categories

### LLM Nodes (`src/nodes/llms/`)
- **Implement init()** for model initialization
- **Implement run()** for text generation
- **Handle streaming** if supported
- **Include model parameters** (temperature, max tokens, etc.)

### Tool Nodes (`src/nodes/tools/`)
- **Implement run()** for tool execution
- **Handle input validation** and sanitization
- **Return structured output** when possible
- **Include error handling** for external API failures

### Vector Store Nodes (`src/nodes/vectorstores/`)
- **Implement vectorStoreMethods**:
  - `upsert()` → Add documents to vector store
  - `search()` → Search similar documents
  - `delete()` → Remove documents by IDs
- **Handle batch operations** efficiently
- **Support metadata filtering**

## Testing Requirements

### Node Testing
- **Test with valid inputs** → Should produce expected output
- **Test with invalid inputs** → Should handle gracefully
- **Test credential validation** → Should fail with clear errors
- **Test error scenarios** → Should not crash the application

### Integration Testing
- **Test in workflow context** → Should work with other nodes
- **Test data flow** → Input/output should be compatible
- **Test performance** → Should not cause timeouts

## Documentation Standards

### Node Documentation
- **Clear description** of node purpose
- **Input/output specifications** with examples
- **Required credentials** and configuration
- **Usage examples** and common patterns

### Code Comments
- **Document complex logic** with inline comments
- **Explain external API interactions**
- **Note any limitations** or known issues
- **Include TODO comments** for future improvements

## Related Files
- `src/Interface.ts` → Core interfaces and types
- `src/credentials/` → Credential management
- `src/nodes/` → Node implementations by category
- `src/validator.ts` → Input validation utilities
