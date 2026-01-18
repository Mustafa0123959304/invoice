
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk
from fpdf import FPDF
import arabic_reshaper
from bidi.algorithm import get_display
import datetime
import os

# إعدادات الخطوط العربية (يجب توفر ملف خط .ttf في نفس المجلد أو استخدام خط نظام)
# ملاحظة: لتحسين المظهر في PDF، يفضل تنزيل خط "Amiri" أو "Tajawal" بصيغة ttf

class InvoiceApp:
    def __init__(self, root):
        self.root = root
        self.root.title("نظام إنشاء الفواتير الاحترافي")
        self.root.geometry("900x700")
        self.root.configure(bg="#f4f7f6")
        
        self.logo_path = None
        self.products = []
        
        # تنسيق الـ RTL للواجهة
        self.setup_ui()

    def setup_ui(self):
        # العنوان الرئيسي
        header = tk.Frame(self.root, bg="#4f46e5", height=60)
        header.pack(fill="x")
        tk.Label(header, text="صانع الفواتير الذكي", font=("Tajawal", 18, "bold"), fg="white", bg="#4f46e5").pack(pady=10)

        main_container = tk.Frame(self.root, bg="#f4f7f6", padx=20, pady=20)
        main_container.pack(fill="both", expand=True)

        # قسم المعلومات الأساسية
        info_frame = tk.LabelFrame(main_container, text="بيانات الفاتورة", font=("Tajawal", 10, "bold"), bg="white", padx=10, pady=10)
        info_frame.pack(fill="x", pady=5)

        # شعار الشركة
        self.logo_label = tk.Label(info_frame, text="لا يوجد شعار", bg="#e2e8f0", width=15, height=5)
        self.logo_label.grid(row=0, column=3, rowspan=2, padx=10)
        tk.Button(info_frame, text="رفع لوقو", command=self.upload_logo).grid(row=2, column=3, padx=10)

        # الحقول
        tk.Label(info_frame, text="اسم الشركة:", bg="white").grid(row=0, column=1, sticky="e", padx=5)
        self.company_name = tk.Entry(info_frame, justify="right")
        self.company_name.grid(row=0, column=0, sticky="ew", padx=5, pady=5)

        tk.Label(info_frame, text="اسم العميل:", bg="white").grid(row=1, column=1, sticky="e", padx=5)
        self.customer_name = tk.Entry(info_frame, justify="right")
        self.customer_name.grid(row=1, column=0, sticky="ew", padx=5, pady=5)

        # جدول المنتجات
        table_frame = tk.LabelFrame(main_container, text="المنتجات والخدمات", font=("Tajawal", 10, "bold"), bg="white", padx=10, pady=10)
        table_frame.pack(fill="both", expand=True, pady=10)

        # عناوين الجدول
        cols = ("المجموع", "الكمية", "سعر الوحدة", "اسم المنتج")
        self.tree = ttk.Treeview(table_frame, columns=cols, show="headings", height=8)
        for col in cols:
            self.tree.heading(col, text=col)
            self.tree.column(col, anchor="center", width=100)
        self.tree.pack(fill="both", expand=True, side="right")

        # مدخلات المنتج الجديد
        input_frame = tk.Frame(table_frame, bg="white")
        input_frame.pack(fill="x", pady=10)

        self.p_name = tk.Entry(input_frame, justify="right")
        self.p_price = tk.Entry(input_frame, justify="right")
        self.p_qty = tk.Entry(input_frame, justify="right")

        self.p_qty.grid(row=0, column=0, padx=5)
        self.p_price.grid(row=0, column=1, padx=5)
        self.p_name.grid(row=0, column=2, padx=5)

        tk.Button(input_frame, text="إضافة منتج", bg="#4f46e5", fg="white", command=self.add_product).grid(row=0, column=3, padx=5)
        tk.Button(input_frame, text="حذف المحدد", bg="#ef4444", fg="white", command=self.remove_product).grid(row=0, column=4, padx=5)

        # المجموع النهائي
        self.total_label = tk.Label(main_container, text="الإجمالي: 0.00 ريال", font=("Tajawal", 14, "bold"), fg="#4f46e5", bg="#f4f7f6")
        self.total_label.pack(anchor="w", pady=10)

        # زر التصدير
        tk.Button(main_container, text="إنشاء فاتورة PDF", font=("Tajawal", 12, "bold"), bg="#10b981", fg="white", height=2, command=self.generate_pdf).pack(fill="x")

    def upload_logo(self):
        file = filedialog.askopenfilename(filetypes=[("Image files", "*.png *.jpg *.jpeg")])
        if file:
            self.logo_path = file
            img = Image.open(file)
            img.thumbnail((100, 100))
            self.photo = ImageTk.PhotoImage(img)
            self.logo_label.config(image=self.photo, text="")

    def add_product(self):
        try:
            name = self.p_name.get()
            price = float(self.p_price.get())
            qty = int(self.p_qty.get())
            total = price * qty
            
            if not name: raise ValueError
            
            self.tree.insert("", "end", values=(f"{total:.2f}", qty, f"{price:.2f}", name))
            self.products.append({"name": name, "price": price, "qty": qty, "total": total})
            self.update_total()
            
            # مسح الحقول
            self.p_name.delete(0, 'end')
            self.p_price.delete(0, 'end')
            self.p_qty.delete(0, 'end')
        except:
            messagebox.showerror("خطأ", "يرجى إدخال بيانات المنتج بشكل صحيح")

    def remove_product(self):
        selected_item = self.tree.selection()
        if selected_item:
            # تحديث القائمة البرمجية (تبسيط: نقوم بمسح الكل وإعادة الإضافة أو تتبع الفهرس)
            # للسهولة هنا سنقوم بإعادة حساب الإجمالي بناءً على ما تبقى في الـ Treeview
            self.tree.delete(selected_item)
            self.update_total_from_tree()

    def update_total(self):
        total_sum = sum(p['total'] for p in self.products)
        self.total_label.config(text=f"الإجمالي (شامل الضريبة 15%): {total_sum * 1.15:.2f} ريال")

    def update_total_from_tree(self):
        total_sum = 0
        for item in self.tree.get_children():
            total_sum += float(self.tree.item(item)['values'][0])
        self.total_label.config(text=f"الإجمالي (شامل الضريبة 15%): {total_sum * 1.15:.2f} ريال")

    def fix_text(self, text):
        """إصلاح النص العربي ليظهر بشكل صحيح في PDF"""
        reshaped_text = arabic_reshaper.reshape(text)
        return get_display(reshaped_text)

    def generate_pdf(self):
        if not self.company_name.get() or not self.tree.get_children():
            messagebox.showwarning("تنبيه", "يرجى إدخال اسم الشركة وإضافة منتجات")
            return

        file_save = filedialog.asksaveasfilename(defaultextension=".pdf", filetypes=[("PDF files", "*.pdf")])
        if not file_save: return

        pdf = FPDF()
        pdf.add_page()
        
        # إضافة خط يدعم العربية (تأكد من وجود ملف الخط أو قم بتغييره لخط يدعم Unicode)
        # pdf.add_font('Amiri', '', 'Amiri-Regular.ttf', uni=True) 
        # ملاحظة: سنستخدم خطوط افتراضية في هذا المثال التوضيحي، ولكن للإنتاج الفعلي
        # يجب استخدام pdf.add_font مع ملف .ttf حقيقي.
        
        pdf.set_font("Arial", size=12) # ملاحظة: FPDF2 تحتاج خطوط محددة للعربية

        # العنوان
        pdf.set_font("Arial", 'B', 20)
        pdf.cell(200, 10, txt=self.fix_text("فاتورة ضريبية"), ln=True, align='C')
        
        pdf.ln(10)
        
        # بيانات الشركة والعميل
        pdf.set_font("Arial", size=12)
        pdf.cell(100, 10, txt=f"{self.fix_text('التاريخ:')} {datetime.date.today()}", align='R')
        pdf.ln(8)
        pdf.cell(100, 10, txt=f"{self.fix_text('اسم الشركة:')} {self.fix_text(self.company_name.get())}", align='R')
        pdf.ln(8)
        pdf.cell(100, 10, txt=f"{self.fix_text('اسم العميل:')} {self.fix_text(self.customer_name.get())}", align='R')
        
        if self.logo_path:
            pdf.image(self.logo_path, x=10, y=25, w=30)

        pdf.ln(20)

        # الجدول
        pdf.set_fill_color(79, 70, 229)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(40, 10, self.fix_text("المجموع"), 1, 0, 'C', True)
        pdf.cell(30, 10, self.fix_text("الكمية"), 1, 0, 'C', True)
        pdf.cell(40, 10, self.fix_text("سعر الوحدة"), 1, 0, 'C', True)
        pdf.cell(80, 10, self.fix_text("المنتج"), 1, 1, 'C', True)

        pdf.set_text_color(0, 0, 0)
        total_before_tax = 0
        for item in self.tree.get_children():
            val = self.tree.item(item)['values']
            pdf.cell(40, 10, f"{val[0]}", 1, 0, 'C')
            pdf.cell(30, 10, f"{val[1]}", 1, 0, 'C')
            pdf.cell(40, 10, f"{val[2]}", 1, 0, 'C')
            pdf.cell(80, 10, self.fix_text(val[3]), 1, 1, 'R')
            total_before_tax += float(val[0])

        pdf.ln(10)
        pdf.set_font("Arial", 'B', 14)
        tax = total_before_tax * 0.15
        pdf.cell(190, 10, txt=f"{self.fix_text('المجموع الفرعي:')} {total_before_tax:.2f} ريال", align='L')
        pdf.ln(8)
        pdf.cell(190, 10, txt=f"{self.fix_text('الضريبة (15%):')} {tax:.2f} ريال", align='L')
        pdf.ln(10)
        pdf.set_text_color(79, 70, 229)
        pdf.cell(190, 10, txt=f"{self.fix_text('الإجمالي النهائي:')} {total_before_tax + tax:.2f} ريال", align='L')

        pdf.output(file_save)
        messagebox.showinfo("نجاح", f"تم حفظ الفاتورة في:\n{file_save}")

if __name__ == "__main__":
    root = tk.Tk()
    app = InvoiceApp(root)
    root.mainloop()
