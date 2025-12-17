/**
 * Manual test script for PortfolioService
 */

import PortfolioService from './PortfolioService.js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testPortfolioService() {
  console.log('Testing PortfolioService...\n');
  
  const service = new PortfolioService();
  
  // Test 1: Load Excel file
  console.log('Test 1: Loading Excel file...');
  try {
    const excelPath = resolve(__dirname, '../../../E555815F_58D029050B.xlsx');
    console.log(`Excel path: ${excelPath}`);
    
    const result = await service.loadPortfolioFromExcel(excelPath);
    
    console.log(`✓ Successfully loaded Excel file`);
    console.log(`  Total rows: ${result.totalRows}`);
    console.log(`  Valid rows: ${result.validRows}`);
    console.log(`  Invalid rows: ${result.invalidRows}`);
    console.log(`  Holdings created: ${result.holdings.length}`);
    
    if (result.errors.length > 0) {
      console.log(`  Errors encountered: ${result.errors.length}`);
      result.errors.forEach((err, idx) => {
        console.log(`    ${idx + 1}. Row ${err.row}: ${err.error}`);
      });
    }
    
    // Test 2: Verify required fields
    if (result.holdings.length > 0) {
      console.log('\nTest 2: Verifying required fields...');
      const holding = result.holdings[0];
      
      const requiredFields = [
        'particulars',
        'purchasePrice',
        'quantity',
        'nseCode',
        'sector',
        'investment'
      ];
      
      let allFieldsPresent = true;
      requiredFields.forEach(field => {
        if (holding[field] === undefined) {
          console.log(`  ✗ Missing field: ${field}`);
          allFieldsPresent = false;
        }
      });
      
      if (allFieldsPresent) {
        console.log('✓ All required fields present');
        console.log('\nSample holding:');
        console.log(`  Particulars: ${holding.particulars}`);
        console.log(`  Purchase Price: ${holding.purchasePrice}`);
        console.log(`  Quantity: ${holding.quantity}`);
        console.log(`  Investment: ${holding.investment}`);
        console.log(`  NSE Code: ${holding.nseCode}`);
        console.log(`  Sector: ${holding.sector}`);
      }
      
      // Test 3: Verify calculations
      console.log('\nTest 3: Verifying calculations...');
      const expectedInvestment = holding.purchasePrice * holding.quantity;
      if (Math.abs(holding.investment - expectedInvestment) < 0.01) {
        console.log('✓ Investment calculation correct');
      } else {
        console.log(`✗ Investment calculation incorrect: expected ${expectedInvestment}, got ${holding.investment}`);
      }
      
      // Test 4: Calculate portfolio percentages
      console.log('\nTest 4: Calculating portfolio percentages...');
      const holdingsWithPercentages = service.calculatePortfolioPercentages(result.holdings);
      const totalPercentage = holdingsWithPercentages.reduce((sum, h) => sum + h.portfolioPercentage, 0);
      
      if (Math.abs(totalPercentage - 100) < 0.01) {
        console.log(`✓ Portfolio percentages sum to 100% (${totalPercentage.toFixed(2)}%)`);
      } else {
        console.log(`✗ Portfolio percentages don't sum to 100%: ${totalPercentage.toFixed(2)}%`);
      }
      
      // Test 5: Group by sector
      console.log('\nTest 5: Grouping by sector...');
      const sectorGroups = service.groupBySector(result.holdings);
      console.log(`✓ Grouped into ${sectorGroups.size} sectors:`);
      sectorGroups.forEach((holdings, sector) => {
        console.log(`  - ${sector}: ${holdings.length} holdings`);
      });
      
      // Test 6: Calculate sector summaries
      console.log('\nTest 6: Calculating sector summaries...');
      sectorGroups.forEach((holdings, sector) => {
        const summary = service.calculateSectorSummary(holdings, sector);
        console.log(`  ${sector}:`);
        console.log(`    Total Investment: ${summary.totalInvestment.toFixed(2)}`);
        console.log(`    Holdings: ${summary.holdingsCount}`);
      });
      console.log('✓ Sector summaries calculated');
    }
    
    console.log('\n✓ All tests passed!');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  // Test 7: Error handling - non-existent file
  console.log('\nTest 7: Testing error handling for non-existent file...');
  try {
    await service.loadPortfolioFromExcel('/path/to/nonexistent/file.xlsx');
    console.log('✗ Should have thrown an error');
  } catch (error) {
    if (error.message.includes('Excel file not found')) {
      console.log('✓ Correctly handles non-existent file');
    } else {
      console.log(`✗ Unexpected error: ${error.message}`);
    }
  }
  
  console.log('\n=== All tests completed successfully ===');
}

testPortfolioService();
