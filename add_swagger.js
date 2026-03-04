const fs = require('fs');
const path = require('path');

function addSwaggerToController(file, tag) {
    let code = fs.readFileSync(file, 'utf-8');

    if (!code.includes('@ApiTags')) {
        code = `import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';\n${code}`;
        code = code.replace(`@Controller(`, `@ApiTags('${tag}')\n@Controller(`);
    }

    fs.writeFileSync(file, code);
}

const map = {
    './src/auth/auth.controller.ts': 'Authentication',
    './src/user/user.controller.ts': 'Users Profile',
    './src/challenges/challenge.controller.ts': 'Challenges',
    './src/ai/ai.controller.ts': 'AI Operations',
    './src/audit-logs/audit-log.controller.ts': 'Audit Logs',
    './src/settings/settings.controller.ts': 'Platform Settings',
    './src/system-health/system-health.controller.ts': 'System Health'
};

for (const [file, tag] of Object.entries(map)) {
    if (fs.existsSync(file)) {
        addSwaggerToController(file, tag);
    }
}
console.log('Done mapping tags');
