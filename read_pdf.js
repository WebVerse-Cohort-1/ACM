const fs = require('fs');
try {
    const pdf = require('pdf-parse');
    const files = fs.readdirSync('.');
    const pdfFile = files.find(f => f.endsWith('.pdf'));
    if (pdfFile) {
        let dataBuffer = fs.readFileSync(pdfFile);
        pdf(dataBuffer).then(function (data) {
            fs.writeFileSync('pdf_output.txt', data.text);
            console.log("PDF parsed successfully.");
        }).catch(err => console.log("PDF Error:", err));
    }
} catch (e) {
    console.log("Setup Error:", e);
}
