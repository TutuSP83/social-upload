
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { uploadResumableToSupabase } from '@/hooks/useResumableUpload';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showRocketAnimation, setShowRocketAnimation] = useState(false);
  const { user } = useAuth();

  // Temporary untyped DB wrapper until backend types are available
  const db = supabase as any;


  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .replace(/[^\w\-_\.]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  };

  const uploadFiles = async (filesInput: FileList | File[], currentFolder?: string | null) => {
    if (!filesInput || (filesInput as any).length === 0 || !user) {
      console.log('❌ Sem arquivos ou usuário não logado');
      toast({
        title: "Erro",
        description: !user ? "Usuário não autenticado" : "Nenhum arquivo selecionado",
        variant: "destructive"
      });
      return false;
    }

    console.log('✅ Iniciando upload. Usuário:', user.id);
    console.log('📁 Pasta atual:', currentFolder);
    
    setUploading(true);
    setProgress(0);
    setShowRocketAnimation(true);
    
    const files = Array.from(filesInput as any) as File[];
    const totalFiles = files.length;
    let uploadedCount = 0;
    let hasErrors = false;
    console.log(`📤 Iniciando upload de ${totalFiles} arquivo(s):`);
    
    // Log detalhado de cada arquivo antes do upload
    files.forEach((file, index) => {
      console.log(`📋 Arquivo ${index + 1}:`);
      console.log(`  - Nome: ${file.name}`);
      console.log(`  - Tipo: ${file.type}`);
      console.log(`  - Tamanho: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`  - É vídeo: ${file.type.startsWith('video/')}`);
    });

    try {
      for (const file of files) {
        console.log(`🔄 Processando arquivo ${uploadedCount + 1}/${totalFiles}: ${file.name}`);
        console.log(`📊 Tamanho: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`📁 Tipo: ${file.type}`);
        
        const sanitizedName = sanitizeFileName(file.name);
        const fileName = `${user.id}/${Date.now()}_${sanitizedName}`;
        
        console.log('🔄 Storage path:', fileName);
        
        try {
          // Verificar sessão antes do upload
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Sessão expirada. Faça login novamente.');
          }

          const fileSizeMB = file.size / (1024 * 1024);
          // Removido limite artificial de tamanho para permitir uploads grandes.
          // O tempo de envio dependerá da sua conexão e do tamanho do arquivo.
          console.log('📤 Fazendo upload para storage...');
          console.log(`📹 Detalhes do arquivo:`, {
            nome: file.name,
            tipo: file.type,
            tamanho: `${fileSizeMB.toFixed(2)} MB`,
            ehVideo: file.type.startsWith('video/'),
            pathStorage: fileName
          });
          
          console.log('🚀 Iniciando upload para Supabase Storage...');
          const startTime = Date.now();

          // Use resumable uploads (TUS) for large files or videos
          let uploadData: { path: string } | null = null;
          let uploadError: any = null;

          const useResumable = file.size > 6 * 1024 * 1024 || file.type.startsWith('video/');
          if (useResumable) {
            try {
              await uploadResumableToSupabase({
                bucket: 'uploads',
                objectName: fileName,
                file,
                accessToken: session.access_token!,
                cacheControl: 3600,
                onProgress: (bytesUploaded, bytesTotal) => {
                  const overall = Math.max(1, Math.round(((uploadedCount + bytesUploaded / bytesTotal) / totalFiles) * 100));
                  setProgress(overall);
                }
              });
              uploadData = { path: fileName };
            } catch (e) {
              uploadError = e;
            }
          } else {
            const result = await supabase.storage
              .from('uploads')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || undefined,
              });
            uploadData = result.data as any;
            uploadError = result.error;
          }
            
          const endTime = Date.now();
          console.log(`⏱️ Upload levou ${((endTime - startTime) / 1000).toFixed(2)}s`);

          if (uploadError) {
            console.error('❌ Erro detalhado no storage:', {
              error: uploadError,
              message: uploadError.message,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              path: fileName
            });

            const rawMsg = String(uploadError?.message || uploadError || '');
            // Trate erro de limite de tamanho (HTTP 413) do endpoint TUS do Supabase
            if (rawMsg.includes('response code: 413') || rawMsg.toLowerCase().includes('maximum size exceeded')) {
              const sizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
              throw new Error(
                `O arquivo (${sizeGB} GB) excede o limite de upload do servidor (erro 413). ` +
                'Reduza o tamanho (compacte/recorte) e tente novamente. Se quiser, posso habilitar compressão automática do lado do cliente.'
              );
            }

            throw new Error(`Erro no storage: ${uploadError.message}`);
          }

          console.log('✅ Upload para storage concluído:', {
            path: uploadData.path,
            fileName: file.name,
            fileType: file.type
          });

          // Save file info to database
          console.log('💾 Salvando informações no banco...');
          const dbStartTime = Date.now();
          
          const { data: fileData, error: dbError } = await db
            .from('files')
            .insert({
              name: file.name,
              path: fileName,
              type: file.type,
              size: file.size,
              user_id: user.id,
              folder_id: currentFolder || null
            })
            .select()
            .single();
            
          const dbEndTime = Date.now();
          console.log(`💾 Salvamento no banco levou ${dbEndTime - dbStartTime}ms`);

          if (dbError) {
            console.error('❌ Erro no banco:', dbError);
            
            // Limpar arquivo do storage se falhou no banco
            try {
              await supabase.storage.from('uploads').remove([fileName]);
              console.log('🧹 Arquivo removido do storage após erro no banco');
            } catch (cleanupError) {
              console.error('❌ Erro ao limpar:', cleanupError);
            }
            
            throw new Error(`Erro no banco: ${dbError.message}`);
          }

          console.log('✅ Arquivo salvo no banco:', (fileData as any)?.id);
          uploadedCount++;
          
          // Update progress
          const progressValue = Math.round((uploadedCount / totalFiles) * 100);
          setProgress(progressValue);
          console.log(`📊 Progresso: ${progressValue}%`);
          
        } catch (fileError) {
          console.error(`❌ Erro no arquivo ${file.name}:`, fileError);
          hasErrors = true;
          
          toast({
            title: "Erro no upload",
            description: `${file.name}: ${fileError instanceof Error ? fileError.message : 'Erro desconhecido'}`,
            variant: "destructive"
          });
        }
      }
    } catch (generalError) {
      console.error('❌ Erro geral no upload:', generalError);
      hasErrors = true;
      
      toast({
        title: "Erro no processo de upload",
        description: generalError instanceof Error ? generalError.message : 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setProgress(0);
      
      // Esconder animação após alguns segundos
      setTimeout(() => {
        setShowRocketAnimation(false);
      }, 3000);
    }

    if (uploadedCount > 0) {
      console.log(`✅ Upload concluído: ${uploadedCount}/${totalFiles} arquivos`);
      toast({
        title: "Upload concluído",
        description: `${uploadedCount} arquivo(s) enviado(s) com sucesso${hasErrors ? ' (alguns com erro)' : ''}`
      });
    } else if (hasErrors) {
      console.log('❌ Falha total no upload');
      toast({
        title: "Falha no upload",
        description: "Nenhum arquivo foi enviado com sucesso",
        variant: "destructive"
      });
    }

    return uploadedCount > 0;
  };

  return {
    uploadFiles,
    uploading,
    progress,
    showRocketAnimation
  };
};
