
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Globe } from 'lucide-react';

const LanguageSettings = () => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = React.useState(i18n.language.split('-')[0]);
  const { toast } = useToast();

  const languages = [
    { code: 'en', name: t('language.english') },
    { code: 'es', name: t('language.spanish') },
    { code: 'fr', name: t('language.french') },
    { code: 'de', name: t('language.german') },
  ];

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  const handleSave = async () => {
    try {
      await i18n.changeLanguage(selectedLanguage);
      toast({
        title: t('common.success'),
        description: t('language.success'),
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to change language:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to change language',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('language.title')}</h1>
        <Globe className="h-6 w-6 text-muted-foreground" />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('language.selectLanguage')}</CardTitle>
          <CardDescription>
            Choose your preferred language for the application interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedLanguage} 
            onValueChange={handleLanguageChange} 
            className="space-y-4"
          >
            {languages.map((language) => (
              <div key={language.code} className="flex items-center space-x-2">
                <RadioGroupItem value={language.code} id={language.code} />
                <Label htmlFor={language.code}>{language.name}</Label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="outline">{t('common.cancel')}</Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSettings;
