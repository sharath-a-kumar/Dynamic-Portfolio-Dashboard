/**
 * Example usage of PortfolioService
 */

import PortfolioService from './PortfolioService.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const service = new PortfolioService();
  
  // Load portfolio from Excel
  const excelPath = process.env.EXCEL_FILE_PATH || '../E555815F_58D029050B.xlsx';
  console.log(`Loading portfolio from: ${excelPath}\n`);
  
  const result = await service.loadPortfolioFromExcel(excelPath);
  
  console.log(`Loaded ${result.holdings.length} holdings`);
  
  if (result.errors.length > 0) {
    console.log(`\nWarnings: ${result.errors.length} rows had issues`);
  }
  
  // Calculate portfolio percentages
  const holdingsWithPercentages = service.calculatePortfolioPercentages(result.holdings);
  
  // Group by sector
  const sectorGroups = service.groupBySector(holdingsWithPercentages);
  
  console.log(`\nPortfolio Summary:`);
  console.log(`Total Holdings: ${holdingsWithPercentages.length}`);
  console.log(`Sectors: ${sectorGroups.size}`);
  
  // Display sector summaries
  console.log(`\nSector Breakdown:`);
  sectorGroups.forEach((holdings, sector) => {
    const summary = service.calculateSectorSummary(holdings, sector);
    console.log(`\n${sector}:`);
    console.log(`  Holdings: ${summary.holdingsCount}`);
    console.log(`  Total Investment: ₹${summary.totalInvestment.toLocaleString('en-IN')}`);
    console.log(`  Total Present Value: ₹${summary.totalPresentValue.toLocaleString('en-IN')}`);
    console.log(`  Gain/Loss: ₹${summary.totalGainLoss.toLocaleString('en-IN')} (${summary.gainLossPercentage.toFixed(2)}%)`);
  });
  
  // Display first few holdings
  console.log(`\nSample Holdings:`);
  holdingsWithPercentages.slice(0, 3).forEach(holding => {
    console.log(`\n${holding.particulars} (${holding.nseCode})`);
    console.log(`  Sector: ${holding.sector}`);
    console.log(`  Purchase Price: ₹${holding.purchasePrice}`);
    console.log(`  Quantity: ${holding.quantity}`);
    console.log(`  Investment: ₹${holding.investment.toLocaleString('en-IN')}`);
    console.log(`  Portfolio %: ${holding.portfolioPercentage.toFixed(2)}%`);
  });
}

main().catch(console.error);
