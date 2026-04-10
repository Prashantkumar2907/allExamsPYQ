import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { getAvatarUrl, AVATAR_STYLES, type AvatarStyle } from '../../lib/avatarConfig';
import { cn } from '../../lib/utils';
import { Save, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { profile, updateProfile } = useAuthStore();
  const setPage = usePageStore((s) => s.setPage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setPage('Profile', 'Manage your account'); }, []);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>(
    AVATAR_STYLES.find((s) => profile?.avatar_url?.includes(s)) || AVATAR_STYLES[0]
  );

  async function handleSave() {
    setSaving(true);
    const avatarUrl = getAvatarUrl(avatarStyle, fullName);
    await updateProfile({
      full_name: fullName,
      phone: phone || null,
      bio: bio || null,
      avatar_url: avatarUrl,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!profile) return (
    <div className="space-y-5 animate-fade-in max-w-lg">
      <div className="h-40 rounded-2xl animate-shimmer" />
      <div className="h-48 rounded-xl animate-shimmer" />
      <div className="h-24 rounded-xl animate-shimmer" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-lg">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 via-[var(--primary)]/10 to-transparent p-5 pt-6 flex flex-col items-center text-center border border-[var(--border)]">
        <Avatar name={fullName} src={getAvatarUrl(avatarStyle, fullName)} size="lg" />
        <h1 className="text-xl font-bold text-[var(--fg)] mt-3">{fullName}</h1>
        <p className="text-xs text-[var(--fg-muted)] mt-0.5">{profile.email} · Admin</p>
      </div>

      {/* Personal Info */}
      <Card className="space-y-4">
        <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Personal Information</p>
        <Input id="admin-name" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input id="admin-phone" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
        <Input id="admin-bio" label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Optional" />
      </Card>

      {/* Avatar Style */}
      <Card className="space-y-3">
        <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Avatar Style</p>
        <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
          {AVATAR_STYLES.map((style) => (
            <button
              key={style}
              onClick={() => setAvatarStyle(style)}
              className={cn(
                'relative rounded-xl border-2 p-1 transition-all',
                avatarStyle === style
                  ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/30 scale-105'
                  : 'border-transparent hover:border-[var(--border)]'
              )}
            >
              <img src={getAvatarUrl(style, fullName)} alt={style} className="h-10 w-10 rounded-lg" />
              {avatarStyle === style && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-[var(--primary)] rounded-full flex items-center justify-center">
                  <CheckCircle className="h-2.5 w-2.5 text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving || !fullName.trim()} className="w-full">
        {saved ? <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Saved</> : <><Save className="h-3.5 w-3.5 mr-1" /> {saving ? 'Saving...' : 'Save Changes'}</>}
      </Button>
    </div>
  );
}
