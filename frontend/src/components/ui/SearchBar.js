import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative" data-testid="search-bar">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
      <input
        data-testid="search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 h-10 bg-neutral-900/50 border border-white/10 rounded-md text-sm
                   focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none placeholder:text-neutral-600"
      />
    </div>
  );
}
