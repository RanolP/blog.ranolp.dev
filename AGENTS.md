# Agent Development Notes

## Dependencies

### Valibot
This project uses [Valibot](https://valibot.dev/) for runtime schema validation.

## Error Handling Patterns

When working with file system operations and external data sources, follow these patterns:

### Error Object Structure
When catching errors from Node.js file system operations, assume the error object may have a `code` property that indicates the type of error. This is a common pattern in Node.js where system errors include an error code.

### Error Checking Pattern
Use instanceof checks for proper error type validation:
```typescript
if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
  // Handle missing file/directory
}
```

## Type Safety Guidelines

### No Type Casting
- Avoid type assertions (`as Type`) in runtime code
- Use property checking to safely access error properties
- Let TypeScript infer types from schemas and interfaces

### Runtime Validation
- Use Valibot schemas for data validation at runtime
- Validate input data before processing
- Validate output data before returning to ensure data integrity

## Schema Validation with Valibot

### Schema Definition Pattern
Define schemas using Valibot's fluent API:
```typescript
import * as v from 'valibot';

export const MyDataSchema = v.object({
  id: v.string(),
  name: v.string(),
  optionalField: v.optional(v.string()),
  status: v.picklist(['active', 'inactive']),
});

export type MyData = v.InferOutput<typeof MyDataSchema>;
```

### Validation Usage
- **Input validation**: Validate data before writing to storage
- **Output validation**: Validate data after reading from external sources
- **Error handling**: Valibot throws `ValiError` with detailed validation failure information

### Validation Behavior
- Invalid data throws `ValiError` with detailed information about validation failures
- All required fields must be present and match their expected types
- Optional fields follow their defined validation rules when present

## File System Operations

### Directory Structure
- Create directories recursively when needed using `{ recursive: true }`
- Handle missing directories gracefully in read operations
- Use descriptive, consistent naming conventions

### JSON File Handling
- Use consistent formatting (2-space indentation, sorted keys)
- Validate JSON content against schemas after parsing
- Handle malformed JSON gracefully with appropriate error messages
