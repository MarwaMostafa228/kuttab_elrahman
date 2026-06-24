import React from "react";
import { Award, Printer } from "lucide-react";

export interface CertData {
  id: number;
  title: string;
  description?: string | null;
  sheikhSignature?: string | null;
  issuedAt: string;
}

interface Props {
  cert: CertData;
  studentName: string;
}

export function CertificateCard({ cert, studentName }: Props) {
  const dateStr = new Date(cert.issuedAt).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<title>شهادة - ${studentName}</title>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A5 landscape; margin: 0; }
  body {
    background: #f7f3ec;
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh;
    font-family: 'Cairo', sans-serif;
  }
  .cert {
    width: 200mm; height: 138mm;
    background: linear-gradient(135deg, #f7f3ec 0%, #ffffff 50%, #f7f3ec 100%);
    padding: 7mm;
    position: relative;
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  }
  .outer-border {
    border: 4px double #1a4a30;
    padding: 5mm;
    height: 100%;
    display: flex;
    align-items: stretch;
  }
  .inner-border {
    border: 1.5px solid #d4a017;
    padding: 5mm;
    flex: 1;
    text-align: center;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2.5mm;
  }
  .corner { position: absolute; width: 20px; height: 20px; }
  .corner.tl { top: 3px; right: 3px; border-top: 2px solid #d4a017; border-right: 2px solid #d4a017; }
  .corner.tr { top: 3px; left: 3px; border-top: 2px solid #d4a017; border-left: 2px solid #d4a017; }
  .corner.bl { bottom: 3px; right: 3px; border-bottom: 2px solid #d4a017; border-right: 2px solid #d4a017; }
  .corner.br { bottom: 3px; left: 3px; border-bottom: 2px solid #d4a017; border-left: 2px solid #d4a017; }
  .logo { font-family: 'Amiri', serif; font-size: 28px; font-weight: 700; color: #1a4a30; }
  .sub { font-size: 11px; color: #666; letter-spacing: 1px; }
  .divider { width: 75%; height: 1px; background: linear-gradient(to left, transparent, #d4a017 40%, #d4a017 60%, transparent); margin: 0 auto; }
  .basmala { font-family: 'Amiri', serif; font-size: 16px; color: #1a4a30; }
  .witness { font-size: 12px; color: #555; }
  .name { font-family: 'Amiri', serif; font-size: 26px; font-weight: 700; color: #1a4a30; border-bottom: 2px solid #d4a017; padding-bottom: 1mm; display: inline-block; }
  .cert-title { font-size: 16px; font-weight: 700; color: #d4a017; }
  .desc { font-size: 12px; color: #666; line-height: 1.5; max-width: 80%; }
  .date { font-size: 11px; color: #888; }
  .sign-row { display: flex; align-items: flex-end; justify-content: center; gap: 20mm; margin-top: 2mm; }
  .sign { font-size: 11px; color: #555; text-align: center; }
  .sign .name-line { font-weight: 700; color: #1a4a30; font-size: 12px; margin-bottom: 1mm; }
  .sign .underline { border-bottom: 1px solid #999; width: 40mm; margin: 0 auto; }
  @media print { body { background: white; } .cert { box-shadow: none; } }
</style>
</head>
<body>
<div class="cert">
  <div class="outer-border">
    <div class="inner-border">
      <div class="corner tl"></div><div class="corner tr"></div>
      <div class="corner bl"></div><div class="corner br"></div>
      <div class="logo">كُتَّاب الرحمن</div>
      <div class="sub">دار تحفيظ القرآن الكريم</div>
      <div class="divider"></div>
      <div class="basmala">بسم الله الرحمن الرحيم</div>
      <div class="divider"></div>
      <div class="witness">تشهد إدارة كُتَّاب الرحمن بأن الطالب / الطالبة</div>
      <div class="name">${studentName}</div>
      <div class="cert-title">${cert.title}</div>
      ${cert.description ? `<div class="desc">${cert.description}</div>` : ""}
      <div class="date">بتاريخ: ${dateStr}</div>
      <div class="sign-row">
        <div class="sign">
          ${cert.sheikhSignature ? `<div class="name-line">${cert.sheikhSignature}</div>` : ""}
          <div class="underline"></div>
          <div style="margin-top:1mm">توقيع الشيخ</div>
        </div>
      </div>
    </div>
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-md"
      style={{ background: "linear-gradient(135deg, #f7f3ec 0%, #fff 50%, #f7f3ec 100%)" }}
    >
      <div className="border-4 border-double border-primary m-1 rounded-lg">
        <div className="border border-secondary/60 m-1.5 rounded-lg p-5 text-center relative">
          {/* Corner ornaments */}
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-secondary rounded-tr" />
          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-secondary rounded-tl" />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-secondary rounded-br" />
          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-secondary rounded-bl" />

          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <Award className="w-4 h-4 text-secondary" />
            <span className="text-lg font-bold text-primary" style={{ fontFamily: "Amiri, serif" }}>
              كُتَّاب الرحمن
            </span>
            <Award className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-[10px] text-muted-foreground tracking-wider mb-2">دار تحفيظ القرآن الكريم</p>

          {/* Dividers */}
          <div className="h-px bg-gradient-to-r from-transparent via-secondary to-transparent mb-1.5" />
          <p className="text-sm text-primary mb-1.5" style={{ fontFamily: "Amiri, serif" }}>
            بسم الله الرحمن الرحيم
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-secondary to-transparent mb-3" />

          {/* Body */}
          <p className="text-xs text-muted-foreground mb-1">تشهد إدارة كُتَّاب الرحمن بأن الطالب / الطالبة</p>
          <p
            className="text-2xl font-bold text-primary border-b-2 border-secondary inline-block pb-0.5 mb-2"
            style={{ fontFamily: "Amiri, serif" }}
          >
            {studentName}
          </p>
          <p className="text-base font-bold text-secondary">{cert.title}</p>

          {cert.description && (
            <p className="text-xs text-muted-foreground mt-1 mx-6 leading-relaxed">{cert.description}</p>
          )}

          <p className="text-[11px] text-muted-foreground mt-2">بتاريخ: {dateStr}</p>

          {/* Sheikh signature only */}
          <div className="flex justify-center mt-3">
            <div className="text-center text-[10px] text-muted-foreground">
              {cert.sheikhSignature && (
                <p className="font-bold text-primary text-xs mb-1">{cert.sheikhSignature}</p>
              )}
              <p className="border-b border-muted-foreground/50 w-24 mx-auto mb-1" />
              <p>توقيع الشيخ</p>
            </div>
          </div>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary border border-primary/20 hover:border-primary/50 rounded-full px-3 py-1 transition-colors"
          >
            <Printer className="w-3 h-3" />
            طباعة الشهادة
          </button>
        </div>
      </div>
    </div>
  );
}
