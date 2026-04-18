const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const lines = content.split('\n');
      const newLines = lines.map(line => {
        // Skip lines that have specific colored backgrounds
        if (
          line.includes('bg-pk-accent') || 
          line.includes('bg-[#25D366]') || 
          line.includes('bg-[#128C7E]') || 
          line.includes('bg-pk-error') || 
          line.includes('bg-pk-success') ||
          line.includes('bg-blue-600') ||
          line.includes('bg-red-')
        ) {
          return line;
        }
        
        return line.replace(/text-white/g, 'text-pk-text-main');
      });
      
      fs.writeFileSync(fullPath, newLines.join('\n'));
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Fixed text-white to text-pk-text-main');
