const fs = require('fs');

const content = fs.readFileSync('src/App.jsx', 'utf-8');
const startIdx = content.indexOf('const About = () => {');
const endIdx = content.indexOf('const Team = () => {');

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find start or end index.");
    process.exit(1);
}

const newComponent = fs.readFileSync('about_component.txt', 'utf-8');
const newContent = content.slice(0, startIdx) + newComponent + '\n\n' + content.slice(endIdx);

fs.writeFileSync('src/App.jsx', newContent, 'utf-8');
console.log("Replaced Successfully with node");
