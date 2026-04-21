// Simple SVG to PNG conversion demo using resvg
const fs = require('fs');
const path = require('path');

// Check if @resvg/resvg-js is available
try {
  const { Resvg } = require('@resvg/resvg-js');
  
  const inputDir = './examples';
  const outputDir = './examples/output';
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get all SVG files
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.svg'));
  
  console.log(`Found ${files.length} SVG files to convert\n`);
  
  files.forEach(file => {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace('.svg', '.png'));
    
    try {
      const svgBuffer = fs.readFileSync(inputPath);
      
      // Convert using resvg
      const resvg = new Resvg(svgBuffer, {
        background: 'rgba(0, 0, 0, 0)',
        fitTo: {
          mode: 'width',
          value: 256  // Output 256px width
        }
      });
      
      const pngData = resvg.render();
      fs.writeFileSync(outputPath, pngData.asPng());
      
      console.log(`✓ ${file} → ${path.basename(outputPath)} (${pngData.width}x${pngData.height})`);
    } catch (err) {
      console.error(`✗ ${file}: ${err.message}`);
    }
  });
  
  console.log('\nConversion complete!');
  
} catch (err) {
  console.error('Error: @resvg/resvg-js is not installed.');
  console.error('Please run: npm install @resvg/resvg-js sharp');
  process.exit(1);
}
