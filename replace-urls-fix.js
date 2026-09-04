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

                c = c.split("`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}`").join("`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}`");
                c = c.split("`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}`").join("`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`");
                c = c.replace(/NEXT_PUBLIC_API_URL \|\| \'http:\/\/localhost:3001\'/g, "NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'");

                if (c !== initial) {
                    fs.writeFileSync(dirPath, c);
                    console.log('Cleaned ' + dirPath);
                }
            }
        }
    });
}

walkDir('./frontend');
