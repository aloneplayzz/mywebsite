import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Sidebar from "./sidebar-fixed";

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewRoom: () => void;
  currentPage: "dashboard" | "chatroom";
}

export default function MobileMenu({ 
  isOpen,
  onToggle,
  onNewRoom,
  currentPage
}: MobileMenuProps) {
  const [openSheet, setOpenSheet] = useState(false);
  const { theme } = useTheme();
  
  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar 
              currentPage={currentPage}
              onNewRoom={() => {
                onNewRoom();
                setOpenSheet(false);
              }}
              isOpen={true}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
