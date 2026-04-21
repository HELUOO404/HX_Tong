/**
 * Batch conversion processor
 */

const fs = require('fs').promises;
const path = require('path');
const { convertSvgToPng } = require('./converter');
const { mergeConfig } = require('./config');
const { ensureDir, formatBytes } = require('./utils');

/**
 * Batch convert SVGs from directory
 * @param {string} inputDir - Input directory path
 * @param {string} outputDir - Output directory path
 * @param {Object} userConfig - User configuration
 * @returns {Promise<Array>} Array of all conversion results
 */
async function batchConvert(inputDir, outputDir, userConfig = {}) {
  const config = mergeConfig({
    ...userConfig,
    output: { ...userConfig.output, path: outputDir }
  });

  // Get all SVG files
  const files = await fs.readdir(inputDir);
  const svgFiles = files.filter(f => f.toLowerCase().endsWith('.svg'));

  if (svgFiles.length === 0) {
    console.log('No SVG files found in input directory');
    return [];
  }

  console.log(`Found ${svgFiles.length} SVG file(s) to convert\n`);

  await ensureDir(outputDir);

  const allResults = [];
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const file of svgFiles) {
    const inputPath = path.join(inputDir, file);
    
    try {
      const results = await convertSvgToPng(inputPath, config);
      allResults.push(...results);

      const successful = results.filter(r => r.success);
      const skipped = results.filter(r => r.skipped);
      
      successCount += successful.length;
      skipCount += skipped.length;
      failCount += results.length - successful.length - skipped.length;

      if (successful.length > 0) {
        const sizes = successful.map(r => `${r.dimensions.width}x${r.dimensions.height}`).join(', ');
        console.log(`✓ ${file} → ${successful.length} file(s) (${sizes})`);
      }
      if (skipped.length > 0) {
        console.log(`⊘ ${file} → skipped (${skipped.length} file(s) exist)`);
      }
    } catch (error) {
      console.error(`✗ ${file} → ${error.message}`);
      failCount++;
    }
  }

  // Summary
  console.log(`\n${'='.repeat(40)}`);
  console.log('Conversion Summary:');
  console.log(`  Success: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Failed:  ${failCount}`);
  console.log(`${'='.repeat(40)}`);

  return allResults;
}

/**
 * Batch convert with explicit file list
 * @param {Array} files - Array of file paths or objects {path, config}
 * @param {string} outputDir - Output directory path
 * @param {Object} userConfig - User configuration
 * @returns {Promise<Array>} Array of conversion results
 */
async function batchConvertFiles(files, outputDir, userConfig = {}) {
  const config = mergeConfig({
    ...userConfig,
    output: { ...userConfig.output, path: outputDir }
  });

  await ensureDir(outputDir);

  const allResults = [];

  for (const file of files) {
    const inputPath = typeof file === 'string' ? file : file.path;
    const fileConfig = typeof file === 'string' ? config : mergeConfig({ ...config, ...file.config });
    
    try {
      const results = await convertSvgToPng(inputPath, fileConfig);
      allResults.push(...results);
    } catch (error) {
      console.error(`✗ ${inputPath} → ${error.message}`);
    }
  }

  return allResults;
}

module.exports = {
  batchConvert,
  batchConvertFiles
};
