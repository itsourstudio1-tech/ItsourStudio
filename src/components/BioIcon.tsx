
import {
    Calendar, Camera, Star, Link, MessageCircle, MapPin,
    Mail, Music, Video, ShoppingCart, DollarSign, User,
    Home, HelpCircle, Flame, Globe, Instagram, Facebook,
    Twitter, Youtube, Linkedin, Twitch, Github, Heart,
    Smartphone, Search, Menu, X, Check, QrCode,
    // New Additions
    Briefcase, FileText, Phone, Printer, PieChart, TrendingUp,
    Image, Film, Headphones, Mic, Palette, Aperture,
    Coffee, Gift, Smile, Sun, Moon, Zap,
    Code, Terminal, Cpu, Database, Server, Wifi,
    ArrowRight, ExternalLink, Download, Upload,
    Send, Share2, Bell, BookOpen, Clock, Cloud,
    Compass, CreditCard, Edit, Eye, Flag, Folder,
    Grid, Hash, Info, Layers, Layout, LifeBuoy,
    Lock, Maximize, Minimize, Monitor, MoreHorizontal,
    Navigation, Package, Paperclip, Play, Plus, Power,
    Radio, RefreshCw, Save, Settings, Shield, Slash,
    Sliders, Tag, ThumbsUp, Truck, Tv, Umbrella,
    Unlock, Volume2, Watch
} from 'lucide-react';

export const VALID_ICONS = [
    // Standard
    'Calendar', 'Camera', 'Star', 'Link', 'MessageCircle', 'MapPin',
    'Mail', 'Music', 'Video', 'ShoppingCart', 'DollarSign', 'User',
    'Home', 'HelpCircle', 'Flame', 'Globe', 'Heart', 'Search', 'QrCode',
    // Socials
    'Instagram', 'Facebook', 'Twitter', 'Youtube', 'Linkedin', 'Twitch', 'Github',
    // Business & Office
    'Briefcase', 'FileText', 'Phone', 'Printer', 'PieChart', 'TrendingUp',
    // Creative
    'Image', 'Film', 'Headphones', 'Mic', 'Palette', 'Aperture',
    // Lifestyle
    'Coffee', 'Gift', 'Smile', 'Sun', 'Moon', 'Zap', 'Umbrella', 'Watch',
    // Tech
    'Code', 'Terminal', 'Cpu', 'Database', 'Server', 'Wifi', 'Smartphone', 'Monitor', 'Tv',
    // Actions & Nav
    'ArrowRight', 'ExternalLink', 'Download', 'Upload', 'Send', 'Share2', 'Bell',
    'Edit', 'Eye', 'Flag', 'Folder', 'Grid', 'Hash', 'Info', 'Layers', 'Layout',
    'LifeBuoy', 'Lock', 'Maximize', 'Minimize', 'MoreHorizontal', 'Navigation',
    'Package', 'Paperclip', 'Play', 'Plus', 'Power', 'Radio', 'RefreshCw',
    'Save', 'Settings', 'Shield', 'Slash', 'Sliders', 'Tag', 'ThumbsUp',
    'Truck', 'Unlock', 'Volume2', 'BookOpen', 'Clock', 'Cloud', 'Compass', 'CreditCard'
].sort();

interface BioIconProps {
    name: string;
    className?: string;
    size?: number;
}

const BioIcon = ({ name, className, size = 20 }: BioIconProps) => {
    const icons: any = {
        Calendar, Camera, Star, Link, MessageCircle, MapPin,
        Mail, Music, Video, ShoppingCart, DollarSign, User,
        Home, HelpCircle, Flame, Globe, Instagram, Facebook,
        Twitter, Youtube, Linkedin, Twitch, Github, Heart,
        Smartphone, Search, Menu, X, Check, QrCode,
        Briefcase, FileText, Phone, Printer, PieChart, TrendingUp,
        Image, Film, Headphones, Mic, Palette, Aperture,
        Coffee, Gift, Smile, Sun, Moon, Zap,
        Code, Terminal, Cpu, Database, Server, Wifi,
        ArrowRight, ExternalLink, Download, Upload,
        Send, Share2, Bell, BookOpen, Clock, Cloud,
        Compass, CreditCard, Edit, Eye, Flag, Folder,
        Grid, Hash, Info, Layers, Layout, LifeBuoy,
        Lock, Maximize, Minimize, Monitor, MoreHorizontal,
        Navigation, Package, Paperclip, Play, Plus, Power,
        Radio, RefreshCw, Save, Settings, Shield, Slash,
        Sliders, Tag, ThumbsUp, Truck, Tv, Umbrella,
        Unlock, Volume2, Watch
    };

    const IconComponent = icons[name] || icons['Link'];

    return <IconComponent className={className} size={size} />;
};

export default BioIcon;
