import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setTheme } from "@/features/ui/uiSlice";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Paintbrush, Monitor, Moon, Sun, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const themes = [
  {
    name: "light",
    label: "Light",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    name: "dark",
    label: "Dark",
    icon: <Moon className="h-4 w-4" />,
  },
  {
    name: "system",
    label: "System",
    icon: <Monitor className="h-4 w-4" />,
  },
];

interface ColorOption {
  name: string;
  value: string;
  foreground?: string;
  preview?: string;
}

// Predefined color options including Renexx theme
const colorOptions: ColorOption[] = [
  {
    name: "Slate",
    value: "222.2 84% 4.9%",
    preview: "hsl(222.2, 84%, 4.9%)",
  },
  {
    name: "Blue",
    value: "221.2 83% 53.9%",
    preview: "hsl(221.2, 83%, 53.9%)",
  },
  {
    name: "Indigo",
    value: "226 70% 40%",
    preview: "hsl(226, 70%, 40%)",
  },
  {
    name: "Purple",
    value: "262 80% 50%",
    preview: "hsl(262, 80%, 50%)",
  },
  {
    name: "Green",
    value: "142.1 76.2% 36.3%",
    preview: "hsl(142.1, 76.2%, 36.3%)",
  },
  {
    name: "Renexx Orange",
    value: "20 90% 50%",
    foreground: "#fff",
    preview: "hsl(20, 90%, 50%)",
  },
  {
    name: "Pink",
    value: "333 71% 51%",
    foreground: "#fff",
    preview: "hsl(333, 71%, 51%)",
  },
];

// Theme presets
const themePresets = [
  {
    name: "Default",
    description: "Clean and modern",
    colors: {
      primary: "221.2 83% 53.9%",
      accent: "217.2 91.2% 59.8%",
    },
  },
  {
    name: "Renexx",
    description: "Professional navy & orange",
    colors: {
      primary: "20 90% 50%",
      accent: "20 90% 50%",
      background: "215 28% 17%",
    },
  },
  {
    name: "Corporate",
    description: "Sophisticated slate tones",
    colors: {
      primary: "222.2 84% 4.9%",
      accent: "226 70% 40%",
    },
  },
];

const ThemeCustomizer = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.ui);
  const [activeTab, setActiveTab] = useState("theme");
  const [selectedColor, setSelectedColor] = useState(colorOptions[1].value); // Default to Renexx Orange
  const [selectedPreset, setSelectedPreset] = useState("Default");

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    dispatch(setTheme(value));
    applyTheme(value);
  };

  const applyTheme = (value: string) => {
    if (value === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else if (value === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      // Handle system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      document.documentElement.classList.toggle("light", !prefersDark);
    }
  };

  const setAccentColor = (color: string) => {
    setSelectedColor(color);
    document.documentElement.style.setProperty("--primary", color);
    document.documentElement.style.setProperty("--accent", color);
    document.documentElement.style.setProperty("--ring", color);
    // Also update localStorage to persist the preference
    localStorage.setItem("accentColor", color);
  };

  const applyThemePreset = (preset: (typeof themePresets)[0]) => {
    setSelectedPreset(preset.name);

    // Apply colors from preset
    Object.entries(preset.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });

    // Special handling for Renexx theme
    if (preset.name === "Renexx") {
      // Apply Renexx-specific styling
      document.documentElement.style.setProperty("--primary", "20 90% 50%");
      document.documentElement.style.setProperty("--accent", "20 90% 50%");
      document.documentElement.style.setProperty("--ring", "20 90% 50%");

      // If in dark mode or system prefers dark, apply Renexx navy background
      if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.style.setProperty("--background", "215 28% 17%");
        document.documentElement.style.setProperty("--card", "215 28% 17%");
        document.documentElement.style.setProperty("--popover", "215 28% 17%");
        document.documentElement.style.setProperty("--secondary", "215 25% 25%");
        document.documentElement.style.setProperty("--muted", "215 25% 25%");
        document.documentElement.style.setProperty("--border", "215 25% 25%");
        document.documentElement.style.setProperty("--input", "215 25% 25%");
      }

      setSelectedColor("20 90% 50%");
    }

    // Persist the preset selection
    localStorage.setItem("themePreset", preset.name);
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
            <h4 className="font-medium">{t("theme.customizer", "Customize")}</h4>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="theme">{t("theme.appearance", "Mode")}</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="colors">{t("theme.colors", "Colors")}</TabsTrigger>
            </TabsList>

            <TabsContent value="theme" className="pt-4">
              <div className="grid grid-cols-1 gap-2">
                {themes.map((item) => (
                  <Button
                    key={item.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleThemeChange(item.name as "light" | "dark" | "system")}
                    className={cn("justify-start w-full", theme === item.name && "border-2 border-primary bg-primary/5")}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <div className="mr-3">{item.icon}</div>
                        <span>{item.label}</span>
                      </div>
                      {theme === item.name && <Check className="h-4 w-4" />}
                    </div>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="presets" className="pt-4">
              <div className="space-y-2">
                {themePresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyThemePreset(preset)}
                    className={cn(
                      "w-full p-3 text-left border rounded-lg transition-all hover:bg-accent/5",
                      selectedPreset === preset.name ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">{preset.description}</div>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: `hsl(${preset.colors.primary})` }} />
                        {preset.colors.accent && <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: `hsl(${preset.colors.accent})` }} />}
                      </div>
                    </div>
                  </button>
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
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110",
                      selectedColor === color.value ? "border-primary shadow-renexx-glow" : "border-transparent hover:border-muted-foreground/30"
                    )}
                    style={{
                      backgroundColor: color.preview || `hsl(${color.value})`,
                      color: color.foreground || "white",
                    }}
                    title={color.name}
                  >
                    {selectedColor === color.value && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">{t("theme.colorInfo", "Color preferences are saved to your browser.")}</p>
            </TabsContent>
          </Tabs>

          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // Reset to Renexx defaults
                applyThemePreset(themePresets[1]);
              }}
            >
              Apply Renexx Theme
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ThemeCustomizer;
