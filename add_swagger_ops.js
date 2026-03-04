const fs = require('fs');

const generateMarkdownDocs = (methodName, verb, route) => {
    // Determine required permissions based on context mostly
    const isAdmin = route.includes('admin') || route.includes('users') || route.includes('roles');
    return `    @ApiOperation({
        summary: '${methodName} operation',
        description: \`
### Required Permissions
- \${isAdmin ? 'Admin/Organizer' : 'Public or authenticated User'}

### Example Request
\\\`\\\`\\\`http
\${verb.toUpperCase()} /api/\${route} HTTP/1.1
Content-Type: application/json
\\\`\\\`\\\`

### Example Response
\\\`\\\`\\\`json
{
  "success": true,
  "data": { "id": "example-123" }
}
\\\`\\\`\\\`

### Test Cases (Working Examples)
- **Valid Test Case**: Call \\\`\${verb.toUpperCase()} /api/\${route}\\\` with valid data -> Returns \\\`200 OK\\\` or \\\`201 Created\\\`.
- **Invalid Test Case**: Call with malformed data or missing fields -> Returns \\\`400 Bad Request\\\`.
- **Authentication Test Case**: Call without token (if protected) -> Returns \\\`401 Unauthorized\\\`.
        \`
    })
    @ApiResponse({ status: 200, description: 'Successful operation' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid parameters/body' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })`;
};

function injectDetailedSwagger(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf-8');

    // Don't re-inject if already there
    if (code.includes('@ApiOperation')) return;

    // We will do a regex replace to insert the text above @Get, @Post, etc.
    // Ensure we handle multiline safely by replacing the decorator directly

    // Regex matching @Post('...') or @Get()
    const regex = /@((?:Get|Post|Patch|Delete|Put))\s*\(\s*(['"][^'"]*['"])?\s*\)/g;

    let injectedMatch = 0;

    const newCode = code.replace(regex, (match, p1, p2) => {
        injectedMatch++;
        const verb = p1;
        const route = p2 ? p2.replace(/['"]/g, '') : '';
        const methodName = verb + '_' + route.replace(/\W+/g, '_') + '_' + injectedMatch;
        const swaggerBlock = generateMarkdownDocs(methodName, verb, route);
        return swaggerBlock + '\n    ' + match;
    });

    fs.writeFileSync(file, newCode);
    console.log('Injected ' + injectedMatch + ' routes in ' + file);
}

const filesToInject = [
    './src/auth/auth.controller.ts',
    './src/user/user.controller.ts',
    './src/challenges/challenge.controller.ts',
    './src/ai/ai.controller.ts',
    './src/audit-logs/audit-log.controller.ts',
    './src/settings/settings.controller.ts'
];

for (const file of filesToInject) {
    injectDetailedSwagger(file);
}
