'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BeforeAfterSlider } from '@/components/visualize/BeforeAfterSlider';
import { Image as ImageIcon, Clock, CheckCircle, XCircle, Loader2, Share2, Link2, Check } from 'lucide-react';
import { canShare } from '@/lib/plan-features';
import { toast } from 'sonner';
import type { Visualization, Product } from '@/types';
import NextImage from 'next/image';

interface VisualizationWithProduct extends Visualization {
  products: Product;
}

export default function GalleryPage() {
  const [visualizations, setVisualizations] = useState<VisualizationWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViz, setSelectedViz] = useState<VisualizationWithProduct | null>(null);
  const [plan, setPlan] = useState<string>('');
  const [sharing, setSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const supabase = createClient();
  const { profile } = useUser();

  useEffect(() => {
    loadVisualizations();
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadVisualizations() {
    // Wait for profile to load so we know if we need to filter
    if (!profile) return;

    // Fetch subscription plan
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .single();
    if (sub) setPlan(sub.plan);

    let query = supabase
      .from('visualizations')
      .select('*, products(*)')
      .order('created_at', { ascending: false });

    // Non-admin users only see their own visualizations
    // Admins and owners see all visualizations across their team
    if (profile.role !== 'admin' && profile.role !== 'owner') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        query = query.eq('created_by', user.id);
      }
    }

    const { data, error } = await query;

    if (!error && data) {
      setVisualizations(data as VisualizationWithProduct[]);
    }
    setLoading(false);
  }

  async function handleShare(vizId: string) {
    setSharing(true);
    setCopiedLink(false);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visualization_id: vizId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const shareUrl = `${window.location.origin}/share/${data.token}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success('Share link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create share link');
    } finally {
      setSharing(false);
    }
  }

  function getImageUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  function statusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-brand-orange animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-brand-brown/40" />;
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Visualization Gallery</h1>
        <p className="text-brand-brown/50">
          {profile?.role === 'admin' || profile?.role === 'owner'
            ? 'All past roof visualizations for your team'
            : 'Your roof visualizations'}
        </p>
      </div>

      {visualizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-brand-brown/50">
            <ImageIcon className="h-12 w-12 mb-4" />
            <p className="mb-2">No visualizations yet.</p>
            <p className="text-sm">Create your first one from the Visualize page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visualizations.map((viz) => (
            <Card
              key={viz.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => viz.status === 'completed' && setSelectedViz(viz)}
            >
              <div className="relative aspect-[4/3] bg-brand-peach-light">
                {viz.result_image_path ? (
                  <NextImage
                    src={getImageUrl('visualizations', viz.result_image_path)}
                    alt="Visualization result"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <NextImage
                    src={getImageUrl('house-photos', viz.original_image_path)}
                    alt="Original house"
                    fill
                    className="object-cover opacity-50"
                    unoptimized
                  />
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={viz.status === 'completed' ? 'default' : 'secondary'} className="gap-1">
                    {statusIcon(viz.status)}
                    {viz.status}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">
                  {viz.products?.name || 'Unknown Product'}
                </p>
                <p className="text-xs text-brand-brown/50">
                  {viz.products?.brand} - {viz.products?.color}
                </p>
                {viz.customer_name && (
                  <p className="text-xs text-brand-brown/40 mt-1">{viz.customer_name}</p>
                )}
                <p className="text-xs text-brand-brown/40 mt-1">
                  {new Date(viz.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Before/After modal */}
      <Dialog open={!!selectedViz} onOpenChange={() => setSelectedViz(null)}>
        <DialogContent className="max-w-3xl p-2 sm:p-4">
          {selectedViz && selectedViz.result_image_path && (
            <div className="space-y-3">
              <BeforeAfterSlider
                beforeUrl={getImageUrl('house-photos', selectedViz.original_image_path)}
                afterUrl={getImageUrl('visualizations', selectedViz.result_image_path)}
              />
              <div className="flex justify-between items-center px-1">
                <div>
                  <p className="font-medium">{selectedViz.products?.name}</p>
                  <p className="text-sm text-brand-brown/50">
                    {selectedViz.products?.brand} - {selectedViz.products?.color}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedViz.customer_name && (
                    <div className="text-right text-sm text-brand-brown/50 mr-2">
                      <p>{selectedViz.customer_name}</p>
                      {selectedViz.customer_address && <p>{selectedViz.customer_address}</p>}
                    </div>
                  )}
                  {canShare(plan) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(selectedViz.id)}
                      disabled={sharing}
                      className="gap-1.5"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          Copied!
                        </>
                      ) : sharing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sharing...
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4" />
                          Share
                        </>
                      )}
                    </Button>
                  ) : profile?.role === 'demo' ? null : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="gap-1.5 text-brand-brown/40"
                      title="Upgrade to Pro to share visualizations"
                    >
                      <Link2 className="h-4 w-4" />
                      Share
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
