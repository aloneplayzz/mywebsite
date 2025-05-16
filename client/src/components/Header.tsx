import { Link } from "wouter";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

interface HeaderProps {
  isLoggedIn: boolean;
}

export function Header({ isLoggedIn }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="flex-shrink-0">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4C11.164 4 4 11.164 4 20C4 28.836 11.164 36 20 36C28.836 36 36 28.836 36 20C36 11.164 28.836 4 20 4ZM14.5 22C13.672 22 13 21.105 13 20C13 18.895 13.672 18 14.5 18C15.328 18 16 18.895 16 20C16 21.105 15.328 22 14.5 22ZM20.5 27C19.672 27 19 26.105 19 25C19 23.895 19.672 23 20.5 23C21.328 23 22 23.895 22 25C22 26.105 21.328 27 20.5 27ZM25.5 22C24.672 22 24 21.105 24 20C24 18.895 24.672 18 25.5 18C26.328 18 27 18.895 27 20C27 21.105 26.328 22 25.5 22Z" 
                  fill="currentColor" className="text-primary-500 dark:text-primary-400" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold">AI Persona <span className="font-serif italic text-primary-600 dark:text-primary-400">Chatroom</span></h1>
            </div>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleTheme}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>
            
            {isLoggedIn && <UserMenu />}
          </div>
        </div>
      </div>
    </header>
  );
}
