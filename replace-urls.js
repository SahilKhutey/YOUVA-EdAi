const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            if (f !== '.next' && f !== 'node_modules') walkDir(dirPath);
        } else {
            if (f.endsWith('.ts') || f.endsWith('.tsx')) {
                let c = fs.readFileSync(dirPath, 'utf8');
                let initial = c;

                // 1. Replace /api URLs
                c = c.replace(/['"`]http:\/\/localhost:3001\/api([^'"`]*)['"`]/g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:3001/api\'}$1`');

                // 2. Replace remaining base URLs
                c = c.replace(/['"`]http:\/\/localhost:3001([^'"`]*)['"`]/g, '`${process.env.NEXT_PUBLIC_SOCKET_URL || \'http://localhost:3001\'}$1`');

                if (c !== initial) {
                    fs.writeFileSync(dirPath, c);
                    console.log('Updated ' + dirPath);
                }
            }
        }
    });
}

walkDir('./frontend');
