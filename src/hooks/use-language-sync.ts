
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setLanguage } from '@/features/ui/uiSlice';

/**
 * Hook to synchronize i18n language with Redux state
 */
export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const storedLanguage = useAppSelector((state) => state.ui.language);

  // On first mount, apply the stored language from Redux to i18n
  useEffect(() => {
    if (storedLanguage && i18n.language !== storedLanguage) {
      i18n.changeLanguage(storedLanguage);
    } else if (i18n.language && i18n.language !== storedLanguage) {
      // If i18n has a language that doesn't match Redux, update Redux
      dispatch(setLanguage(i18n.language));
    }
  }, [i18n, dispatch, storedLanguage]);

  // Listen for i18n language changes and update Redux
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (lng !== storedLanguage) {
        dispatch(setLanguage(lng));
      }
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n, dispatch, storedLanguage]);

  return null;
};

export default useLanguageSync;
