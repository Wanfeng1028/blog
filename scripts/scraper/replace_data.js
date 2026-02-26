const fs = require('fs');
const path = require('path');

const dataTsPath = path.join(__dirname, '../../src/features/projects/data.ts');
const dataTsContent = fs.readFileSync(dataTsPath, 'utf8');

const outputTsPath = path.join(__dirname, 'output.ts');
const newAiToolsContent = fs.readFileSync(outputTsPath, 'utf8');

// Replace the existing aiTools array
const regex = /export const aiTools: ToolItem\[\] = \[[\s\S]*?\];/m;

// Add type annotation to the new output
const replacement = newAiToolsContent.replace('export const aiTools =', 'export const aiTools: ToolItem[] =').trim() + ';';

const updatedContent = dataTsContent.replace(regex, replacement);

fs.writeFileSync(dataTsPath, updatedContent);
console.log("data.ts updated successfully with new tools.");
