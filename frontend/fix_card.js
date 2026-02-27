const fs = require('fs');

const path = 'c:/Users/User/Documents/AI TEACHER/Youva-EdAi/frontend/app/components/workspace/VoiceTutor.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(/<\/Card>/g, "</div>");

fs.writeFileSync(path, data, 'utf8');
console.log("Replaced Card closing tag successfully!");
