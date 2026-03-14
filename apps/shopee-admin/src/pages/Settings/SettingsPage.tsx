import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'src/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Button } from 'src/components/ui/button';
import { PageHeader } from 'src/components/shared/PageHeader';
import { LoadingState } from 'src/components/shared/LoadingState';
import { ErrorState } from 'src/components/shared/ErrorState';
import { useAuthStore } from 'src/stores/auth.store';
import settingsApi from 'src/apis/settings.api';

// --- Profile Tab ---

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  date_of_birth: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

// --- Password Tab ---

const passwordSchema = z
  .object({
    password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(6, 'New password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

// --- Component ---

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>('profile');
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () => settingsApi.getProfile().then((r) => r.data.data),
  });
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name ?? '',
      phone: profile?.phone ?? '',
      address: profile?.address ?? '',
      avatar: profile?.avatar ?? '',
      date_of_birth: profile?.date_of_birth ? profile.date_of_birth.slice(0, 10) : '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', new_password: '', confirm_password: '' },
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) =>
      settingsApi.updateProfile({
        name: data.name,
        phone: data.phone || undefined,
        address: data.address || undefined,
        avatar: data.avatar || undefined,
        date_of_birth: data.date_of_birth || undefined,
      }),
    onSuccess: (res) => {
      toast.success('Profile updated');
      setUser(res.data.data);
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const changePassword = useMutation({
    mutationFn: (data: PasswordForm) =>
      settingsApi.updateProfile({ password: data.password, new_password: data.new_password }),
    onSuccess: () => {
      toast.success('Password changed');
      passwordForm.reset();
    },
    onError: () => toast.error('Failed to change password'),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load profile" onRetry={refetch} />;
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and preferences" />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))}
                className="space-y-4 max-w-lg"
              >
                <div>
                  <Label htmlFor="settings-name">Name</Label>
                  <Input id="settings-name" {...profileForm.register('name')} />
                  {profileForm.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="settings-email">Email</Label>
                  <Input id="settings-email" value={profile?.email ?? ''} disabled />
                </div>
                <div>
                  <Label htmlFor="settings-phone">Phone</Label>
                  <Input id="settings-phone" {...profileForm.register('phone')} />
                </div>
                <div>
                  <Label htmlFor="settings-address">Address</Label>
                  <Input id="settings-address" {...profileForm.register('address')} />
                </div>
                <div>
                  <Label htmlFor="settings-avatar">Avatar URL</Label>
                  <Input
                    id="settings-avatar"
                    {...profileForm.register('avatar')}
                    placeholder="https://..."
                  />
                  {profileForm.formState.errors.avatar && (
                    <p className="text-sm text-destructive mt-1">
                      {profileForm.formState.errors.avatar.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="settings-dob">Date of Birth</Label>
                  <Input id="settings-dob" type="date" {...profileForm.register('date_of_birth')} />
                </div>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))}
                className="space-y-4 max-w-lg"
              >
                <div>
                  <Label htmlFor="settings-current-pw">Current Password</Label>
                  <Input
                    id="settings-current-pw"
                    type="password"
                    {...passwordForm.register('password')}
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {passwordForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="settings-new-pw">New Password</Label>
                  <Input
                    id="settings-new-pw"
                    type="password"
                    {...passwordForm.register('new_password')}
                  />
                  {passwordForm.formState.errors.new_password && (
                    <p className="text-sm text-destructive mt-1">
                      {passwordForm.formState.errors.new_password.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="settings-confirm-pw">Confirm Password</Label>
                  <Input
                    id="settings-confirm-pw"
                    type="password"
                    {...passwordForm.register('confirm_password')}
                  />
                  {passwordForm.formState.errors.confirm_password && (
                    <p className="text-sm text-destructive mt-1">
                      {passwordForm.formState.errors.confirm_password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Application details and environment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>App Version</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">1.0.0</p>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>API Base URL</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-mono break-all">
                      {import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/'}
                    </p>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>Environment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold capitalize">{import.meta.env.MODE}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
