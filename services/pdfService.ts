
import { InvoiceData } from '../types';

/**
 * Generates a PDF invoice using native window printing for better CSS/RTL support,
 * which is often more reliable than jsPDF for complex Arabic text layouts.
 */
export const exportInvoiceToPDF = async (
  data: InvoiceData,
  subtotal: number,
  tax: number,
  total: number
): Promise<void> => {
  // Create a temporary hidden print area
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <html dir="rtl" lang="ar">
    <head>
      <title>فاتورة - ${data.invoiceNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Tajawal', sans-serif; padding: 40px; color: #334155; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; }
        .logo { max-width: 150px; height: auto; }
        .company-info h1 { margin: 0; color: #4f46e5; font-size: 28px; }
        .invoice-details { margin-bottom: 40px; }
        .invoice-details table { width: 100%; }
        .customer-box { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 40px; }
        .product-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        .product-table th { background: #4f46e5; color: white; padding: 12px; text-align: right; }
        .product-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .totals { float: left; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .final-total { border-top: 2px solid #4f46e5; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 20px; color: #4f46e5; }
        .notes { margin-top: 100px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 14px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${data.companyName || 'فاتورة ضريبية'}</h1>
          <p>الرقم: ${data.invoiceNumber}</p>
          <p>التاريخ: ${data.date}</p>
        </div>
        ${data.logo ? `<img src="${data.logo}" class="logo" />` : '<div class="logo"></div>'}
      </div>

      <div class="customer-box">
        <h3 style="margin-top: 0">فاتورة إلى:</h3>
        <p style="margin: 0; font-size: 18px; font-weight: bold;">${data.customerName || 'عميل نقدي'}</p>
      </div>

      <table class="product-table">
        <thead>
          <tr>
            <th>الوصف</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th style="text-align: left">المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${data.products.map(p => `
            <tr>
              <td>${p.name || '-'}</td>
              <td>${p.quantity}</td>
              <td>${p.price.toFixed(2)} ريال</td>
              <td style="text-align: left">${(p.price * p.quantity).toFixed(2)} ريال</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>المجموع الفرعي:</span>
          <span>${subtotal.toFixed(2)} ريال</span>
        </div>
        <div class="total-row">
          <span>الضريبة (15%):</span>
          <span>${tax.toFixed(2)} ريال</span>
        </div>
        <div class="total-row final-total">
          <span>الإجمالي:</span>
          <span>${total.toFixed(2)} ريال</span>
        </div>
      </div>

      <div style="clear: both"></div>

      ${data.notes ? `
        <div class="notes">
          <strong>ملاحظات:</strong>
          <p>${data.notes}</p>
        </div>
      ` : ''}

      <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px;">
        تم إنشاء هذه الفاتورة بواسطة نظام الفواتير الذكي
      </div>

      <script>
        window.onload = function() {
          window.print();
          // window.close(); // Optional: close window after printing
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
