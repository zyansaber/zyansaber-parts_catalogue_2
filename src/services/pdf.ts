import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PartApplication } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

export class PDFService {
  static async generateApplicationPDF(application: PartApplication, language: 'en' | 'zh' = 'en'): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Set font
    pdf.setFont('helvetica');

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    const title = language === 'zh' ? '零部件申请单' : 'Part Application Form';
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Ticket ID
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const ticketLabel = language === 'zh' ? '申请单号:' : 'Ticket ID:';
    pdf.text(`${ticketLabel} ${application.ticket_id}`, margin, yPosition);
    yPosition += 10;

    // Date
    const dateLabel = language === 'zh' ? '申请日期:' : 'Application Date:';
    pdf.text(`${dateLabel} ${formatDate(application.created_at)}`, margin, yPosition);
    yPosition += 15;

    // Status and Urgency
    pdf.setFontSize(10);
    const statusLabel = language === 'zh' ? '状态:' : 'Status:';
    const urgencyLabel = language === 'zh' ? '紧急程度:' : 'Urgency:';
    pdf.text(`${statusLabel} ${application.status.toUpperCase()}`, margin, yPosition);
    pdf.text(`${urgencyLabel} ${application.urgency.toUpperCase()}`, margin + 60, yPosition);
    yPosition += 15;

    // Main content
    pdf.setFontSize(12);
    
    // Part Information Section
    pdf.setFont('helvetica', 'bold');
    const partInfoTitle = language === 'zh' ? '零部件信息' : 'Part Information';
    pdf.text(partInfoTitle, margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    
    // Part fields
    const fields = [
      { 
        label: language === 'zh' ? '零部件编号:' : 'Part Number:', 
        value: application.part_number 
      },
      { 
        label: language === 'zh' ? '供应商:' : 'Supplier:', 
        value: application.supplier_name 
      },
      { 
        label: language === 'zh' ? '零部件描述:' : 'Description:', 
        value: application.part_description 
      }
    ];

    fields.forEach(field => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(field.label, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      
      // Handle long text with wrapping
      const lines = pdf.splitTextToSize(field.value, contentWidth - 40);
      pdf.text(lines, margin + 40, yPosition);
      yPosition += lines.length * 5 + 3;
    });

    yPosition += 5;

    // Request Information Section
    pdf.setFont('helvetica', 'bold');
    const requestInfoTitle = language === 'zh' ? '申请信息' : 'Request Information';
    pdf.text(requestInfoTitle, margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    
    const requestFields = [
      { 
        label: language === 'zh' ? '申请人:' : 'Requested By:', 
        value: application.requested_by 
      },
      { 
        label: language === 'zh' ? '部门:' : 'Department:', 
        value: application.department 
      },
      { 
        label: language === 'zh' ? '预估成本:' : 'Estimated Cost:', 
        value: formatCurrency(application.estimated_cost || 0) 
      }
    ];

    requestFields.forEach(field => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(field.label, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(field.value, margin + 40, yPosition);
      yPosition += 7;
    });

    yPosition += 5;

    // Technical Specifications
    if (application.technical_specs) {
      pdf.setFont('helvetica', 'bold');
      const techSpecsTitle = language === 'zh' ? '技术规格' : 'Technical Specifications';
      pdf.text(techSpecsTitle, margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      const techLines = pdf.splitTextToSize(application.technical_specs, contentWidth);
      pdf.text(techLines, margin, yPosition);
      yPosition += techLines.length * 5 + 10;
    }

    // Business Justification
    if (application.justification) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFont('helvetica', 'bold');
      const justificationTitle = language === 'zh' ? '业务依据' : 'Business Justification';
      pdf.text(justificationTitle, margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      const justificationLines = pdf.splitTextToSize(application.justification, contentWidth);
      pdf.text(justificationLines, margin, yPosition);
      yPosition += justificationLines.length * 5 + 10;
    }

    // Additional Notes
    if (application.application_notes) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFont('helvetica', 'bold');
      const notesTitle = language === 'zh' ? '附加说明' : 'Additional Notes';
      pdf.text(notesTitle, margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      const notesLines = pdf.splitTextToSize(application.application_notes, contentWidth);
      pdf.text(notesLines, margin, yPosition);
      yPosition += notesLines.length * 5 + 10;
    }

    // Add image if available
    if (application.image_url) {
      try {
        // Check if we need a new page for image
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFont('helvetica', 'bold');
        const imageTitle = language === 'zh' ? '零部件图片' : 'Part Image';
        pdf.text(imageTitle, margin, yPosition);
        yPosition += 10;

        // Create a temporary image element
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate dimensions to fit within PDF
            const maxWidth = contentWidth;
            const maxHeight = 80; // Max height in mm
            
            let { width, height } = img;
            const aspectRatio = width / height;
            
            if (width > maxWidth) {
              width = maxWidth;
              height = width / aspectRatio;
            }
            
            if (height > maxHeight) {
              height = maxHeight;
              width = height * aspectRatio;
            }
            
            canvas.width = width * 3.78; // Convert mm to pixels (approximate)
            canvas.height = height * 3.78;
            
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imgData = canvas.toDataURL('image/jpeg', 0.7);
            pdf.addImage(imgData, 'JPEG', margin, yPosition, width, height);
            
            resolve(void 0);
          };
          
          img.onerror = () => resolve(void 0); // Continue even if image fails
          img.src = application.image_url;
        });
      } catch (error) {
        console.warn('Failed to add image to PDF:', error);
      }
    }

    // Footer
    const footerY = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const footerText = language === 'zh' ? 
      `生成日期: ${new Date().toLocaleDateString('zh-CN')} | 零部件申请系统` :
      `Generated: ${new Date().toLocaleDateString()} | Parts Application System`;
    pdf.text(footerText, pageWidth / 2, footerY, { align: 'center' });

    // Save PDF
    const filename = `${application.ticket_id}_${language === 'zh' ? 'zh' : 'en'}.pdf`;
    pdf.save(filename);
  }
}