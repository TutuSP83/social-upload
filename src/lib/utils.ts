
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  File,
  FileSpreadsheet,
  FileCode
} from 'lucide-react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatBytes(bytes: number): string {
  return formatFileSize(bytes);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Hoje';
  } else if (diffDays === 2) {
    return 'Ontem';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} dias atrás`;
  } else {
    return date.toLocaleDateString('pt-BR');
  }
}

export function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  
  if (type.includes('image')) return Image;
  if (type.includes('video')) return Video;
  if (type.includes('audio')) return Music;
  if (type.includes('pdf') || type.includes('document')) return FileText;
  if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('zip') || type.includes('rar') || type.includes('archive') || 
      type.includes('tar') || type.includes('7z') || type.includes('gz') ||
      type.includes('x-zip') || type.includes('x-rar') || type.includes('compressed')) return Archive;
  if (type.includes('code') || type.includes('javascript') || type.includes('typescript')) return FileCode;
  
  return File;
}

// Função adicional para detectar tipos de arquivo compactado
export function isCompressedFile(fileName: string, fileType?: string): boolean {
  const name = fileName.toLowerCase();
  const type = (fileType || '').toLowerCase();
  
  const compressedExtensions = ['.rar', '.zip', '.7z', '.tar', '.gz', '.bz2', '.xz'];
  const compressedTypes = ['zip', 'rar', 'archive', 'compressed', 'x-zip', 'x-rar'];
  
  return compressedExtensions.some(ext => name.endsWith(ext)) ||
         compressedTypes.some(t => type.includes(t));
}

// Função para identificar o tipo específico de arquivo compactado
export function getArchiveType(fileName: string, fileType?: string): string {
  const name = fileName.toLowerCase();
  const type = (fileType || '').toLowerCase();
  
  if (name.endsWith('.rar') || type.includes('rar')) return 'RAR';
  if (name.endsWith('.zip') || type.includes('zip')) return 'ZIP';
  if (name.endsWith('.7z')) return '7Z';
  if (name.endsWith('.tar')) return 'TAR';
  if (name.endsWith('.gz')) return 'GZIP';
  if (name.endsWith('.bz2')) return 'BZIP2';
  if (name.endsWith('.xz')) return 'XZ';
  
  return 'COMPACTADO';
}
