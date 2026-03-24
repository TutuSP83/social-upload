import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, User, Save, Edit, X, Lock } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { DeleteAccountDialog } from './DeleteAccountDialog';

export const ProfileForm = () => {
  const { profile, updateProfile, loading, refetch } = useProfile();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    full_name: '',
    social_name: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    birth_date: ''
  });

  // Atualizar formData quando o profile mudar
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        social_name: profile.social_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        country: profile.country || '',
        state: profile.state || '',
        city: profile.city || '',
        birth_date: profile.birth_date || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar perfil",
        description: "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Restaurar dados originais
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        social_name: profile.social_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        country: profile.country || '',
        state: profile.state || '',
        city: profile.city || '',
        birth_date: profile.birth_date || ''
      });
    }
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      console.log('Sem arquivo ou usuário:', { file: !!file, user: !!user });
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho do arquivo (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);
    
    try {
      console.log('Iniciando upload de avatar:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId: user.id
      });
      
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const timestamp = Date.now();
      const fileName = `${user.id}/avatar-${timestamp}.${fileExt}`;
      
      console.log('Nome do arquivo no storage:', fileName);
      
      // Upload da nova imagem (sempre com nome único para evitar cache)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: false // Sempre criar novo arquivo
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('Upload concluído:', uploadData);

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('URL pública gerada:', urlData.publicUrl);

      // Atualizar perfil com a nova URL (adicionar timestamp para cache busting)
      const avatarUrlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await updateProfile({ 
        avatar_url: avatarUrlWithTimestamp 
      });

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        throw updateError;
      }

      console.log('Perfil atualizado com nova URL do avatar');

      // Forçar recarregamento do perfil
      await refetch();

      toast({
        title: "Avatar atualizado!",
        description: "Sua foto de perfil foi alterada com sucesso."
      });

    } catch (error: any) {
      console.error('Erro geral no upload de avatar:', error);
      
      let errorMessage = "Não foi possível atualizar a foto do perfil.";
      
      if (error.message?.includes('not found')) {
        errorMessage = "Bucket de avatares não encontrado. Contate o administrador.";
      } else if (error.message?.includes('permission')) {
        errorMessage = "Sem permissão para fazer upload. Verifique se está logado.";
      } else if (error.message?.includes('size')) {
        errorMessage = "Arquivo muito grande. Máximo 5MB.";
      }
      
      toast({
        title: "Erro ao fazer upload",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
      // Limpar o input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handlePasswordChange = async () => {
    // Validação de senha forte
    const passwordRegex = {
      minLength: /.{8,}/,
      uppercase: /[A-Z]/,
      lowercase: /[a-z]/,
      number: /[0-9]/,
      symbol: /[^A-Za-z0-9]/
    };

    if (!passwordRegex.minLength.test(passwordData.newPassword)) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter no mínimo 8 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (!passwordRegex.uppercase.test(passwordData.newPassword)) {
      toast({
        title: "Senha inválida",
        description: "A senha deve conter pelo menos uma letra maiúscula.",
        variant: "destructive"
      });
      return;
    }

    if (!passwordRegex.lowercase.test(passwordData.newPassword)) {
      toast({
        title: "Senha inválida",
        description: "A senha deve conter pelo menos uma letra minúscula.",
        variant: "destructive"
      });
      return;
    }

    if (!passwordRegex.number.test(passwordData.newPassword)) {
      toast({
        title: "Senha inválida",
        description: "A senha deve conter pelo menos um número.",
        variant: "destructive"
      });
      return;
    }

    if (!passwordRegex.symbol.test(passwordData.newPassword)) {
      toast({
        title: "Senha inválida",
        description: "A senha deve conter pelo menos um símbolo (*, #, @, etc).",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, digite a mesma senha nos dois campos.",
        variant: "destructive"
      });
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha alterada!",
        description: "Faça login novamente com sua nova senha."
      });

      await supabase.auth.signOut();
      window.location.href = '/';

      setPasswordData({ newPassword: '', confirmPassword: '' });
      setIsEditingPassword(false);
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelPasswordEdit = () => {
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setIsEditingPassword(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Avatar Section */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardTitle className="flex items-center gap-3">
            <User className="h-5 w-5" />
            Foto de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-purple-200">
                <AvatarImage 
                  src={profile?.avatar_url || ''} 
                  alt="Avatar do usuário"
                  key={`${profile?.avatar_url}-${Date.now()}`}
                  onLoad={() => console.log('Avatar carregado com sucesso')}
                  onError={(e) => {
                    console.log('Erro ao carregar avatar:', e);
                  }}
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xl font-bold">
                  {profile?.social_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{profile?.social_name || user?.email}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{profile?.email || user?.email}</p>
              
              <Button 
                variant="outline" 
                onClick={triggerFileInput}
                disabled={uploadingAvatar}
                className="relative"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingAvatar ? 'Enviando...' : 'Alterar Foto'}
              </Button>
              
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
              
              <p className="text-xs text-gray-500 mt-2">
                Formatos suportados: JPG, PNG, GIF (máx. 5MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informações do Perfil</CardTitle>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                />
              </div>
              <div>
                <Label htmlFor="social_name">Nome Social *</Label>
                <Input
                  id="social_name"
                  value={formData.social_name}
                  onChange={(e) => setFormData({ ...formData, social_name: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                />
              </div>
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                />
              </div>
            </div>

            {/* Botão Editar Senha */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Segurança</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Altere sua senha de acesso
                  </p>
                </div>
                {!isEditingPassword ? (
                  <Button onClick={() => setIsEditingPassword(true)} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleCancelPasswordEdit} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>

              {isEditingPassword && (
                <div className="mt-4 space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm mb-4">
                    <p className="font-medium mb-1">Requisitos da senha:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Mínimo de 8 caracteres</li>
                      <li>Pelo menos uma letra maiúscula</li>
                      <li>Pelo menos uma letra minúscula</li>
                      <li>Pelo menos um número</li>
                      <li>Pelo menos um símbolo (*, #, @, etc)</li>
                    </ul>
                  </div>
                  <div>
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Digite sua nova senha"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Digite novamente sua nova senha"
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type="button" onClick={handlePasswordChange} disabled={changingPassword} className="w-full md:w-auto">
                    <Lock className="h-4 w-4 mr-2" />
                    {changingPassword ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              )}
            </div>

            {isEditing && (
              <Button type="submit" disabled={saving} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="bg-red-50 dark:bg-red-900/20">
          <CardTitle className="text-red-600 dark:text-red-400">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                Excluir Conta Permanentemente
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Esta ação não pode ser desfeita. Todos os seus dados, arquivos e mensagens serão excluídos permanentemente.
              </p>
            </div>
            
            <Separator />
            
            <DeleteAccountDialog />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
