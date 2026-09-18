'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Users, Mail, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Profile, Invite } from '@/types';

export default function TeamPage() {
  const { profile } = useUser();
  const supabase = createClient();
  const [members, setMembers] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [shareInviteUrl, setShareInviteUrl] = useState('');
  const [revoking, setRevoking] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteRole, setInviteRole] = useState<'rep' | 'demo'>('rep');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  const isOwner = profile?.role === 'owner';

  useEffect(() => {
    if (isAdmin) loadTeam();
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadTeam() {
    setLoading(true);
    setLoadError(false);
    try {
      const [membersResult, invitesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('tenant_id', profile!.tenant_id).order('created_at'),
        supabase.from('invites').select('*').eq('tenant_id', profile!.tenant_id).is('accepted_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }),
      ]);
      if (membersResult.error || invitesResult.error) throw new Error('Team unavailable');
      setMembers(membersResult.data || []);
      setInvites(invitesResult.data || []);
    } catch { setLoadError(true); }
    finally { setLoading(false); }
  }

  async function copyInvite(link: string) {
    setShareInviteUrl(link);
    try { await navigator.clipboard.writeText(link); toast.success('Invite link copied'); }
    catch { toast.info('Select and copy the invitation link below.'); }
  }

  async function revokeInvite(invite: Invite) {
    setRevoking(invite.id);
    try {
      const { error, data } = await supabase.from('invites').delete().eq('id', invite.id).eq('tenant_id', profile!.tenant_id).is('accepted_at', null).select('id');
      if (error || !data?.length) throw new Error('Could not revoke invitation');
      setShareInviteUrl('');
      toast.success('Invitation revoked. The seat is available again.');
      await loadTeam();
    } catch { toast.error('Could not revoke this invitation. Please refresh and try again.'); }
    finally { setRevoking(null); }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);

    try {
      const res = await fetch('/api/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to send invite');
        setInviting(false);
        return;
      }

      if (data.inviteUrl) setShareInviteUrl(data.inviteUrl);
      if (data.emailSent) {
        toast.success(`Invite sent to ${inviteEmail}`);
      } else if (data.inviteUrl) {
        // Email isn't configured (or failed) — don't pretend it went out.
        // Hand the inviter the link instead.
        try {
          await navigator.clipboard.writeText(data.inviteUrl);
          toast.success('Invite created — link copied to clipboard. Send it to them directly (email is not set up).', { duration: 8000 });
        } catch {
          toast.warning('Invite created, but the email could not be sent. Select and copy the link below to share it.', { duration: 8000 });
        }
      } else {
        toast.success(`Invite created for ${inviteEmail}`);
      }
      setInviteEmail('');
      loadTeam();
    } catch {
      toast.error('Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-brown/50">
        <Shield className="h-12 w-12 mb-4" />
        <p>Only admins can manage the team.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Management</h1>
        <p className="text-brand-brown/50">
          {isOwner ? 'Invite sales reps or demo prospects' : 'Invite sales reps to your team'}
        </p>
      </div>

      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {isOwner && inviteRole === 'demo' ? 'Invite Demo Prospect' : 'Invite Sales Rep'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Role toggle (only owner can invite demo prospects) */}
          {isOwner && (
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setInviteRole('rep')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  inviteRole === 'rep'
                    ? 'bg-brand-orange text-white'
                    : 'bg-brand-peach-light text-brand-brown/60 hover:bg-brand-peach'
                )}
              >
                Sales Rep
              </button>
              <button
                type="button"
                onClick={() => setInviteRole('demo')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  inviteRole === 'demo'
                    ? 'bg-brand-orange text-white'
                    : 'bg-brand-peach-light text-brand-brown/60 hover:bg-brand-peach'
                )}
              >
                Demo / Prospect
              </button>
            </div>
          )}
          <form onSubmit={handleInvite} className="flex gap-3">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="rep@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={inviting}>
              {inviting ? 'Sending...' : 'Send Invite'}
            </Button>
          </form>
          <p className="mt-2 text-xs text-brand-brown/50">
            {isOwner && inviteRole === 'demo'
              ? 'Share the link with your prospect. They\'ll get 5 free visualizations to try.'
              : 'Share the invite link with your rep. They\'ll create an account and join your team.'}
          </p>
        </CardContent>
      </Card>

      {shareInviteUrl && <Card><CardContent className="p-4"><Label htmlFor="invite-link">Invitation link</Label><Input id="invite-link" readOnly value={shareInviteUrl} onFocus={event => event.target.select()} className="mt-2" /></CardContent></Card>}
      {loadError && <div role="alert" className="space-y-3 rounded-lg border border-red-200 p-4"><p>We could not load your team and invitations.</p><Button variant="outline" onClick={() => void loadTeam()}>Try again</Button></div>}
      {/* Pending invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{invite.email}</p>
                  <p className="text-xs text-brand-brown/40">
                    Invited {new Date(invite.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={invite.role === 'demo' ? 'border-blue-300 text-blue-600' : ''}>
                    {invite.role === 'demo' ? 'Demo' : invite.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void copyInvite(`${window.location.origin}/invite/${invite.token}`)}
                  >
                    Copy Link
                  </Button>
                  <Button variant="ghost" size="sm" disabled={revoking !== null} onClick={() => void revokeInvite(invite)}>{revoking === invite.id ? 'Revoking…' : 'Revoke'}</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Team members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
            </div>
          ) : loadError ? <p>Team members could not be loaded.</p> : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-brand-peach-light text-brand-orange text-xs">
                      {member.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.full_name}</p>
                    <p className="text-xs text-brand-brown/40">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={member.role === 'admin' || member.role === 'owner' ? 'default' : 'secondary'}
                  className={member.role === 'demo' ? 'border-blue-300 text-blue-600 bg-blue-50' : ''}
                >
                  {member.role === 'owner' ? 'Owner' : member.role === 'demo' ? 'Demo' : member.role}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
