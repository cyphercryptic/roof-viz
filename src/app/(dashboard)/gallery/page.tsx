'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BeforeAfterSlider } from '@/components/visualize/BeforeAfterSlider';
import { Input } from '@/components/ui/input';
import {
  Image as ImageIcon, Clock, CheckCircle, XCircle, Loader2,
  Share2, Link2, Check, Search, FolderOpen, ArrowLeft,
  GitCompareArrows, ChevronLeft, ChevronRight, Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { canShare } from '@/lib/plan-features';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Visualization, Product } from '@/types';
import NextImage from 'next/image';

interface VisualizationWithProduct extends Visualization {
  products: Product;
}

interface Project {
  key: string;
  customerName: string;
  customerAddress: string;
  visualizations: VisualizationWithProduct[];
  latestDate: string;
}

type View = 'projects' | 'detail';

export default function GalleryPage() {
  const [visualizations, setVisualizations] = useState<VisualizationWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [plan, setPlan] = useState<string>('');

  // Navigation
  const [view, setView] = useState<View>('projects');
  const [activeProjectKey, setActiveProjectKey] = useState<string | null>(null);

  // Single visualization modal
  const [selectedViz, setSelectedViz] = useState<VisualizationWithProduct | null>(null);

  // Compare mode (up to 3 selections)
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelections, setCompareSelections] = useState<VisualizationWithProduct[]>([]);
  const [compareIndex, setCompareIndex] = useState(0);

  // Share state
  const [sharing, setSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const { profile } = useUser();

  useEffect(() => {
    loadVisualizations();
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadVisualizations() {
    if (!profile) return;

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .single();
    if (sub) setPlan(sub.plan);

    let query = supabase
      .from('visualizations')
      .select('*, products(*)')
      .order('created_at', { ascending: false });

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

  // Group visualizations into projects.
  // If customer name+address are both present, group by those (same customer = same project).
  // Otherwise fall back to original_image_path (same upload session).
  const projects = useMemo(() => {
    const groups: Record<string, Project> = {};

    for (const viz of visualizations) {
      if (viz.status !== 'completed') continue;

      // Use customer name+address as the grouping key when available,
      // otherwise fall back to the uploaded photo path
      const hasCustomerInfo = viz.customer_name?.trim() && viz.customer_address?.trim();
      const key = hasCustomerInfo
        ? `customer::${viz.customer_name!.trim().toLowerCase()}::${viz.customer_address!.trim().toLowerCase()}`
        : `path::${viz.original_image_path}`;

      if (!groups[key]) {
        groups[key] = {
          key,
          customerName: viz.customer_name || 'Untitled Project',
          customerAddress: viz.customer_address || '',
          visualizations: [],
          latestDate: viz.created_at,
        };
      }
      // Update project name/address if this viz has better info
      if (viz.customer_name && groups[key].customerName === 'Untitled Project') {
        groups[key].customerName = viz.customer_name;
      }
      if (viz.customer_address && !groups[key].customerAddress) {
        groups[key].customerAddress = viz.customer_address;
      }
      groups[key].visualizations.push(viz);
    }

    return Object.values(groups).sort(
      (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    );
  }, [visualizations]);

  // Filter projects by search
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter((p) =>
      p.customerName.toLowerCase().includes(q) ||
      p.customerAddress.toLowerCase().includes(q) ||
      p.visualizations.some(
        (v) =>
          v.products?.name?.toLowerCase().includes(q) ||
          v.products?.brand?.toLowerCase().includes(q) ||
          v.products?.color?.toLowerCase().includes(q)
      )
    );
  }, [projects, searchQuery]);

  const activeProject = projects.find((p) => p.key === activeProjectKey) || null;

  function openProject(project: Project) {
    setActiveProjectKey(project.key);
    setView('detail');
    setCompareMode(false);
    setCompareSelections([]);
    setCompareIndex(0);
  }

  function backToProjects() {
    setView('projects');
    setActiveProjectKey(null);
    setCompareMode(false);
    setCompareSelections([]);
    setCompareIndex(0);
  }

  function toggleCompareSelect(viz: VisualizationWithProduct) {
    if (!compareMode) return;

    const existing = compareSelections.findIndex((v) => v.id === viz.id);
    if (existing >= 0) {
      // Deselect
      const updated = compareSelections.filter((v) => v.id !== viz.id);
      setCompareSelections(updated);
      if (compareIndex >= updated.length && updated.length > 0) {
        setCompareIndex(updated.length - 1);
      }
    } else if (compareSelections.length < 3) {
      // Add (max 3)
      setCompareSelections([...compareSelections, viz]);
    } else {
      toast.info('Maximum 3 selections. Deselect one first.');
    }
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  // ── PROJECT DETAIL VIEW ──
  if (view === 'detail' && activeProject) {
    const completedVizs = activeProject.visualizations.filter(
      (v) => v.status === 'completed' && v.result_image_path
    );

    return (
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={backToProjects}
            className="flex items-center gap-1.5 text-sm text-brand-brown/50 hover:text-brand-brown mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{activeProject.customerName}</h1>
              {activeProject.customerAddress && (
                <p className="text-brand-brown/50">{activeProject.customerAddress}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const firstViz = activeProject.visualizations[0];
                  const params = new URLSearchParams({
                    photo: firstViz.original_image_path,
                  });
                  if (activeProject.customerName && activeProject.customerName !== 'Untitled Project') {
                    params.set('customer', activeProject.customerName);
                  }
                  if (activeProject.customerAddress) {
                    params.set('address', activeProject.customerAddress);
                  }
                  router.push(`/visualize?${params.toString()}`);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add a Visual
              </Button>
              {completedVizs.length >= 2 && (
                <Button
                  variant={compareMode ? 'default' : 'outline'}
                  onClick={() => {
                    setCompareMode(!compareMode);
                    setCompareSelections([]);
                    setCompareIndex(0);
                  }}
                  className="gap-2"
                >
                  <GitCompareArrows className="h-4 w-4" />
                  {compareMode ? 'Exit Compare' : 'Compare Products'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Compare instructions */}
        {compareMode && compareSelections.length < 2 && (
          <div className="mb-4 rounded-lg bg-brand-peach-light border border-brand-peach/30 px-4 py-3 text-sm text-brand-brown/70">
            {compareSelections.length === 0
              ? 'Select up to 3 visualizations to compare'
              : 'Select at least one more (up to 3 total)'}
          </div>
        )}

        {/* Compare viewer */}
        {compareMode && compareSelections.length >= 2 && (
          <div className="mb-6 space-y-3">
            {/* Main image with navigation arrows */}
            <div className="relative overflow-hidden rounded-xl border-2 border-brand-peach/30 shadow-lg">
              <div className="relative aspect-[4/3]">
                <NextImage
                  src={getImageUrl('visualizations', compareSelections[compareIndex].result_image_path!)}
                  alt={`${compareSelections[compareIndex].products?.name} visualization`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {/* Navigation arrows */}
              <button
                onClick={() => setCompareIndex((i) => (i - 1 + compareSelections.length) % compareSelections.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-brand-brown" />
              </button>
              <button
                onClick={() => setCompareIndex((i) => (i + 1) % compareSelections.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-brand-brown" />
              </button>
              {/* Counter */}
              <div className="absolute top-3 right-3">
                <Badge className="bg-brand-brown/70 text-white">
                  {compareIndex + 1} / {compareSelections.length}
                </Badge>
              </div>
            </div>

            {/* Product info for current */}
            <div className="text-center">
              <p className="font-semibold text-brand-brown">
                {compareSelections[compareIndex].products?.name}
              </p>
              <p className="text-sm text-brand-brown/50">
                {compareSelections[compareIndex].products?.color}
              </p>
            </div>

            {/* Dot indicators / thumbnail pills */}
            <div className="flex justify-center gap-2">
              {compareSelections.map((sel, i) => (
                <button
                  key={sel.id}
                  onClick={() => setCompareIndex(i)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    i === compareIndex
                      ? 'bg-brand-orange text-white'
                      : 'bg-brand-peach-light text-brand-brown/60 hover:bg-brand-peach'
                  )}
                >
                  {sel.products?.color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Visualization grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {completedVizs.map((viz) => {
            const selectionIndex = compareSelections.findIndex((v) => v.id === viz.id);
            const isCompareSelected = selectionIndex >= 0;

            return (
              <div
                key={viz.id}
                onClick={() =>
                  compareMode
                    ? toggleCompareSelect(viz)
                    : setSelectedViz(viz)
                }
                className={cn(
                  'relative rounded-xl overflow-hidden cursor-pointer transition-all',
                  compareMode && isCompareSelected
                    ? 'ring-3 ring-brand-orange shadow-lg scale-[1.02]'
                    : compareMode
                      ? 'opacity-70 hover:opacity-100'
                      : 'hover:shadow-md'
                )}
              >
                <div className="relative aspect-[4/3] bg-brand-peach-light">
                  <NextImage
                    src={getImageUrl('visualizations', viz.result_image_path!)}
                    alt={`${viz.products?.name} visualization`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {compareMode && isCompareSelected && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-brand-orange text-white">
                        {selectionIndex + 1}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-white">
                  <p className="font-medium text-xs truncate">{viz.products?.color}</p>
                  <p className="text-[11px] text-brand-brown/40 truncate">{viz.products?.brand}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Single visualization modal */}
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

  // ── PROJECTS LIST VIEW ──
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

      {/* Search bar */}
      {projects.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-brown/40" />
          <Input
            placeholder="Search by customer name, address, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      )}

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-brand-brown/50">
            <ImageIcon className="h-12 w-12 mb-4" />
            <p className="mb-2">No visualizations yet.</p>
            <p className="text-sm">Create your first one from the Visualize page.</p>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-brand-brown/50">
            <Search className="h-10 w-10 mb-3" />
            <p className="mb-1">No results for &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-sm">Try a different name, address, or product.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const latestViz = project.visualizations[0];
            const vizCount = project.visualizations.length;

            return (
              <Card
                key={project.key}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => openProject(project)}
              >
                {/* Thumbnail — show up to 2 stacked images for multi-viz projects */}
                <div className="relative aspect-[4/3] bg-brand-peach-light">
                  {latestViz.result_image_path ? (
                    <NextImage
                      src={getImageUrl('visualizations', latestViz.result_image_path)}
                      alt="Latest visualization"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <NextImage
                      src={getImageUrl('house-photos', latestViz.original_image_path)}
                      alt="Original house"
                      fill
                      className="object-cover opacity-50"
                      unoptimized
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="gap-1 bg-brand-brown/70 text-white">
                      <FolderOpen className="h-3 w-3" />
                      {vizCount} {vizCount === 1 ? 'viz' : 'vizs'}
                    </Badge>
                  </div>
                  {/* Stacked card effect for multi-viz projects */}
                  {vizCount > 1 && (
                    <div className="absolute -bottom-1 left-2 right-2 h-2 rounded-b-lg bg-white/50 backdrop-blur-sm border-x border-b border-brand-peach/20" />
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">
                    {project.customerName}
                  </p>
                  {project.customerAddress && (
                    <p className="text-xs text-brand-brown/50 truncate">
                      {project.customerAddress}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-brand-brown/40">
                      {new Date(project.latestDate).toLocaleDateString()}
                    </p>
                    {vizCount > 1 && (
                      <p className="text-xs text-brand-orange font-medium">
                        {vizCount} options
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
