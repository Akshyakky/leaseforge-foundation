
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { setTheme } from '@/features/ui/uiSlice';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Paintbrush, Monitor, Moon, Sun, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const themes = [
  {
    name: 'light',
    label: 'Light',
    icon: <Sun className="h-4 w-4" />,
  },
  {
    name: 'dark',
    label: 'Dark',
    icon: <Moon className="h-4 w-4" />,
  },
  {
    name: 'system',
    label: 'System',
    icon: <Monitor className="h-4 w-4" />,
  },
];

interface ColorOption {
  name: string;
  value: string;
  foreground?: string;
}

// Predefined color options
const colorOptions: ColorOption[] = [
  { name: 'Slate', value: '222.2 84% 4.9%' },
  { name: 'Blue', value: '221.2 83% 53.9%' },
  { name: 'Indigo', value: '226 70% 40%' },
  { name: 'Purple', value: '262 80% 50%' },
  { name: 'Green', value: '142.1 76.2% 36.3%' },
  { name: 'Orange', value: '20.5 90.2% 48.2%' },
  { name: 'Pink', value: '333 71% 51%', foreground: '#fff' },
];

const ThemeCustomizer = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector(state => state.ui);
  const [activeTab, setActiveTab] = useState('theme');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);
  
  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(value));
    applyTheme(value);
  };
  
  const applyTheme = (value: string) => {
    if (value === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (value === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      // Handle system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      document.documentElement.classList.toggle('light', !prefersDark);
    }
  };
  
  const setAccentColor = (color: string) => {
    setSelectedColor(color);
    document.documentElement.style.setProperty('--primary', color);
    // Also update localStorage to persist the preference
    localStorage.setItem('accentColor', color);
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Customize theme">
          <Paintbrush className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{t('theme.customizer', 'Customize')}</h4>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="theme">
                {t('theme.appearance', 'Appearance')}
              </TabsTrigger>
              <TabsTrigger value="colors">
                {t('theme.colors', 'Colors')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="theme" className="pt-4">
              <div className="grid grid-cols-3 gap-2">
                {themes.map((item) => (
                  <Button
                    key={item.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleThemeChange(item.name as 'light' | 'dark' | 'system')}
                    className={cn(
                      "justify-start w-full",
                      theme === item.name && "border-2 border-primary"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <div className="mr-2">{item.icon}</div>
                        <span>{item.label}</span>
                      </div>
                      {theme === item.name && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="colors" className="pt-4">
              <div className="grid grid-cols-7 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setAccentColor(color.value)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2",
                      selectedColor === color.value ? "border-primary" : "border-transparent"
                    )}
                    style={{ 
                      backgroundColor: `hsl(${color.value})`,
                      color: color.foreground || 'white'
                    }}
                    title={color.name}
                  >
                    {selectedColor === color.value && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {t('theme.colorInfo', 'Theme color preferences are saved to your browser.')}
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ThemeCustomizer;
