import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThemeModeToggleProps {
  className?: string;
  compact?: boolean;
}

const ThemeModeToggle = ({ className, compact = false }: ThemeModeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Light Mode" : "Dark Mode";

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "default"}
      className={className}
      aria-label={compact ? `Switch to ${label.toLowerCase()}` : undefined}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!compact && label}
    </Button>
  );
};

export default ThemeModeToggle;
