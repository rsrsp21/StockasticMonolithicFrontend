import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Helper to format currency
// Helper to format currency
const formatCurrency = (value) => {
    return `Rs. ${Number(value).toFixed(2)}`;
};

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd-MMM-yyyy');
};

// Helper: Add Logo (Placeholder or text) and Header
const addHeader = (doc, title, subtitle = '') => {
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('Stockastic', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Your Trusted Investment Partner', 14, 25);

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(title, pageWidth - 14, 20, { align: 'right' });
    
    if (subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(subtitle, pageWidth - 14, 26, { align: 'right' });
    }
    
    doc.line(14, 30, pageWidth - 14, 30);
};

// Helper: Add Footer with Page Numbers
const addFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        const text = `Page ${i} of ${pageCount} | Generated on ${format(new Date(), 'dd-MMM-yyyy HH:mm')}`;
        doc.text(text, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
};

/**
 * 1. Portfolio Summary Report
 */
export const generatePortfolioPDF = (portfolioSummary, holdings) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    addHeader(doc, 'Portfolio Summary', `As of ${format(new Date(), 'dd-MMM-yyyy')}`);

    // Summary Section
    let finalY = 40;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Overview', 14, finalY);
    
    const summaryData = [
        ['Total Invested', formatCurrency(portfolioSummary.totalInvested)],
        ['Current Value', formatCurrency(portfolioSummary.currentValue)],
        ['Total P&L', `${portfolioSummary.isPositive ? '+' : ''}${formatCurrency(portfolioSummary.totalPnl)} (${portfolioSummary.pnlPercent.toFixed(2)}%)`]
    ];

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', width: 60 },
            1: { halign: 'right' }
        },
        margin: { left: 14, right: pageWidth / 2 }
    });

    // Holdings Table
    const tableData = holdings.map(h => {
        const invested = h.quantity * h.averagePrice;
        const current = h.quantity * h.currentPrice;
        const pnl = current - invested;
        const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
        
        return [
            h.symbol,
            h.quantity,
            formatCurrency(h.averagePrice),
            formatCurrency(h.currentPrice),
            formatCurrency(invested),
            formatCurrency(current),
            { content: `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}\n(${pnlPercent.toFixed(2)}%)`, styles: { textColor: pnl >= 0 ? [0, 128, 0] : [255, 0, 0] } }
        ];
    });

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Symbol', 'Qty', 'Avg Price', 'CMP', 'Invested', 'Cur. Value', 'Gain/Loss']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' }
        }
    });

    addFooter(doc);
    doc.save(`Portfolio_Summary_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

/**
 * 2. Capital Gains Report
 * Note: Requires calculating realized P&L from order history using FIFO
 */
export const generateCapitalGainsPDF = (orders, financialYear) => {
    const doc = new jsPDF('l'); // Landscape for more columns
    
    addHeader(doc, 'Capital Gains Report', `FY ${financialYear}`);

    // Logic to calculate Capital Gains using FIFO
    // This is a simplified implementation
    let realizedTrades = [];
    let holdingsMap = {}; // Map of stockId -> queue of {qty, price, date}

    // Sort orders by date ascending
    const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    sortedOrders.forEach(order => {
        if (order.status !== 'COMPLETED' && order.status !== 'FILLED') return; // order.status could be FILLED

        if (order.orderType === 'BUY') {
            if (!holdingsMap[order.symbol]) holdingsMap[order.symbol] = [];
            holdingsMap[order.symbol].push({
                quantity: order.quantity,
                price: order.price,
                date: order.createdAt,
                stockName: order.stockName,
                symbol: order.symbol
            });
        } else if (order.orderType === 'SELL') {
            let remainingSellQty = order.quantity;
            
            while (remainingSellQty > 0 && holdingsMap[order.symbol] && holdingsMap[order.symbol].length > 0) {
                let buyRecord = holdingsMap[order.symbol][0];
                
                let matchedQty = Math.min(remainingSellQty, buyRecord.quantity);
                
                // Determine STCG/LTCG (1 year threshold)
                const buyDate = new Date(buyRecord.date);
                const sellDate = new Date(order.createdAt);
                const diffTime = Math.abs(sellDate - buyDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                const isLTCG = diffDays > 365;

                const buyValue = matchedQty * buyRecord.price;
                const sellValue = matchedQty * order.price;
                const gain = sellValue - buyValue;

                // Check FY filter (based on Sell Date)
                const fyStartYear = parseInt(financialYear.split('-')[0]);
                
                // Only add if it matches selected FY
                if (sellDate >= new Date(`${fyStartYear}-04-01`) && sellDate <= new Date(`${fyStartYear + 1}-03-31`)) {
                     realizedTrades.push({
                        symbol: order.symbol,
                        buyDate: buyRecord.date,
                        sellDate: order.createdAt,
                        qty: matchedQty,
                        buyPrice: buyRecord.price,
                        sellPrice: order.price,
                        type: isLTCG ? 'LTCG' : 'STCG',
                        gain: gain
                    });
                }

                // Update Buy Record
                if (matchedQty < buyRecord.quantity) {
                    buyRecord.quantity -= matchedQty;
                } else {
                    holdingsMap[order.symbol].shift(); // Fully used this buy record
                }
                
                remainingSellQty -= matchedQty;
            }
        }
    });

    const totalSTCG = realizedTrades.filter(t => t.type === 'STCG').reduce((sum, t) => sum + t.gain, 0);
    const totalLTCG = realizedTrades.filter(t => t.type === 'LTCG').reduce((sum, t) => sum + t.gain, 0);

    doc.setFontSize(10);
    doc.text(`Total STCG: ${formatCurrency(totalSTCG)}`, 14, 40);
    doc.text(`Total LTCG: ${formatCurrency(totalLTCG)}`, 80, 40);
    doc.text(`Total Gains: ${formatCurrency(totalSTCG + totalLTCG)}`, 146, 40);

    const tableData = realizedTrades.map(t => [
        t.symbol,
        formatDate(t.buyDate),
        formatDate(t.sellDate),
        t.qty,
        formatCurrency(t.buyPrice),
        formatCurrency(t.sellPrice),
        t.type,
        { content: formatCurrency(t.gain), styles: { textColor: t.gain >= 0 ? [0, 128, 0] : [255, 0, 0] } }
    ]);

    autoTable(doc, {
        startY: 50,
        head: [['Symbol', 'Buy Date', 'Sell Date', 'Qty', 'Buy Price', 'Sell Price', 'Type', 'Gain/Loss']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 66, 66] }
    });

    addFooter(doc);
    doc.save(`Capital_Gains_${financialYear}.pdf`);
};

/**
 * 3. Account Statement (Ledger)
 */
// Helper to clean description text
const cleanDescription = (desc) => {
    if (!desc) return '-';
    // Remove ₹, &, and null bytes which might be causing PDF rendering issues
    return desc.toString()
        .replace(/₹/g, 'Rs. ')
        .replace(/[\u0000&]/g, '') // remove & and null bytes
        .trim();
};

/**
 * 3. Account Statement (Ledger)
 */
export const generateAccountStatementPDF = (transactions) => {
    const doc = new jsPDF();
    addHeader(doc, 'Account Statement', `Generated on ${format(new Date(), 'dd-MMM-yyyy')}`);

    const tableData = transactions.map(t => [
        formatDate(t.createdAt),
        t.type, 
        cleanDescription(t.description),
        { content: formatCurrency(t.amount), styles: { textColor: t.type === 'CREDIT' ? [0, 128, 0] : [255, 0, 0] } },
    ]);

    autoTable(doc, {
        startY: 40,
        head: [['Date', 'Type', 'Description', 'Amount']], // Add Balance if available
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 9, font: 'helvetica' }, // Force helvetica
        headStyles: { fillColor: [52, 73, 94] }
    });

    addFooter(doc);
    doc.save(`Account_Statement.pdf`);
};

/**
 * 4. Trade Book (Order History)
 */
export const generateTradeBookPDF = (orders) => {
    const doc = new jsPDF('l');
    addHeader(doc, 'Trade Book', `All Orders`);

    const tableData = orders.map(o => [
        o.orderId,
        formatDate(o.createdAt),
        o.symbol,
        o.orderType, // BUY/SELL
        o.quantity,
        formatCurrency(o.price),
        formatCurrency(o.quantity * o.price), // Value
        o.status
    ]);

    autoTable(doc, {
        startY: 40,
        head: [['Order ID', 'Date', 'Symbol', 'Type', 'Qty', 'Price', 'Value', 'Status']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [44, 62, 80] },
        columnStyles: {
            3: { fontStyle: 'bold', textColor: (row) => row.raw === 'BUY' ? [0, 128, 0] : [255, 0, 0] } // Does not work directly like this in autotable
        },
        didParseCell: function(data) {
            if (data.column.index === 3) {
                 if (data.cell.raw === 'BUY') {
                     data.cell.styles.textColor = [0, 128, 0];
                 } else if (data.cell.raw === 'SELL') {
                     data.cell.styles.textColor = [255, 0, 0];
                 }
            }
        }
    });

    addFooter(doc);
    doc.save(`Trade_Book.pdf`);
};
