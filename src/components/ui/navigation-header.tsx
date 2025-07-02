'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { 
  Film, 
  Library, 
  User, 
  LogOut,
  Settings
} from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function NavigationHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigationItems = [
    {
      href: '/library',
      label: 'Library',
      icon: Library,
      active: pathname === '/library'
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="container mx-auto px-4 h-16 flex items-center">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
                VFS Studio
              </span>
              <span className="text-xs text-gray-400 -mt-1">AI Content Creator</span>
            </div>
          </Link>
        </div>

        {/* Navigation - Centered */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <nav className="hidden md:block">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    size="sm"
                    className={`
                      relative flex items-center space-x-2 px-4 py-2 transition-all duration-200
                      ${item.active 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-3 ml-auto">
          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-white/10 hover:border-purple-500/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-sm font-semibold">
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2 bg-gray-900/95 backdrop-blur border-white/10" align="end">
              <DropdownMenuLabel className="p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-gray-400">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="p-2 text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <Link href="/profile">
                <DropdownMenuItem className="p-2 text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 