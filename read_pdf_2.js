const fs = require('fs');
try {
    let PDFParser = require("pdf2json");
    let pdfParser = new PDFParser(this, 1);
    pdfParser.on("pdfParser_dataError", errData => console.error("PDF Parsing Error:", errData.parserError));
    pdfParser.on("pdfParser_dataReady", pdfData => {
        fs.writeFileSync('pdf_output.txt', pdfParser.getRawTextContent());
        console.log("PDF parsed successfully using pdf2json.");
    });

    const files = fs.readdirSync('.');
    const pdfFile = files.find(f => f.endsWith('.pdf'));
    if (pdfFile) {
        console.log("Found PDF:", pdfFile);
        pdfParser.loadPDF(pdfFile);
    } else {
        console.log("No PDF found.");
    }
} catch (e) {
    console.log("Node Error:", e);
}
