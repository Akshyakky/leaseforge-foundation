import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  PlusCircle,
  FileText,
  Download,
  Printer,
  Edit,
  Trash,
  Eye,
  FileSpreadsheet,
  Search
} from 'lucide-react';
import { DataTable, Column, RowAction } from '@/components/data-display/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ItemModal } from '@/components/modules/ItemModal';
import { generateFakeData } from '@/lib/fakeData';
import { generatePdf } from '@/lib/pdfGenerator';
import { generateExcel } from '@/lib/excelGenerator';

export interface Item {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'discontinued';
  lastUpdated: string;
}

const SampleModule = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['items'],
    queryFn: () => generateFakeData(50),
  });

  const filteredItems = searchQuery
    ? items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  const columns: Column<Item>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      enableSorting: true,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      enableSorting: true,
    },
    {
      header: 'Category',
      accessorKey: 'category',
      enableSorting: true,
    },
    {
      header: 'Price',
      accessorKey: 'price',
      cell: ({ row }) => `$${row.price.toFixed(2)}`,
      enableSorting: true,
    },
    {
      header: 'Stock',
      accessorKey: 'stock',
      enableSorting: true,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const getStatusStyles = () => {
          switch (row.status) {
            case 'active':
              return 'bg-green-100 text-green-800';
            case 'inactive':
              return 'bg-amber-100 text-amber-800';
            case 'discontinued':
              return 'bg-red-100 text-red-800';
            default:
              return 'bg-gray-100 text-gray-800';
          }
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      header: 'Last Updated',
      accessorKey: 'lastUpdated',
      enableSorting: true,
    },
  ];

  const rowActions: RowAction<Item>[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row) => handleViewItem(row),
    },
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row) => handleEditItem(row),
    },
    {
      label: 'Delete',
      icon: <Trash className="h-4 w-4" />,
      onClick: (row) => handleDeleteItem(row),
    },
  ];

  const handleAddItem = () => {
    setModalMode('create');
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleViewItem = (item: Item) => {
    setModalMode('view');
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setModalMode('edit');
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (item: Item) => {
    toast.warning(`This would delete item: ${item.name}`, {
      description: "This is just a demo, so no actual deletion occurs.",
      action: {
        label: "Undo",
        onClick: () => toast.success("Deletion canceled"),
      },
    });
  };

  const handleCreateOrUpdateItem = (item: Item) => {
    if (modalMode === 'create') {
      toast.success(`Created: ${item.name}`, {
        description: "New item successfully added.",
      });
    } else {
      toast.success(`Updated: ${item.name}`, {
        description: "Item successfully updated.",
      });
    }
    setIsModalOpen(false);
    refetch();
  };

  const handleExportPdf = () => {
    generatePdf(filteredItems, columns);
    toast.success("PDF export started", {
      description: "Your file will download shortly.",
    });
  };

  const handleExportExcel = () => {
    generateExcel(filteredItems, 'items-export');
    toast.success("Excel export started", {
      description: "Your file will download shortly.",
    });
  };

  const handlePrint = () => {
    toast.success("Print job sent", {
      description: "Opening print dialog...",
    });
    window.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Inventory Management</h1>
        <p className="text-muted-foreground">
          Manage your products, track inventory, and handle stock levels.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-8 w-full sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleAddItem}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Item
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredItems}
        columns={columns}
        isLoading={isLoading}
        rowActions={rowActions}
        pagination={{
          pageSize: 10,
          pageIndex: 0,
          pageCount: Math.ceil(filteredItems.length / 10),
          onPageChange: () => {},
        }}
      />

      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateOrUpdateItem}
        item={selectedItem}
        mode={modalMode}
      />
    </div>
  );
};

export default SampleModule;
