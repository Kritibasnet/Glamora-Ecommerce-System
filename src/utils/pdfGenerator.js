import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../cosmetics.png';

function getBase64FromUrl(url) {
    return new Promise((resolve) => {
        if (url.startsWith('data:')) {
            resolve(url);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = () => {
            console.error('Could not load image for PDF');
            resolve(null);
        };
        img.src = url;
    });
}

export const generatePaymentSlip = async (cart, total, user, transactionId = 'N/A') => {
    const doc = new jsPDF();
    const logoBase64 = await getBase64FromUrl(logo);

    // Header
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 15, 15, 30, 30);
    }
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 86, 125); // Glamora Pink
    doc.text('GLAMORA', 50, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Beauty & Cosmetics Store', 50, 32);
    doc.text('www.glamora.com | support@glamora.com', 50, 38);

    // Bill Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT RECEIPT', 140, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 32);
    doc.text(`Transaction ID: ${transactionId}`, 140, 38);

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 50, 195, 50);

    // Customer Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', 15, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${user?.username || 'Guest Customer'}`, 15, 66);
    doc.text(`Email: ${user?.email || 'N/A'}`, 15, 72);

    // Items Table
    const tableColumn = ["Item", "Price", "Quantity", "Total"];
    const tableRows = [];

    cart.forEach(item => {
        const itemData = [
            item.title,
            `$${item.price.toFixed(2)}`,
            item.count.toString(),
            `$${item.total.toFixed(2)}`
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        startY: 85,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [212, 86, 125] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'center' },
            3: { halign: 'right' }
        }
    });

    // Totals Section
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 150;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 140, finalY);
    doc.text('Tax (10%):', 140, finalY + 8);
    
    doc.setFontSize(14);
    doc.setTextColor(212, 86, 125);
    doc.text('Total Paid:', 140, finalY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    const subtotal = total / 1.1;
    const tax = total - subtotal;
    
    doc.text(`$${subtotal.toFixed(2)}`, 180, finalY, { align: 'right' });
    doc.text(`$${tax.toFixed(2)}`, 180, finalY + 8, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 86, 125);
    doc.text(`$${total.toFixed(2)}`, 180, finalY + 18, { align: 'right' });

    // Paid & Verified Stamp (Drawn natively to avoid AI images)
    doc.setDrawColor(34, 139, 34); // Forest Green
    doc.setTextColor(34, 139, 34);
    doc.setLineWidth(1.5);
    doc.rect(20, finalY + 5, 60, 20); // Border for stamp
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID & VERIFIED', 25, finalY + 18);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for shopping with Glamora!', 105, 280, { align: 'center' });
    
    // Save PDF
    doc.save(`Glamora_Receipt_${transactionId}.pdf`);
};
