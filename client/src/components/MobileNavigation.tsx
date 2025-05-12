import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MessageSquare, User, Search, Settings } from "lucide-react";

export function MobileNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location.startsWith(path);
  };

  return (
    <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        <Link href="/">
          <a className={cn(
            "flex flex-col items-center py-2 px-3",
            isActive("/") || isActive("/chatroom") 
              ? "text-primary-600 dark:text-primary-400" 
              : "text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          )}>
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Chats</span>
          </a>
        </Link>
        <Link href="/personas">
          <a className={cn(
            "flex flex-col items-center py-2 px-3",
            isActive("/personas")
              ? "text-primary-600 dark:text-primary-400" 
              : "text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          )}>
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Personas</span>
          </a>
        </Link>
        <Link href="/discover">
          <a className={cn(
            "flex flex-col items-center py-2 px-3",
            isActive("/discover")
              ? "text-primary-600 dark:text-primary-400" 
              : "text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          )}>
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">Discover</span>
          </a>
        </Link>
        <Link href="/settings">
          <a className={cn(
            "flex flex-col items-center py-2 px-3",
            isActive("/settings")
              ? "text-primary-600 dark:text-primary-400" 
              : "text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          )}>
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">Settings</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
