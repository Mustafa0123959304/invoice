
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, FileText, Download, Building2, User, Receipt, Sparkles, Briefcase } from 'lucide-react';
import { Product, InvoiceData } from './types';
import { exportInvoiceToPDF } from './services/pdfService';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [invoice, setInvoice] = useState<InvoiceData>({
    companyName: '',
    industry: '',
    customerName: '',
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    logo: null,
    products: [{ id: '1', name: '', price: 0, quantity: 1 }],
    taxRate: 15,
    notes: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const subtotal = useMemo(() => {
    return invoice.products.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  }, [invoice.products]);

  const taxAmount = useMemo(() => (subtotal * invoice.taxRate) / 100, [subtotal, invoice.taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const addProduct = () => {
    setInvoice(prev => ({
      ...prev,
      products: [...prev.products, { id: Date.now().toString(), name: '', price: 0, quantity: 1 }]
    }));
  };

  const removeProduct = (id: string) => {
    if (invoice.products.length === 1) return;
    setInvoice(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const updateProduct = (id: string, field: keyof Product, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoice(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      await exportInvoiceToPDF(invoice, subtotal, taxAmount, total);
    } catch (error) {
      console.error("PDF Export failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiImprove = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `
        بصفتك خبير في التواصل التجاري وتجربة العملاء:
        قم بمراجعة بيانات هذه الفاتورة:
        - الشركة: ${invoice.companyName}
        - مجال العمل: ${invoice.industry || "عام"}
        - العميل: ${invoice.customerName}
        - إجمالي المبلغ: ${total.toFixed(2)} ريال
        - المنتجات: ${invoice.products.map(p => p.name).join(', ')}

        المطلوب:
        اقترح 3 خيارات لملاحظات ختامية (Closing Notes) احترافية ومقنعة جداً باللغة العربية. 
        يجب أن تكون الملاحظات مخصصة لمجال العمل وتزيد من ولاء العميل وثقته. 
        اجعلها تتضمن عبارات شكر، وعرض للمساعدة المستقبلية، ولمسة تسويقية ذكية تناسب السياق.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "أنت مساعد ذكي متخصص في تحسين التواصل التجاري وكتابة المحتوى المهني للفواتير. هدفك هو تحويل الفاتورة من مجرد مستند مالي إلى أداة لتعزيز العلاقة مع العميل."
        }
      });
      setAiAnalysis(response.text || "لم نتمكن من تحليل الفاتورة.");
    } catch (e) {
      setAiAnalysis("حدث خطأ أثناء التواصل مع الذكاء الاصطناعي.");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-5xl mb-8 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl text-white">
            <Receipt size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">صانع الفواتير الذكي</h1>
            <p className="text-slate-500 text-sm">أنشئ فواتيرك باحترافية وسرعة</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
        >
          {isGenerating ? 'جاري التحميل...' : (
            <>
              <Download size={20} />
              <span>تصدير PDF</span>
            </>
          )}
        </button>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoice Form */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo Area */}
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">شعار الشركة</label>
                <div className="relative group w-32 h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden">
                  {invoice.logo ? (
                    <>
                      <img src={invoice.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                      <button 
                        onClick={() => setInvoice(prev => ({ ...prev, logo: null }))}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <Plus className="mx-auto text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400">اختر شعار</span>
                    </div>
                  )}
                  <input type="file" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Building2 size={16} className="text-slate-400" />
                    اسم الشركة
                  </label>
                  <input
                    type="text"
                    value={invoice.companyName}
                    onChange={(e) => setInvoice(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="شركتك المحدودة"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Briefcase size={16} className="text-slate-400" />
                    مجال العمل (اختياري)
                  </label>
                  <input
                    type="text"
                    value={invoice.industry}
                    onChange={(e) => setInvoice(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="مثال: تقنية معلومات، مطاعم، مقاولات"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    اسم العميل
                  </label>
                  <input
                    type="text"
                    value={invoice.customerName}
                    onChange={(e) => setInvoice(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="اسم العميل الكريم"
                  />
                </div>
                <div className="space-y-1 flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700">رقم الفاتورة</label>
                    <input
                      type="text"
                      value={invoice.invoiceNumber}
                      onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700">التاريخ</label>
                    <input
                      type="date"
                      value={invoice.date}
                      onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600" />
                  المنتجات والخدمات
                </h3>
                <button
                  onClick={addProduct}
                  className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Plus size={16} />
                  إضافة بند جديد
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-50 text-slate-600 text-sm">
                    <tr>
                      <th className="px-4 py-3 font-medium">المنتج / الوصف</th>
                      <th className="px-4 py-3 font-medium w-24">الكمية</th>
                      <th className="px-4 py-3 font-medium w-32">السعر</th>
                      <th className="px-4 py-3 font-medium w-32 text-left">المجموع</th>
                      <th className="px-4 py-3 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                            placeholder="وصف المنتج..."
                            className="w-full bg-transparent border-none focus:ring-0 outline-none text-slate-700"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => updateProduct(product.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-100/50 px-2 py-1 rounded border-none focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-100/50 px-2 py-1 rounded border-none focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-left font-medium text-slate-700">
                          {(product.price * product.quantity).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700">ملاحظات إضافية (تظهر في الفاتورة)</label>
              <textarea
                value={invoice.notes}
                onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="شروط الدفع، رقم الحساب، أو رسالة شكر..."
              />
            </div>
          </section>
        </div>

        {/* Totals & Summary Sidebar */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h3 className="font-bold text-slate-800 border-b pb-4">ملخص الحساب</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-medium">{subtotal.toFixed(2)} ريال</span>
              </div>
              <div className="flex justify-between text-slate-600 items-center">
                <span>الضريبة (15%):</span>
                <span className="font-medium text-red-500">+{taxAmount.toFixed(2)} ريال</span>
              </div>
              <div className="pt-4 border-t border-dashed flex justify-between items-center text-lg">
                <span className="font-bold text-slate-800">الإجمالي النهائي:</span>
                <span className="font-bold text-indigo-600">{total.toFixed(2)} ريال</span>
              </div>
            </div>
          </section>

          {/* AI Helper Card */}
          <section className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4">
            <div className="flex items-center gap-2 text-indigo-800">
              <Sparkles size={20} />
              <h3 className="font-bold">مساعد الذكاء الاصطناعي</h3>
            </div>
            <p className="text-sm text-indigo-700/80 leading-relaxed">
              يمكن لمساعدنا الذكي اقتراح ملاحظات ختامية احترافية مخصصة لمجال عملك لزيادة ثقة العميل.
            </p>
            {aiAnalysis ? (
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-xl text-sm text-slate-700 border border-indigo-200 shadow-inner whitespace-pre-line max-h-64 overflow-y-auto">
                  {aiAnalysis}
                </div>
                <button
                  onClick={() => setAiAnalysis(null)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <button
                onClick={handleAiImprove}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                توليد ملاحظات احترافية
              </button>
            )}
          </section>
        </div>
      </main>

      <footer className="mt-12 text-slate-400 text-sm text-center">
        نظام الفواتير المطور © {new Date().getFullYear()} - تم التصميم لخدمة المنشآت الصغيرة
      </footer>
    </div>
  );
};

export default App;
