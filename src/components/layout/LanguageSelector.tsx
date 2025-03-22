import React from "react";
import { useTranslation } from "react-i18next";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setLanguage } from "@/features/ui/uiSlice";

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className }) => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector((state) => state.ui.language);

  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    dispatch(setLanguage(languageCode));
  };

  // Find current language label
  const currentLanguageLabel = languages.find((lang) => lang.code === currentLanguage)?.label || "English";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("flex items-center gap-2", className)}>
          <Globe className="h-5 w-5" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={cn("flex items-center cursor-pointer", language.code === currentLanguage && "font-medium bg-accent")}
          >
            {language.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
