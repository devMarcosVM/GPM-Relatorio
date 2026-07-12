"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, X } from "lucide-react";

interface ListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  searchPlaceholder?: string;
  onClear?: () => void;
}

export function ListFilters({
  search,
  onSearchChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  searchPlaceholder = "Buscar por nome...",
  onClear,
}: ListFiltersProps) {
  const hasFilters = search || dateFrom || dateTo;

  return (
    <Card className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            De
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Até
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
        {onClear && (
          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            disabled={!hasFilters}
            className="w-full md:w-auto"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>
    </Card>
  );
}
