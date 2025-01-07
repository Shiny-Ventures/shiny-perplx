import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Compass, FolderKanban, Library, Download, ChevronLeft, ChevronRight, Plus, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const sidebarWidth = isCollapsed ? 'w-[60px]' : 'w-[240px]';
  
  const handleNewClick = () => {
    window.location.reload();
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        handleNewClick();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Compass, label: 'Discover', href: '/discover' },
    { icon: FolderKanban, label: 'Spaces', href: '/spaces' },
    { icon: Library, label: 'Library', href: '/library' },
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 60 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`${sidebarWidth} fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950`}
    >
      <div className="flex flex-col flex-1 gap-2 p-3">
        {/* Logo and Collapse Button */}
        <div className="flex items-center justify-between h-12 mb-2">
          {!isCollapsed ? (
            <Link href="/" className="flex items-center">
              <Image
                src="/shiny-logo-black-small-rgb.png"
                alt="ShinyPerplx Logo"
                width={40}
                height={40}
                className="dark:invert"
              />
            </Link>
          ) : (
            <Link href="/" className="flex items-center justify-center w-full">
              <Image
                src="/shiny-logo-black-small-rgb.png"
                alt="ShinyPerplx Logo"
                width={30}
                height={30}
                className="dark:invert"
              />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isCollapsed ? 'absolute right-2' : ''}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* New Button */}
        <Button
          onClick={handleNewClick}
          variant="ghost"
          className={`w-full justify-start gap-2 ${
            isCollapsed ? 'px-2 justify-center' : 'px-3'
          } text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800`}
        >
          <Plus className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span>New</span>
              <span className="ml-auto text-xs text-neutral-500">⌘K</span>
            </>
          )}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="default"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`w-full ${
            isCollapsed ? 'px-2 justify-center' : 'px-3 justify-start'
          } text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800`}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          {!isCollapsed && <span className="ml-2">Toggle theme</span>}
        </Button>

        {/* Download Button at Bottom */}
        <div className="mt-auto">
          <Button
            variant="outline"
            className={`w-full ${
              isCollapsed ? 'px-2' : 'px-4'
            } border-neutral-200 dark:border-neutral-800`}
          >
            <Download className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Download</span>}
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 