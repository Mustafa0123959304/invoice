
export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface InvoiceData {
  companyName: string;
  industry: string; // إضافة مجال العمل
  customerName: string;
  invoiceNumber: string;
  date: string;
  logo: string | null;
  products: Product[];
  taxRate: number;
  notes: string;
}

export interface PDFExportOptions {
  data: InvoiceData;
}
