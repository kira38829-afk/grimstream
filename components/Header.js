// components/Header.js
'use client';
import { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="bg-secondary sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-accent">
          GrimStream
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-primary border border-gray-600 rounded-full py-2 px-4 pl-10 text-white focus:outline-none focus:border-accent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </form>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <Link href="/category/top-airing" className="hover:text-accent transition-colors">
              Trending
            </Link>
            <Link href="/category/recently-added" className="hover:text-accent transition-colors">
              Latest
            </Link>
          </nav>

          {/* Mobile Menu */}
          <button className="md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}