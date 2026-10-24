import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../localization/LanguageContext';
import { PageContainer } from '../components/common/PageContainer';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';

export const NotFoundPage: React.FC = () => {
  const { t, direction } = useLanguage();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="py-20">
      <PageContainer size="narrow">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t.notFoundTitle}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t.notFoundDesc}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <Link to="/">
              <PrimaryButton size="md" icon={<ArrowIcon className="w-4 h-4" />}>
                {t.backToHome}
              </PrimaryButton>
            </Link>
            <Link to="/support">
              <SecondaryButton size="md" variant="outline">
                {t.navSupport}
              </SecondaryButton>
            </Link>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};
