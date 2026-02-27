const fs = require('fs');

const path = 'c:/Users/User/Documents/AI TEACHER/Youva-EdAi/frontend/app/components/workspace/VoiceTutor.tsx';
let data = fs.readFileSync(path, 'utf8');

// The problematic lines:
// Authorization: \`Bearer \${session.accessToken}\`,
// },
// body: JSON.stringify({

// Replace the specific text block
const target = "Authorization: \\`Bearer \\${session.accessToken}\\`,\\n        },\\n        body: JSON.stringify({";
const replacement = "Authorization: `Bearer ${session.accessToken}`,\n        },\n        body: JSON.stringify({";

// It might have spaces before it
data = data.replace(/Authorization: \\`Bearer \\\${session.accessToken}\\`,([^]*?)body: JSON.stringify\({/, "Authorization: `Bearer ${session.accessToken}`,\n        },\n        body: JSON.stringify({");

fs.writeFileSync(path, data, 'utf8');
console.log("Replaced successfully!");
