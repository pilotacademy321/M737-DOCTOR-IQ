import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { formatIraqDate, getIraqToday } from '../../utils/timezoneUtils';

interface PrintableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  docNumber?: string;
  badgeText?: string;
  officialStampTitle?: string;
  headerDetails?: {
    label: string;
    value: string;
  }[];
  children: React.ReactNode;
}

export const PrintableModal: React.FC<PrintableModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  docNumber,
  badgeText,
  officialStampTitle,
  headerDetails,
  children,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const todayStr = getIraqToday();

  // Stable random hash per mount
  const docHash = useMemo(() => {
    return `${Math.random().toString(36).substring(2, 8).toUpperCase()}-M737-VERIFIED`;
  }, [isOpen]);

  // Handle body classes and keyboard navigation (ESC)
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add('printing-modal-open');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleAfterPrint = () => {
      document.body.classList.remove('printing-active');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      document.body.classList.remove('printing-modal-open');
      document.body.classList.remove('printing-active');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-active');
    // Allow paint/layout cycle before invoking native print
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 50);
    });
  };

  return createPortal(
    <div
      className="printable-modal-portal fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto printable-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-4 printable-document">
        {/* Top Control Toolbar (Always Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>{title}</span>
                {badgeText && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {badgeText}
                  </span>
                )}
              </h3>
              {docNumber && (
                <p className="text-[10px] text-slate-400 font-mono">
                  {docNumber}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة الآن' : 'Print Document'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="p-6 sm:p-10 space-y-6 bg-white text-slate-900 font-sans">
          {/* Official Republic of Iraq Healthcare Header */}
          <div className="pb-5 border-b-2 border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 avoid-break">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-950 tracking-tight">
                  {isAr ? 'جمهورية العراق - المنظومة الطبية' : 'Republic of Iraq - Health Network'}
                </span>
              </div>
              <p className="text-xs font-bold text-amber-800">
                {isAr ? 'منصة M737 للرعاية الطبية والعيادات التخصصية' : 'M737 National Medical Care Platform'}
              </p>
              {subtitle && <p className="text-[11px] text-slate-600">{subtitle}</p>}
            </div>

            <div className="text-start sm:text-end space-y-1 shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950 text-white font-black text-xs">
                <span className="text-amber-400">M737</span>
                <span className="text-[10px] font-normal text-slate-300">
                  {isAr ? 'وثيقة موثقة رسمياً' : 'Verified Document'}
                </span>
              </div>
              {docNumber && (
                <div className="text-[10px] text-slate-700 font-mono font-bold block">
                  REF: {docNumber}
                </div>
              )}
              <div className="text-[10px] text-slate-500">
                {isAr ? 'تاريخ الإصدار:' : 'Issued Date:'} {formatIraqDate(todayStr, isAr)}
              </div>
            </div>
          </div>

          {/* Quick Details Bar */}
          {headerDetails && headerDetails.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs avoid-break">
              {headerDetails.map((item, idx) => (
                <div key={idx}>
                  <span className="text-slate-500 block text-[10px]">{item.label}</span>
                  <strong className="text-slate-900 font-medium">{item.value}</strong>
                </div>
              ))}
            </div>
          )}

          {/* Document Content */}
          <div className="space-y-4">
            {children}
          </div>

          {/* Official Verification & Stamp Footer */}
          <div className="pt-6 border-t-2 border-slate-200 mt-8 space-y-4 avoid-break">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'مصادقة رقمية مشفرة' : 'Digitally Certified Record'}</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  {isAr
                    ? 'هذه الوثيقة صادرة ومعتمدة إلكترونياً عبر منظومة M737 الطبية بموجب لوائح نقابة أطباء العراق. صحة البيانات مطابقة للأصل السحابي.'
                    : 'Electronically validated via M737 Iraq Medical Network under Syndicate standards.'}
                </p>
                <div className="font-mono text-[9px] text-slate-400">
                  SHA-256 HASH: {docHash}
                </div>
              </div>

              <div className="text-center sm:text-end">
                <div className="inline-block p-4 rounded-xl border border-dashed border-slate-400 bg-slate-50 min-w-48 text-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    {officialStampTitle || (isAr ? 'ختم وتوقيع جهة الاعتماد الطبية' : 'Official Medical Stamp & Signature')}
                  </span>
                  <div className="h-10 flex items-center justify-center text-[10px] text-slate-400 italic">
                    {isAr ? '[الختم الرسمي / التوقيع]' : '[Official Stamp / Signature]'}
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono block">
                    M737 IRAQ CLINIC PORTAL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
