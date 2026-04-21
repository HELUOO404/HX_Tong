/**
 * Test script for config module
 */

const { mergeConfig, generateOutputPath, themes } = require('./src/config');

console.log('Testing config module...\n');

// Test 1: Default configuration
console.log('Test 1: Default configuration');
const defaultCfg = mergeConfig();
console.assert(defaultCfg.style.theme === 'apple-flat', 'Default theme should be apple-flat');
console.assert(defaultCfg.size.baseSize === 24, 'Default baseSize should be 24');
console.assert(defaultCfg.output.path === './output', 'Default output path should be ./output');
console.log('✓ Default config test passed');

// Test 2: Custom configuration
console.log('\nTest 2: Custom configuration');
const customCfg = mergeConfig({
  size: { baseSize: 32, generateScales: [1, 2] },
  style: { theme: 'apple-outline' }
});
console.assert(customCfg.size.baseSize === 32, 'Custom baseSize should be 32');
console.assert(customCfg.style.theme === 'apple-outline', 'Custom theme should be apple-outline');
console.assert(customCfg.style.stroke.width === 1.5, 'Apple-outline stroke width should be 1.5');
console.log('✓ Custom config test passed');

// Test 3: Path generation
console.log('\nTest 3: Path generation');
const path1 = generateOutputPath('icon.svg', 1, customCfg);
console.assert(path1 === './output/icon.png', 'Path should be ./output/icon.png');
console.log('Generated path:', path1);

const customNamingCfg = mergeConfig({
  output: { naming: '{name}@{scale}x.png' }
});
const path2 = generateOutputPath('home.svg', 2, customNamingCfg);
console.assert(path2 === './output/home@2x.png', 'Path should be ./output/home@2x.png');
console.log('Generated path with scale:', path2);

const sizeNamingCfg = mergeConfig({
  size: { baseSize: 24 },
  output: { naming: '{name}_{size}px.png' }
});
const path3 = generateOutputPath('logo.svg', 2, sizeNamingCfg);
console.assert(path3 === './output/logo_48px.png', 'Path should be ./output/logo_48px.png');
console.log('Generated path with size:', path3);

// Test 4: Theme presets
console.log('\nTest 4: Theme presets');
console.assert(themes['apple-flat'].stroke.width === 0, 'Apple-flat should have no stroke');
console.assert(themes['apple-outline'].stroke.width === 1.5, 'Apple-outline should have 1.5 stroke');
console.assert(themes['apple-gradient'].color.type === 'gradient', 'Apple-gradient should have gradient color');
console.log('✓ Theme presets test passed');

console.log('\n✅ All config tests passed!');
