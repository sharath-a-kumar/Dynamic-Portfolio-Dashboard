/**
 * Debug script to inspect Excel file structure
 */

import xlsx from 'xlsx';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function debugExcel() {
  const excelPath = resolve(__dirname, '../../../E555815F_58D029050B.xlsx');
  console.log(`Reading Excel file: ${excelPath}\n`);
  
  const fileBuffer = readFileSync(excelPath);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  
  console.log(`Sheet names: ${workbook.SheetNames.join(', ')}\n`);
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rawRows = xlsx.utils.sheet_to_json(worksheet);
  
  console.log(`Total rows: ${rawRows.length}\n`);
  
  if (rawRows.length > 0) {
    console.log('First row (headers):');
    console.log(JSON.stringify(rawRows[0], null, 2));
    
    console.log('\nColumn names found:');
    Object.keys(rawRows[0]).forEach(key => {
      console.log(`  - "${key}"`);
    });
    
    if (rawRows.length > 1) {
      console.log('\nSecond row (first data row):');
      console.log(JSON.stringify(rawRows[1], null, 2));
    }
    
    if (rawRows.length > 2) {
      console.log('\nThird row (second data row):');
      console.log(JSON.stringify(rawRows[2], null, 2));
    }
  }
}

debugExcel();
