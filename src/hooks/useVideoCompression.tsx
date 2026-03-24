import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { toast } from '@/hooks/use-toast';

export interface CompressionSettings {
  resolution: '1080p' | '720p' | '480p' | '360p' | 'original';
  bitrate: 'high' | 'medium' | 'low';
}

const RESOLUTION_MAP = {
  '1080p': '1920:1080',
  '720p': '1280:720',
  '480p': '854:480',
  '360p': '640:360',
  'original': 'original'
};

const BITRATE_MAP = {
  'high': '5000k',
  'medium': '2500k',
  'low': '1000k'
};

export const useVideoCompression = () => {
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<number>(0);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const startTimeRef = useRef<number>(0);

  const loadFFmpeg = async () => {
    if (isLoaded) return;
    
    try {
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });

      ffmpeg.on('progress', ({ progress: prog }) => {
        const percentage = Math.round(prog * 100);
        setProgress(percentage);
        
        // Calculate estimated time remaining
        if (percentage > 0 && startTimeRef.current > 0) {
          const elapsed = Date.now() - startTimeRef.current;
          const total = elapsed / (percentage / 100);
          const remaining = total - elapsed;
          setEstimatedTimeLeft(Math.max(0, Math.round(remaining / 1000))); // Convert to seconds
        }
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
        workerURL: `${baseURL}/ffmpeg-core.worker.js`,
      });

      ffmpegRef.current = ffmpeg;
      setIsLoaded(true);
      console.log('✅ FFmpeg loaded successfully');
    } catch (error) {
      console.error('❌ Error loading FFmpeg:', error);
      throw new Error('Falha ao carregar FFmpeg');
    }
  };

  const compressVideo = async (
    file: File,
    settings: CompressionSettings
  ): Promise<File> => {
    try {
      setCompressing(true);
      setProgress(0);
      setEstimatedTimeLeft(0);
      setCurrentFile(file.name);
      startTimeRef.current = Date.now();

      await loadFFmpeg();
      const ffmpeg = ffmpegRef.current!;

      // Write input file
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));

      // Build FFmpeg command - PRIORIDADE: QUALIDADE DO VÍDEO
      const args = ['-i', 'input.mp4'];

      // Video codec H.264 com boa qualidade
      args.push('-c:v', 'libx264');
      
      // Threads para processamento paralelo
      args.push('-threads', '0');
      
      // Preset medium para equilíbrio entre velocidade e qualidade
      args.push('-preset', 'medium');
      
      // Resolution com scaling de alta qualidade usando lanczos
      if (settings.resolution !== 'original') {
        args.push('-vf', `scale=${RESOLUTION_MAP[settings.resolution]}:flags=lanczos`);
      }

      // CRF mais baixo = melhor qualidade (15-18 para alta qualidade)
      if (settings.bitrate === 'high') {
        args.push('-crf', '15'); // Quase lossless
        args.push('-maxrate', '8000k');
        args.push('-bufsize', '16000k');
      } else if (settings.bitrate === 'medium') {
        args.push('-crf', '18'); // Muito boa qualidade
        args.push('-maxrate', '5000k');
        args.push('-bufsize', '10000k');
      } else {
        args.push('-crf', '22'); // Boa qualidade com compressão
        args.push('-maxrate', '3000k');
        args.push('-bufsize', '6000k');
      }

      // Audio - manter qualidade AAC
      args.push('-c:a', 'aac');
      args.push('-b:a', '192k');
      
      // Otimizações para streaming web
      args.push('-movflags', '+faststart');
      args.push('-pix_fmt', 'yuv420p');
      
      // Profile para compatibilidade máxima
      args.push('-profile:v', 'high');
      args.push('-level', '4.1');

      // Saída
      args.push('output.mp4');

      console.log('🎬 Compressing with args:', args);
      await ffmpeg.exec(args);

      // Read output file
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data as any], { type: 'video/mp4' });
      
      // Clean up
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.mp4');

      const compressedFile = new File(
        [blob],
        file.name.replace(/\.[^/.]+$/, '_compressed.mp4'),
        { type: 'video/mp4' }
      );

      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
      const savings = Math.round((1 - compressedFile.size / file.size) * 100);

      console.log(`✅ Compression complete: ${originalSizeMB}MB → ${compressedSizeMB}MB (${savings}% reduction)`);

      toast({
        title: "Compressão concluída",
        description: `${originalSizeMB}MB → ${compressedSizeMB}MB (${savings}% de redução)`,
      });

      return compressedFile;
    } catch (error) {
      console.error('❌ Compression error:', error);
      toast({
        title: "Erro na compressão",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
      throw error;
    } finally {
      setCompressing(false);
      setProgress(0);
      setEstimatedTimeLeft(0);
      setCurrentFile('');
      startTimeRef.current = 0;
    }
  };

  return {
    compressVideo,
    compressing,
    progress,
    currentFile,
    estimatedTimeLeft,
    isLoaded
  };
};
