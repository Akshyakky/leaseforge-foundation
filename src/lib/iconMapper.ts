
import React from 'react';
import * as LucideIcons from 'lucide-react';

type IconSize = number | string;

/**
 * Gets a Lucide icon component by name
 * @param iconName The name of the icon
 * @param size Optional icon size
 * @returns The React component for the icon or a fallback icon
 */
export const getLucideIcon = (iconName: string | null | undefined, size: IconSize = 24): React.ReactNode => {
  if (!iconName) {
    return <LucideIcons.Circle size={size} />;
  }

  // Standardize icon name (remove spaces, make pascal case)
  const standardName = iconName
    .replace(/[-_\s.]/g, '') // Remove dashes, underscores, spaces, dots
    .replace(/^[a-z]/, match => match.toUpperCase()) // Capitalize first letter
    .replace(/[a-z][A-Z]/g, match => match); // Keep pascal case
  
  // Check if the icon exists in Lucide
  const IconComponent = (LucideIcons as any)[standardName] || (LucideIcons as any)[iconName];
  
  if (IconComponent) {
    return <IconComponent size={size} />;
  }
  
  // Fallback for common icons with different naming conventions
  const iconMap: Record<string, keyof typeof LucideIcons> = {
    'user': 'User',
    'users': 'Users',
    'dashboard': 'LayoutDashboard',
    'home': 'Home',
    'settings': 'Settings',
    'gear': 'Settings',
    'chart': 'BarChart',
    'analytics': 'LineChart',
    'graph': 'LineChart',
    'reports': 'FileBarChart',
    'list': 'List',
    'form': 'FormInput',
    'plus': 'Plus',
    'add': 'Plus',
    'edit': 'Pencil',
    'delete': 'Trash',
    'trash': 'Trash',
    'search': 'Search',
    'find': 'Search',
    'filter': 'Filter',
    'mail': 'Mail',
    'email': 'Mail',
    'calendar': 'Calendar',
    'notification': 'Bell',
    'alert': 'Bell',
    'bell': 'Bell',
    'logout': 'LogOut',
    'login': 'LogIn',
    'lock': 'Lock',
    'unlock': 'Unlock',
    'help': 'HelpCircle',
    'question': 'HelpCircle',
    'info': 'Info',
    'warning': 'AlertTriangle',
    'error': 'AlertOctagon',
    'success': 'CheckCircle',
    'check': 'Check',
    'close': 'X',
    'cancel': 'X',
    'menu': 'Menu',
    'hamburger': 'Menu',
    'file': 'File',
    'document': 'FileText',
    'upload': 'Upload',
    'download': 'Download',
    'print': 'Printer',
    'save': 'Save',
    'bookmark': 'Bookmark',
    'star': 'Star',
    'heart': 'Heart',
    'like': 'ThumbsUp',
    'dislike': 'ThumbsDown',
    'share': 'Share',
    'link': 'Link',
    'location': 'MapPin',
    'map': 'Map',
    'phone': 'Phone',
    'call': 'Phone',
    'camera': 'Camera',
    'image': 'Image',
    'photo': 'Image',
    'video': 'Video',
    'play': 'Play',
    'pause': 'Pause',
    'stop': 'Square',
    'next': 'SkipForward',
    'previous': 'SkipBack',
    'fast-forward': 'FastForward',
    'rewind': 'Rewind',
    'volume': 'Volume',
    'mute': 'VolumeX',
    'wifi': 'Wifi',
    'bluetooth': 'Bluetooth',
    'battery': 'Battery',
    'power': 'Power',
    'refresh': 'RefreshCw',
    'sync': 'RotateCw',
    'cloud': 'Cloud',
    'globe': 'Globe',
    'world': 'Globe',
    'compass': 'Compass',
    'clock': 'Clock',
    'time': 'Clock',
    'alarm': 'AlarmClock',
    'mic': 'Mic',
    'microphone': 'Mic',
    'music': 'Music',
    'note': 'FileText',
    'trash': 'Trash2',
    'bin': 'Trash2',
    'copy': 'Copy',
    'paste': 'Clipboard',
    'cut': 'Scissors',
    'archive': 'Archive',
    'folder': 'Folder',
    'directory': 'Folder',
    'tag': 'Tag',
    'tags': 'Tags',
    'layers': 'Layers',
    'grid': 'Grid',
    'columns': 'Columns',
    'rows': 'Rows',
    'layout': 'Layout',
    'sidebar': 'PanelLeft',
    'credit-card': 'CreditCard',
    'payment': 'CreditCard',
    'cart': 'ShoppingCart',
    'shop': 'ShoppingBag',
    'truck': 'Truck',
    'delivery': 'Truck',
    'package': 'Package',
    'box': 'Package',
    'gift': 'Gift',
    'percent': 'Percent',
    'dollar': 'DollarSign',
    'currency': 'DollarSign',
    'price': 'DollarSign',
    'money': 'DollarSign',
    'wallet': 'Wallet',
    'hash': 'Hash',
    'number': 'Hash',
    'id': 'Hash',
    'eye': 'Eye',
    'view': 'Eye',
    'hide': 'EyeOff',
    'lock': 'Lock',
    'unlock': 'Unlock',
    'key': 'Key',
    'password': 'Key',
    'anchor': 'Anchor',
    'attach': 'Paperclip',
    'attachment': 'Paperclip',
    'paperclip': 'Paperclip',
    'command': 'Command',
    'flag': 'Flag',
    'report': 'Flag',
    'bookmark': 'Bookmark',
    'external': 'ExternalLink',
    'link-external': 'ExternalLink',
    'arrow-up': 'ArrowUp',
    'arrow-down': 'ArrowDown',
    'arrow-left': 'ArrowLeft',
    'arrow-right': 'ArrowRight',
    'chevron-up': 'ChevronUp',
    'chevron-down': 'ChevronDown',
    'chevron-left': 'ChevronLeft',
    'chevron-right': 'ChevronRight',
    'collapse': 'ChevronUp',
    'expand': 'ChevronDown',
    'indent': 'Indent',
    'outdent': 'Outdent',
    'fullscreen': 'Maximize',
    'exit-fullscreen': 'Minimize',
    'award': 'Award',
    'badge': 'Award',
    'achievement': 'Award',
    'server': 'Server',
    'database': 'Database',
    'code': 'Code',
    'terminal': 'Terminal',
    'git': 'GitBranch',
    'branch': 'GitBranch',
    'slider': 'Sliders',
    'adjust': 'Sliders',
    'settings': 'Settings',
    'options': 'Settings',
    'preferences': 'Settings',
    'cog': 'Settings',
    'gear': 'Settings',
    'tools': 'Tool',
    'wrench': 'Tool',
    'hammer': 'Tool',
    'bulb': 'Lightbulb',
    'idea': 'Lightbulb',
    'lightbulb': 'Lightbulb',
  };
  
  // Try to find a match in the icon map
  const lowerIconName = iconName.toLowerCase();
  const mappedIconName = iconMap[lowerIconName];
  
  if (mappedIconName && (LucideIcons as any)[mappedIconName]) {
    const MappedIcon = (LucideIcons as any)[mappedIconName];
    return <MappedIcon size={size} />;
  }
  
  // Return a default icon if no match is found
  return <LucideIcons.CircleDot size={size} />;
};
