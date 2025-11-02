import { useState } from "react";
import { UserProfile } from "@/types/quest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Edit2, Save, X, Check } from "lucide-react";
import { toast } from "sonner";

interface ProfileEditorProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

const AVATAR_OPTIONS = [
  { id: "default", emoji: "👤", name: "Défaut" },
  { id: "wizard", emoji: "🧙‍♂️", name: "Magicien" },
  { id: "knight", emoji: "⚔️", name: "Chevalier" },
  { id: "archer", emoji: "🏹", name: "Archer" },
  { id: "mage", emoji: "🔮", name: "Mage" },
  { id: "hero", emoji: "🦸", name: "Héros" },
  { id: "ninja", emoji: "🥷", name: "Ninja" },
  { id: "robot", emoji: "🤖", name: "Robot" },
  { id: "alien", emoji: "👽", name: "Alien" },
  { id: "unicorn", emoji: "🦄", name: "Licorne" },
  { id: "dragon", emoji: "🐉", name: "Dragon" },
  { id: "phoenix", emoji: "🔥", name: "Phénix" },
];

export const getAvatarEmoji = (avatarId?: string): string => {
  const avatar = AVATAR_OPTIONS.find(a => a.id === avatarId);
  return avatar ? avatar.emoji : AVATAR_OPTIONS[0].emoji;
};

export const ProfileEditor = ({ profile, onProfileUpdate }: ProfileEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({
    username: profile.username,
    bio: profile.bio,
    avatar: profile.avatar || "default",
  });

  const handleSave = () => {
    // Validate username
    if (!editedProfile.username || editedProfile.username.trim().length < 2) {
      toast.error("Le nom d'utilisateur doit contenir au moins 2 caractères");
      return;
    }

    if (editedProfile.username!.trim().length > 20) {
      toast.error("Le nom d'utilisateur ne peut pas dépasser 20 caractères");
      return;
    }

    // Update profile
    const updatedProfile = {
      ...profile,
      username: editedProfile.username!.trim(),
      ...editedProfile,
    };

    onProfileUpdate(updatedProfile);
    setIsOpen(false);
    toast.success("Profil mis à jour avec succès!");
  };

  const handleCancel = () => {
    setEditedProfile({
      username: profile.username,
      bio: profile.bio,
      avatar: profile.avatar || "default",
    });
    setIsOpen(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 hover:bg-primary/10"
        >
          <Edit2 className="h-4 w-4" />
          Éditer le profil
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Éditer le profil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Nom d'utilisateur
            </Label>
            <Input
              id="username"
              value={editedProfile.username || ""}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              className="w-full"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              2-20 caractères. Visible par les autres utilisateurs.
            </p>
          </div>

          {/* Bio Field - Future Enhancement */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">
              Bio (optionnel)
            </Label>
            <Textarea
              id="bio"
              value={editedProfile.bio || ""}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Parlez-nous un peu de vous..."
              className="w-full resize-none"
              rows={3}
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground">
              Maximum 150 caractères.
            </p>
          </div>

          {/* Avatar Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Avatar
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_OPTIONS.map((avatar) => {
                const isSelected = editedProfile.avatar === avatar.id;
                const selectedAvatar = AVATAR_OPTIONS.find(a => a.id === editedProfile.avatar);

                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleInputChange("avatar", avatar.id)}
                    className={`relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-muted bg-background hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{avatar.emoji}</div>
                    <div className="text-xs font-medium">{avatar.name}</div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg">
              <span className="text-sm text-muted-foreground">Avatar actuel:</span>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {AVATAR_OPTIONS.find(a => a.id === editedProfile.avatar)?.emoji || "👤"}
                </span>
                <span className="text-sm font-medium">
                  {AVATAR_OPTIONS.find(a => a.id === editedProfile.avatar)?.name || "Défaut"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>

            <Button
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};