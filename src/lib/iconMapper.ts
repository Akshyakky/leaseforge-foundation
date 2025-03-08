import * as LucideIcons from 'lucide-react';
import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Maps string icon names from the API to Lucide React components
 * If an exact match isn't found, tries to find a similar icon
 * Falls back to CircleIcon if no match is found
 */
export function mapIconToComponent(iconName: string | null | undefined): LucideIcon {
  if (!iconName) {
    return LucideIcons.CircleIcon;
  }

  // Remove common prefixes/suffixes and convert to lowercase for more flexible matching
  const normalizedName = iconName
    .replace(/\.(svg|png|jpg|jpeg)$/i, '')
    .replace(/^(fa-|bi-|icon-|ui-|lucide-)/i, '')
    .toLowerCase();

  // Direct mapping for exact matches (case insensitive)
  const directMatch = Object.keys(LucideIcons).find(
    key => key.toLowerCase().replace(/icon$/, '') === normalizedName
  );

  if (directMatch) {
    return LucideIcons[directMatch as keyof typeof LucideIcons] as LucideIcon;
  }

  // Try finding a similar match if direct match fails
  const similarMatch = Object.keys(LucideIcons).find(
    key => key.toLowerCase().includes(normalizedName)
  );

  if (similarMatch) {
    return LucideIcons[similarMatch as keyof typeof LucideIcons] as LucideIcon;
  }

  // Common icon name mappings (add more as needed)
  const iconMappings: Record<string, keyof typeof LucideIcons> = {
    // Dashboard related
    'dashboard': 'LayoutDashboardIcon',
    'analytics': 'BarChartIcon',
    'chart': 'PieChartIcon',
    'statistics': 'LineChartIcon',
    'metrics': 'BarChart4Icon',
    'overview': 'LayoutDashboardIcon',
    
    // User/Account related
    'user': 'UserIcon',
    'users': 'UsersIcon',
    'person': 'UserIcon',
    'profile': 'UserCircleIcon',
    'account': 'UserIcon',
    'customer': 'UserIcon',
    'customers': 'UsersIcon',
    'team': 'UsersIcon',
    'staff': 'UsersIcon',
    'employee': 'UserIcon',
    'employees': 'UsersIcon',
    'admin': 'ShieldIcon',
    
    // Settings related
    'settings': 'SettingsIcon',
    'gear': 'SettingsIcon',
    'config': 'SettingsIcon',
    'preferences': 'SettingsIcon',
    'configure': 'SettingsIcon',
    'options': 'SettingsIcon',
    
    // Communication
    'message': 'MessageSquareIcon',
    'messages': 'MessagesSquareIcon',
    'chat': 'MessageCircleIcon',
    'mail': 'MailIcon',
    'email': 'MailIcon',
    'inbox': 'InboxIcon',
    'notification': 'BellIcon',
    'notifications': 'BellIcon',
    'alert': 'BellIcon',
    'alerts': 'BellIcon',
    
    // Files/Documents
    'file': 'FileIcon',
    'files': 'FilesIcon',
    'document': 'FileTextIcon',
    'documents': 'FilesIcon',
    'folder': 'FolderIcon',
    'folders': 'FoldersIcon',
    'attachment': 'PaperclipIcon',
    
    // Calendar/Time
    'calendar': 'CalendarIcon',
    'date': 'CalendarIcon',
    'schedule': 'CalendarIcon',
    'time': 'ClockIcon',
    'clock': 'ClockIcon',
    'history': 'HistoryIcon',
    'timeline': 'GanttChartIcon',
    
    // Commerce
    'cart': 'ShoppingCartIcon',
    'shop': 'ShoppingBagIcon',
    'store': 'StoreIcon',
    'purchase': 'ShoppingCartIcon',
    'payment': 'CreditCardIcon',
    'card': 'CreditCardIcon',
    'money': 'DollarSignIcon',
    'currency': 'DollarSignIcon',
    'dollar': 'DollarSignIcon',
    'euro': 'EuroIcon',
    'pound': 'PoundSterlingIcon',
    'bitcoin': 'BitcoinIcon',
    'tag': 'TagIcon',
    'tags': 'TagsIcon',
    'price': 'TagIcon',
    'discount': 'PercentIcon',
    'sale': 'TagIcon',
    'offer': 'TagIcon',
    
    // Location
    'location': 'MapPinIcon',
    'map': 'MapIcon',
    'address': 'MapPinIcon',
    'navigation': 'CompassIcon',
    'directions': 'MapIcon',
    
    // Media
    'image': 'ImageIcon',
    'photo': 'ImageIcon',
    'picture': 'ImageIcon',
    'gallery': 'ImagesIcon',
    'video': 'VideoIcon',
    'camera': 'CameraIcon',
    'music': 'MusicIcon',
    'audio': 'AudioLinesIcon',
    'play': 'PlayIcon',
    'pause': 'PauseIcon',
    
    // Social
    'share': 'ShareIcon',
    'like': 'ThumbsUpIcon',
    'dislike': 'ThumbsDownIcon',
    'heart': 'HeartIcon',
    'favorite': 'StarIcon',
    'bookmark': 'BookmarkIcon',
    
    // Security
    'lock': 'LockIcon',
    'unlock': 'UnlockIcon',
    'security': 'ShieldIcon',
    'key': 'KeyIcon',
    'password': 'KeyIcon',
    'fingerprint': 'FingerprintIcon',
    
    // Miscellaneous
    'home': 'HomeIcon',
    'search': 'SearchIcon',
    'plus': 'PlusIcon',
    'add': 'PlusIcon',
    'minus': 'MinusIcon',
    'remove': 'MinusIcon',
    'delete': 'TrashIcon',
    'trash': 'TrashIcon',
    'edit': 'PencilIcon',
    'pencil': 'PencilIcon',
    'save': 'SaveIcon',
    'check': 'CheckIcon',
    'x': 'XIcon',
    'close': 'XIcon',
    'cancel': 'XIcon',
    'info': 'InfoIcon',
    'help': 'HelpCircleIcon',
    'warning': 'AlertTriangleIcon',
    'error': 'AlertCircleIcon',
    'flag': 'FlagIcon',
    'star': 'StarIcon',
    'stars': 'StarsIcon',
    'menu': 'MenuIcon',
    'hamburger': 'MenuIcon',
    'list': 'ListIcon',
    'grid': 'LayoutGridIcon',
    'table': 'TableIcon',
    'refresh': 'RefreshCwIcon',
    'reload': 'RefreshCwIcon',
    'sync': 'RefreshCwIcon',
    'link': 'LinkIcon',
    'external': 'ExternalLinkIcon',
    'download': 'DownloadIcon',
    'upload': 'UploadIcon',
    'print': 'PrinterIcon',
    'filter': 'FilterIcon',
    'sort': 'ArrowUpDownIcon',
    'sliders': 'SlidersIcon',
    'adjust': 'SlidersIcon',
    'copy': 'CopyIcon',
    'paste': 'ClipboardIcon',
    'clipboard': 'ClipboardIcon',
    'phone': 'PhoneIcon',
    'call': 'PhoneIcon',
    'mobile': 'SmartphoneIcon',
    'tablet': 'TabletIcon',
    'laptop': 'LaptopIcon',
    'desktop': 'MonitorIcon',
    'server': 'ServerIcon',
    'cloud': 'CloudIcon',
    'database': 'DatabaseIcon',
    'code': 'CodeIcon',
    'terminal': 'TerminalIcon',
    'globe': 'GlobeIcon',
    'world': 'GlobeIcon',
    'language': 'GlobeIcon',
    'translate': 'Languages',
    'wifi': 'WifiIcon',
    'bluetooth': 'BluetoothIcon',
    'battery': 'BatteryIcon',
    'power': 'PowerIcon',
    'lightbulb': 'LightbulbIcon',
    'idea': 'LightbulbIcon',
    'box': 'PackageIcon',
    'package': 'PackageIcon',
    'gift': 'GiftIcon',
    'truck': 'TruckIcon',
    'shipping': 'TruckIcon',
    'delivery': 'TruckIcon',

    // Module specific
    'sales': 'TrendingUpIcon',
    'leads': 'UsersIcon',
    'finance': 'LandmarkIcon',
    'inventory': 'PackageIcon',
    'hr': 'UserPlusIcon',
    'reports': 'FileTextIcon',
    'module': 'BoxIcon',
    'project': 'FolderKanbanIcon',
    'task': 'CheckSquareIcon',
    'ticket': 'TicketIcon',
    'support': 'HeadphonesIcon',
    'crm': 'UsersIcon',
    'erp': 'BoxesIcon',
    'billing': 'ReceiptIcon',
    'invoice': 'ReceiptIcon',
    'product': 'PackageIcon',
    'service': 'WrenchIcon',
    'vendor': 'BuildingIcon',
    'supplier': 'TruckIcon',
    'partner': 'UsersIcon',
    'contract': 'FileTextIcon',
    'lease': 'FileTextIcon',
    'agreement': 'FileTextIcon',
    'asset': 'BuildingIcon',
    'property': 'BuildingIcon',
    'maintenance': 'WrenchIcon',
    'repair': 'WrenchIcon',
    'workflow': 'GitBranchIcon',
    'automation': 'ZapIcon',
    'template': 'FileIcon',
    'form': 'FormInputIcon',
  };

  // Check if we have a mapping for this icon
  if (normalizedName in iconMappings) {
    const mappedIcon = iconMappings[normalizedName];
    return LucideIcons[mappedIcon] as LucideIcon;
  }

  // Last resort - return a generic icon
  return LucideIcons.CircleIcon;
}

// Add this function as an alias to maintain backward compatibility
export const getLucideIcon = (iconName: string | null | undefined, size?: number) => {
  const Icon = mapIconToComponent(iconName);
  return Icon ? React.createElement(Icon, { size }) : null;
};
