import * as React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  FileEdit,
  Globe,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  adminDeleteCommunityGuide,
  adminDeleteUserProfile,
  AdminGuideDraftInput,
  adminSaveCommunityGuide,
  adminToggleGuidePublished,
  adminUpdateUserRecord,
  fetchAdminGuides,
  fetchAdminItineraries,
  fetchAdminUsers,
} from '../services/firestoreService';
import { LANDMARK_POLAROIDS } from '../data/destinationMedia';
import { WhiskLogo } from './WhiskLogo';
import {
  AdminUserRecord,
  BlogPost,
  MembershipTier,
  TripItinerary,
  UserRole,
} from '../../types';

type AdminSection = 'overview' | 'users' | 'guides';

interface AdminDashboardProps {
  onNavigateHome: () => void;
  onOpenPublicGuide: (post: BlogPost) => void;
}

const SECTION_META: Record<AdminSection, { label: string; description: string }> = {
  overview: {
    label: 'Usage Metrics',
    description: 'Live counts across registered travelers, generated trips, and community guides.',
  },
  users: {
    label: 'Registered Users',
    description: 'Manage administrator access, Whisk Passport tiers, and public display profiles.',
  },
  guides: {
    label: 'Community Guides',
    description: 'Create, edit, publish, or archive shared editorial field guides.',
  },
};

const TIER_OPTIONS: MembershipTier[] = ['Wanderer', 'Explorer', 'Cartographer'];

function formatShortDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Safe React-node Markdown preview renderer (no innerHTML / dangerouslySetInnerHTML)
const SafeMarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-1" />;
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-base font-bold text-[var(--whisk-navy)] pt-2">
              {line.slice(4)}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-lg font-extrabold text-[var(--whisk-navy)] pt-3">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-xl font-black text-[var(--whisk-navy)] pt-3">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
};

interface GuideEditorModalProps {
  guide: BlogPost | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: AdminGuideDraftInput) => Promise<void>;
}

const GuideEditorModal: React.FC<GuideEditorModalProps> = ({
  guide,
  saving,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = React.useState(guide?.title || '');
  const [seoTitle, setSeoTitle] = React.useState(guide?.seoTitle || '');
  const [slug, setSlug] = React.useState(guide?.slug || '');
  const [destination, setDestination] = React.useState(guide?.destination || '');
  const [imageUrl, setImageUrl] = React.useState(
    guide?.imageUrl || LANDMARK_POLAROIDS[0]?.url || '/'
  );
  const [metaDescription, setMetaDescription] = React.useState(guide?.metaDescription || '');
  const [geoSummary, setGeoSummary] = React.useState(guide?.geoSummary || '');
  const [keywordsText, setKeywordsText] = React.useState(
    (guide?.keywords || []).join(', ')
  );
  const [neighborhoodsText, setNeighborhoodsText] = React.useState(
    (guide?.neighborhoods || []).join(', ')
  );
  const [content, setContent] = React.useState(guide?.content || '');
  const [isPublished, setIsPublished] = React.useState(guide ? Boolean(guide.isPublished) : true);
  const [editorTab, setEditorTab] = React.useState<'write' | 'preview'>('write');
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !destination.trim() || !metaDescription.trim() || !content.trim()) {
      setFormError('Title, destination, meta description, and article content are required.');
      return;
    }

    const keywords = keywordsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const neighborhoods = neighborhoodsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await onSave({
        id: guide?.id,
        title: title.trim(),
        seoTitle: seoTitle.trim() || undefined,
        slug: slug.trim() || undefined,
        destination: destination.trim(),
        imageUrl: imageUrl.trim() || '/',
        metaDescription: metaDescription.trim(),
        geoSummary: geoSummary.trim() || undefined,
        keywords,
        neighborhoods,
        content: content.trim(),
        isPublished,
      });
    } catch (err: any) {
      setFormError(err?.message || 'Unable to save community guide.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={guide ? 'Edit Community Guide' : 'New Community Guide'}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[var(--whisk-navy)]">
              {guide ? 'Edit Community Guide' : 'New Community Guide'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Changes sync immediately to the shared Firestore catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Guide Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="48 Hours in Kyoto: Lantern Alleys & Tea Houses"
                maxLength={200}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Destination *
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Kyoto, Japan"
                maxLength={150}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="kyoto-lantern-alleys-guide"
                maxLength={180}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-mono text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                SEO Title (optional)
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Kyoto 2-Day Local Itinerary | Whisk"
                maxLength={120}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cover Image URL or Preset
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... or /assets/..."
                maxLength={500}
                className="flex-1 h-10 px-3 rounded-xl border border-slate-300 text-sm text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
              <select
                aria-label="Choose cover image preset"
                value=""
                onChange={(e) => {
                  if (e.target.value) setImageUrl(e.target.value);
                }}
                className="h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              >
                <option value="">Pick destination preset...</option>
                {LANDMARK_POLAROIDS.map((item) => (
                  <option key={item.name} value={item.url}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Meta Description *
            </label>
            <textarea
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              maxLength={320}
              placeholder="Concise summary displayed in community cards and search results."
              className="w-full p-3 rounded-xl border border-slate-300 text-sm text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Local / GEO Summary (optional)
            </label>
            <textarea
              rows={2}
              value={geoSummary}
              onChange={(e) => setGeoSummary(e.target.value)}
              maxLength={1200}
              placeholder="Key neighborhood highlights, timing notes, and seasonal tips."
              className="w-full p-3 rounded-xl border border-slate-300 text-sm text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                placeholder="kyoto, tea houses, gion, walking guide"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Neighborhoods (comma-separated)
              </label>
              <input
                type="text"
                value={neighborhoodsText}
                onChange={(e) => setNeighborhoodsText(e.target.value)}
                placeholder="Gion, Higashiyama, Arashiyama"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Article Body (Markdown) *
              </label>
              <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setEditorTab('write')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    editorTab === 'write'
                      ? 'bg-white text-[var(--whisk-navy)] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    editorTab === 'preview'
                      ? 'bg-white text-[var(--whisk-navy)] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {editorTab === 'write' ? (
              <textarea
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={20000}
                placeholder={'## Morning Walk\nStart early along the stone lanes before shops open...\n\n- Grab coffee on the corner\n- Cross the wooden footbridge'}
                className="w-full p-3.5 rounded-xl border border-slate-300 text-sm font-mono text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            ) : (
              <div className="min-h-[240px] max-h-[320px] overflow-y-auto p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                {content.trim() ? (
                  <SafeMarkdownPreview content={content} />
                ) : (
                  <p className="text-xs text-slate-400">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-xs font-semibold text-slate-700">
              Publish immediately to the public Community Field Guides catalog
            </span>
          </label>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-4 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
            disabled={saving}
            className="h-9 px-4 rounded-xl bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{guide ? 'Save Changes' : 'Create Guide'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateHome,
  onOpenPublicGuide,
}) => {
  const { user, membershipTier, setTier, logOut } = useAuth();

  const [activeSection, setActiveSection] = React.useState<AdminSection>('overview');
  const [loadingData, setLoadingData] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [users, setUsers] = React.useState<AdminUserRecord[]>([]);
  const [itineraries, setItineraries] = React.useState<TripItinerary[]>([]);
  const [guides, setGuides] = React.useState<BlogPost[]>([]);

  // User filters & inline edit state
  const [userSearch, setUserSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<'all' | UserRole>('all');
  const [tierFilter, setTierFilter] = React.useState<'all' | MembershipTier>('all');
  const [busyUserId, setBusyUserId] = React.useState<string | null>(null);
  const [editingNameUid, setEditingNameUid] = React.useState<string | null>(null);
  const [editingNameDraft, setEditingNameDraft] = React.useState('');
  const [confirmDeleteUid, setConfirmDeleteUid] = React.useState<string | null>(null);

  // Guides filters & editor modal state
  const [guideSearch, setGuideSearch] = React.useState('');
  const [guideStatusFilter, setGuideStatusFilter] = React.useState<'all' | 'published' | 'draft'>('all');
  const [busyGuideId, setBusyGuideId] = React.useState<string | null>(null);
  const [confirmDeleteGuideId, setConfirmDeleteGuideId] = React.useState<string | null>(null);
  const [editorState, setEditorState] = React.useState<{
    open: boolean;
    guide: BlogPost | null;
  }>({ open: false, guide: null });
  const [savingGuide, setSavingGuide] = React.useState(false);
  const [switchingDemoTier, setSwitchingDemoTier] = React.useState(false);

  const loadAllAdminData = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingData(true);
    }
    setError(null);
    try {
      const [userRows, itineraryRows, guideRows] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminItineraries(),
        fetchAdminGuides(),
      ]);
      setUsers(userRows);
      setItineraries(itineraryRows);
      setGuides(guideRows);
    } catch (err: any) {
      setError(err?.message || 'Failed to load administrator telemetry from Firestore.');
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadAllAdminData(false);
  }, [loadAllAdminData]);

  const showTransientNotice = React.useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => {
      setNotice((prev) => (prev === message ? null : prev));
    }, 4000);
  }, []);

  // --- Computed Metrics ---
  const metrics = React.useMemo(() => {
    const totalUsers = users.length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const wandererCount = users.filter((u) => u.membershipTier === 'Wanderer').length;
    const explorerCount = users.filter((u) => u.membershipTier === 'Explorer').length;
    const cartographerCount = users.filter((u) => u.membershipTier === 'Cartographer').length;
    const passportCount = explorerCount + cartographerCount;
    const consentedCount = users.filter((u) => Boolean(u.legalConsentVersion)).length;
    const marketingCount = users.filter((u) => Boolean(u.marketingOptIn)).length;

    const totalItineraries = itineraries.length;
    const unlockedItineraries = itineraries.filter((t) => Boolean(t.unlocked)).length;
    const previewItineraries = totalItineraries - unlockedItineraries;

    const totalGuides = guides.length;
    const publishedGuidesCount = guides.filter((g) => Boolean(g.isPublished)).length;
    const draftGuidesCount = totalGuides - publishedGuidesCount;

    const destCounts = new Map<string, number>();
    for (const trip of itineraries) {
      const key = (trip.destination || 'Unknown').trim();
      destCounts.set(key, (destCounts.get(key) || 0) + 1);
    }
    const topDestinations = Array.from(destCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      totalUsers,
      adminCount,
      wandererCount,
      explorerCount,
      cartographerCount,
      passportCount,
      consentedCount,
      marketingCount,
      totalItineraries,
      unlockedItineraries,
      previewItineraries,
      totalGuides,
      publishedGuidesCount,
      draftGuidesCount,
      topDestinations,
    };
  }, [users, itineraries, guides]);

  // --- Filtered Lists ---
  const filteredUsers = React.useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (tierFilter !== 'all' && u.membershipTier !== tierFilter) return false;
      if (!q) return true;
      return (
        u.displayName.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.uid.toLowerCase().includes(q)
      );
    });
  }, [users, userSearch, roleFilter, tierFilter]);

  const filteredGuides = React.useMemo(() => {
    const q = guideSearch.trim().toLowerCase();
    return guides.filter((g) => {
      if (guideStatusFilter === 'published' && !g.isPublished) return false;
      if (guideStatusFilter === 'draft' && g.isPublished) return false;
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.destination.toLowerCase().includes(q) ||
        (g.slug && g.slug.toLowerCase().includes(q))
      );
    });
  }, [guides, guideSearch, guideStatusFilter]);

  // --- User Management Handlers ---
  const handleUserRoleChange = async (target: AdminUserRecord, nextRole: UserRole) => {
    if (target.uid === user?.uid || target.role === nextRole) return;
    setBusyUserId(target.uid);
    setError(null);
    try {
      await adminUpdateUserRecord(target.uid, { role: nextRole });
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === target.uid
            ? { ...u, role: nextRole, updatedAt: new Date().toISOString() }
            : u
        )
      );
      showTransientNotice(`Updated ${target.displayName} role to ${nextRole}.`);
    } catch (err: any) {
      setError(err?.message || 'Unable to update user role.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleUserTierChange = async (
    target: AdminUserRecord,
    nextTier: MembershipTier
  ) => {
    if (target.membershipTier === nextTier) return;
    setBusyUserId(target.uid);
    setError(null);
    try {
      await adminUpdateUserRecord(target.uid, { membershipTier: nextTier });
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === target.uid
            ? { ...u, membershipTier: nextTier, updatedAt: new Date().toISOString() }
            : u
        )
      );
      if (target.uid === user?.uid) {
        await setTier(nextTier);
      }
      showTransientNotice(`Updated ${target.displayName} tier to ${nextTier}.`);
    } catch (err: any) {
      setError(err?.message || 'Unable to update membership tier.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleSaveDisplayName = async (target: AdminUserRecord) => {
    const clean = editingNameDraft.trim();
    if (!clean || clean === target.displayName) {
      setEditingNameUid(null);
      return;
    }
    setBusyUserId(target.uid);
    setError(null);
    try {
      await adminUpdateUserRecord(target.uid, { displayName: clean });
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === target.uid
            ? { ...u, displayName: clean, updatedAt: new Date().toISOString() }
            : u
        )
      );
      setEditingNameUid(null);
      showTransientNotice(`Renamed profile to ${clean}.`);
    } catch (err: any) {
      setError(err?.message || 'Unable to update display name.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleConfirmDeleteUser = async (target: AdminUserRecord) => {
    if (target.uid === user?.uid) return;
    setBusyUserId(target.uid);
    setError(null);
    try {
      await adminDeleteUserProfile(target.uid);
      setUsers((prev) => prev.filter((u) => u.uid !== target.uid));
      setConfirmDeleteUid(null);
      showTransientNotice(`Removed Firestore profile for ${target.displayName}.`);
    } catch (err: any) {
      setError(err?.message || 'Unable to delete user profile.');
    } finally {
      setBusyUserId(null);
    }
  };

  // --- Guide Management Handlers ---
  const handleSaveGuide = async (draft: AdminGuideDraftInput) => {
    if (!user) return;
    setSavingGuide(true);
    setError(null);
    try {
      const saved = await adminSaveCommunityGuide(user.uid, draft);
      setGuides((prev) => {
        const exists = prev.some((g) => g.id === saved.id);
        if (exists) {
          return prev.map((g) => (g.id === saved.id ? saved : g));
        }
        return [saved, ...prev];
      });
      setEditorState({ open: false, guide: null });
      showTransientNotice(
        draft.id
          ? `Saved updates to "${saved.title}".`
          : `Created community guide "${saved.title}".`
      );
    } finally {
      setSavingGuide(false);
    }
  };

  const handleToggleGuidePublish = async (guide: BlogPost) => {
    const nextState = !guide.isPublished;
    setBusyGuideId(guide.id);
    setError(null);
    try {
      await adminToggleGuidePublished(guide.id, nextState);
      setGuides((prev) =>
        prev.map((g) =>
          g.id === guide.id
            ? { ...g, isPublished: nextState, updatedAt: new Date().toISOString() }
            : g
        )
      );
      showTransientNotice(
        nextState
          ? `Published "${guide.title}".`
          : `Moved "${guide.title}" to drafts.`
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to update guide visibility.');
    } finally {
      setBusyGuideId(null);
    }
  };

  const handleConfirmDeleteGuide = async (guide: BlogPost) => {
    setBusyGuideId(guide.id);
    setError(null);
    try {
      await adminDeleteCommunityGuide(guide.id);
      setGuides((prev) => prev.filter((g) => g.id !== guide.id));
      setConfirmDeleteGuideId(null);
      showTransientNotice(`Deleted "${guide.title}".`);
    } catch (err: any) {
      setError(err?.message || 'Unable to delete community guide.');
    } finally {
      setBusyGuideId(null);
    }
  };

  const handleDemoTierSwitch = async (nextTier: MembershipTier) => {
    if (nextTier === membershipTier || switchingDemoTier) return;
    setSwitchingDemoTier(true);
    setError(null);
    try {
      await setTier(nextTier);
      if (user) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === user.uid ? { ...u, membershipTier: nextTier } : u
          )
        );
      }
      showTransientNotice(`Demo account tier switched to ${nextTier}.`);
    } catch (err: any) {
      setError(err?.message || 'Unable to switch demo tier.');
    } finally {
      setSwitchingDemoTier(false);
    }
  };

  const handleAdminSignOut = async () => {
    await logOut();
    onNavigateHome();
  };

  const navItems: { id: AdminSection; label: string; icon: React.ComponentType<any>; count?: number }[] = [
    { id: 'overview', label: 'Usage Metrics', icon: BarChart3 },
    { id: 'users', label: 'Registered Users', icon: Users, count: metrics.totalUsers },
    { id: 'guides', label: 'Community Guides', icon: BookOpen, count: metrics.totalGuides },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-[var(--whisk-navy)]">
      {/* Desktop Sidebar */}
      <aside className="lg:w-64 lg:shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
        <div>
          <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 whitespace-nowrap">
              <WhiskLogo size={34} className="drop-shadow-xs" />
              <div>
                <div className="text-sm font-extrabold tracking-tight leading-none whisk-text-ombre">
                  Whisk Admin
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Operations Console
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onNavigateHome}
              className="lg:hidden inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[var(--whisk-navy)] cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              App
            </button>
          </div>

          {/* Navigation */}
          <nav
            aria-label="Admin sections"
            className="p-3 flex lg:flex-col gap-1 overflow-x-auto"
          >
            {navItems.map(({ id, label, icon: Icon, count }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[var(--whisk-navy)]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </span>
                  {typeof count === 'number' && !loadingData && (
                    <span
                      className={`text-[11px] tabular-nums ${
                        active ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Admin Demo Tier Switcher */}
          <div className="hidden lg:block mx-3 mt-4 pt-4 border-t border-slate-200">
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Demo Tier Preview
              </span>
              {switchingDemoTier && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
            </div>
            <div className="space-y-1">
              {TIER_OPTIONS.map((tier) => {
                const isSelected = membershipTier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    disabled={switchingDemoTier}
                    onClick={() => handleDemoTierSwitch(tier)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 text-[var(--whisk-navy)] font-semibold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Crown className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-500' : 'text-slate-300'}`} />
                      <span>{tier}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="hidden lg:block p-3 border-t border-slate-200 space-y-2">
          <div className="px-2.5 py-2 flex items-center gap-2.5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Admin'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--whisk-navy)] truncate">
                {user?.displayName || 'Administrator'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {user?.email || 'Verified Admin'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onNavigateHome}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>App</span>
            </button>
            <button
              type="button"
              onClick={handleAdminSignOut}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-slate-400 font-medium hidden sm:inline">Whisk Admin</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <h1 className="font-bold text-[var(--whisk-navy)] truncate">
              {SECTION_META[activeSection].label}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => loadAllAdminData(true)}
              disabled={refreshing || loadingData}
              className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {activeSection === 'guides' && (
              <button
                type="button"
                onClick={() => setEditorState({ open: true, guide: null })}
                className="h-9 px-3.5 rounded-xl bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Guide</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-6 py-6 max-w-6xl w-full mx-auto space-y-6">
          <p className="text-sm text-slate-500">
            {SECTION_META[activeSection].description}
          </p>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-center justify-between gap-3 text-xs font-medium text-rose-700"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="p-1 hover:bg-rose-100 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {notice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3 text-xs font-medium text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{notice}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="p-1 hover:bg-emerald-100 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* LOADING SKELETON */}
          {loadingData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 animate-pulse"
                  >
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-8 w-16 bg-slate-200 rounded" />
                    <div className="h-3 w-32 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 h-64 animate-pulse" />
            </div>
          ) : (
            <>
              {/* SECTION 1: USAGE METRICS */}
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Registered Users</span>
                        <Users className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-3xl font-extrabold tracking-tight tabular-nums mt-2">
                        {metrics.totalUsers}
                      </div>
                      <div className="text-xs text-slate-500 mt-1.5 tabular-nums">
                        {metrics.adminCount} admin{metrics.adminCount === 1 ? '' : 's'} · {metrics.consentedCount} consented
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Passport Subscribers</span>
                        <Crown className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-3xl font-extrabold tracking-tight tabular-nums mt-2">
                        {metrics.passportCount}
                      </div>
                      <div className="text-xs text-slate-500 mt-1.5 tabular-nums">
                        {metrics.explorerCount} Explorer · {metrics.cartographerCount} Cartographer
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Generated Itineraries</span>
                        <MapPin className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-3xl font-extrabold tracking-tight tabular-nums mt-2">
                        {metrics.totalItineraries}
                      </div>
                      <div className="text-xs text-slate-500 mt-1.5 tabular-nums">
                        {metrics.unlockedItineraries} unlocked · {metrics.previewItineraries} preview
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Community Guides</span>
                        <BookOpen className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-3xl font-extrabold tracking-tight tabular-nums mt-2">
                        {metrics.totalGuides}
                      </div>
                      <div className="text-xs text-slate-500 mt-1.5 tabular-nums">
                        {metrics.publishedGuidesCount} live · {metrics.draftGuidesCount} draft
                      </div>
                    </div>
                  </div>

                  {/* Breakdown + Top Destinations */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                      <h2 className="text-sm font-bold text-[var(--whisk-navy)] mb-4">
                        Membership & Compliance Breakdown
                      </h2>
                      <div className="space-y-3.5">
                        {[
                          { label: 'Wanderer (Free)', count: metrics.wandererCount, barColor: 'bg-slate-400' },
                          { label: 'Explorer (Passport)', count: metrics.explorerCount, barColor: 'bg-sky-500' },
                          { label: 'Cartographer (Passport)', count: metrics.cartographerCount, barColor: 'bg-amber-500' },
                        ].map((row) => {
                          const pct =
                            metrics.totalUsers > 0
                              ? Math.round((row.count / metrics.totalUsers) * 100)
                              : 0;
                          return (
                            <div key={row.label} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-700">{row.label}</span>
                                <span className="tabular-nums text-slate-500">
                                  {row.count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${row.barColor}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-slate-400">Legal Consent Recorded</div>
                          <div className="font-bold text-[var(--whisk-navy)] tabular-nums mt-0.5">
                            {metrics.consentedCount} / {metrics.totalUsers}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Marketing Opt-In</div>
                          <div className="font-bold text-[var(--whisk-navy)] tabular-nums mt-0.5">
                            {metrics.marketingCount} / {metrics.totalUsers}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                      <h2 className="text-sm font-bold text-[var(--whisk-navy)] mb-4">
                        Top Planned Destinations
                      </h2>
                      {metrics.topDestinations.length === 0 ? (
                        <p className="text-xs text-slate-500 py-8 text-center">
                          No itineraries have been generated yet.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {metrics.topDestinations.map(([dest, count]) => (
                            <div
                              key={dest}
                              className="py-2.5 flex items-center justify-between text-xs"
                            >
                              <span className="font-medium text-slate-700 truncate pr-4">
                                {dest}
                              </span>
                              <span className="font-semibold text-[var(--whisk-navy)] tabular-nums shrink-0">
                                {count} trip{count === 1 ? '' : 's'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Itineraries Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[var(--whisk-navy)]">
                        Recent Generated Itineraries
                      </h2>
                      <span className="text-xs text-slate-400 tabular-nums">
                        Showing {Math.min(itineraries.length, 8)} of {itineraries.length}
                      </span>
                    </div>
                    {itineraries.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">
                        No trip itineraries stored in Firestore yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              <th className="py-3 px-5">Trip Title</th>
                              <th className="py-3 px-4">Destination</th>
                              <th className="py-3 px-4">Duration</th>
                              <th className="py-3 px-4">Access</th>
                              <th className="py-3 px-5 text-right">Created</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {itineraries.slice(0, 8).map((trip) => (
                              <tr key={trip.id} className="hover:bg-slate-50/70">
                                <td className="py-3 px-5 font-semibold text-[var(--whisk-navy)] max-w-[260px] truncate">
                                  {trip.title}
                                </td>
                                <td className="py-3 px-4 text-slate-600">{trip.destination}</td>
                                <td className="py-3 px-4 text-slate-500 tabular-nums">
                                  {trip.duration}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`font-semibold ${
                                      trip.unlocked ? 'text-emerald-700' : 'text-slate-500'
                                    }`}
                                  >
                                    {trip.unlocked ? 'Unlocked' : 'Preview'}
                                  </span>
                                </td>
                                <td className="py-3 px-5 text-right text-slate-500 tabular-nums whitespace-nowrap">
                                  {formatShortDate(trip.createdAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 2: REGISTERED USERS */}
              {activeSection === 'users' && (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by display name, @username, or UID..."
                        className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>
                    <select
                      aria-label="Filter by role"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
                      className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admins</option>
                      <option value="user">Standard Users</option>
                    </select>
                    <select
                      aria-label="Filter by membership tier"
                      value={tierFilter}
                      onChange={(e) => setTierFilter(e.target.value as 'all' | MembershipTier)}
                      className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
                    >
                      <option value="all">All Tiers</option>
                      {TIER_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                      <span className="tabular-nums">
                        {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'} shown
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Private email records remain owner-only under Firestore rules.
                      </span>
                    </div>

                    {filteredUsers.length === 0 ? (
                      <div className="p-10 text-center text-xs text-slate-500">
                        No registered users match your current filter.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              <th className="py-3 px-5">Traveler</th>
                              <th className="py-3 px-4">Role</th>
                              <th className="py-3 px-4">Tier</th>
                              <th className="py-3 px-4">Consent</th>
                              <th className="py-3 px-4">Joined</th>
                              <th className="py-3 px-5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredUsers.map((record) => {
                              const isSelf = record.uid === user?.uid;
                              const isBusy = busyUserId === record.uid;
                              const isEditingName = editingNameUid === record.uid;
                              const isConfirmingDelete = confirmDeleteUid === record.uid;

                              return (
                                <tr key={record.uid} className="hover:bg-slate-50/60">
                                  <td className="py-3 px-5">
                                    {isEditingName ? (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          value={editingNameDraft}
                                          onChange={(e) => setEditingNameDraft(e.target.value)}
                                          maxLength={100}
                                          className="h-8 px-2.5 rounded-lg border border-slate-300 text-xs w-40"
                                        />
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() => handleSaveDisplayName(record)}
                                          className="h-8 px-2.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold cursor-pointer"
                                        >
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingNameUid(null)}
                                          className="h-8 px-2 rounded-lg border border-slate-200 text-slate-500 text-[11px] cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3 min-w-[200px]">
                                        {record.photoURL ? (
                                          <img
                                            src={record.photoURL}
                                            alt={record.displayName}
                                            referrerPolicy="no-referrer"
                                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                                            {record.displayName.slice(0, 1).toUpperCase()}
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <div className="font-semibold text-[var(--whisk-navy)] flex items-center gap-1.5">
                                            <span className="truncate max-w-[160px]">
                                              {record.displayName}
                                            </span>
                                            {isSelf && (
                                              <span className="text-[10px] font-semibold text-slate-400">
                                                (You)
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                                            {record.username ? `@${record.username}` : record.uid}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-3 px-4">
                                    <select
                                      aria-label={`Role for ${record.displayName}`}
                                      value={record.role}
                                      disabled={isSelf || isBusy}
                                      onChange={(e) =>
                                        handleUserRoleChange(record, e.target.value as UserRole)
                                      }
                                      className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 disabled:opacity-50"
                                    >
                                      <option value="user">user</option>
                                      <option value="admin">admin</option>
                                    </select>
                                  </td>

                                  <td className="py-3 px-4">
                                    <select
                                      aria-label={`Tier for ${record.displayName}`}
                                      value={record.membershipTier}
                                      disabled={isBusy}
                                      onChange={(e) =>
                                        handleUserTierChange(
                                          record,
                                          e.target.value as MembershipTier
                                        )
                                      }
                                      className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 disabled:opacity-50"
                                    >
                                      {TIER_OPTIONS.map((t) => (
                                        <option key={t} value={t}>
                                          {t}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="py-3 px-4 text-slate-500 tabular-nums whitespace-nowrap">
                                    {record.legalConsentVersion || 'Pending'}
                                  </td>

                                  <td className="py-3 px-4 text-slate-500 tabular-nums whitespace-nowrap">
                                    {formatShortDate(record.createdAt)}
                                  </td>

                                  <td className="py-3 px-5 text-right whitespace-nowrap">
                                    {isConfirmingDelete ? (
                                      <div className="inline-flex items-center gap-1.5">
                                        <span className="text-[11px] font-semibold text-rose-600">
                                          Remove profile?
                                        </span>
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() => handleConfirmDeleteUser(record)}
                                          className="h-7 px-2.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold cursor-pointer"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteUid(null)}
                                          className="h-7 px-2 rounded-lg border border-slate-200 text-slate-600 text-[11px] cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="inline-flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() => {
                                            setEditingNameUid(record.uid);
                                            setEditingNameDraft(record.displayName);
                                          }}
                                          title="Edit display name"
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--whisk-navy)] hover:bg-slate-100 cursor-pointer"
                                        >
                                          <FileEdit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isSelf || isBusy}
                                          onClick={() => setConfirmDeleteUid(record.uid)}
                                          title={
                                            isSelf
                                              ? 'You cannot delete your active admin profile'
                                              : 'Delete user profile'
                                          }
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 3: COMMUNITY GUIDES */}
              {activeSection === 'guides' && (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={guideSearch}
                        onChange={(e) => setGuideSearch(e.target.value)}
                        placeholder="Search guides by title, destination, or slug..."
                        className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs text-[var(--whisk-navy)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>
                    <select
                      aria-label="Filter guides by publish status"
                      value={guideStatusFilter}
                      onChange={(e) =>
                        setGuideStatusFilter(
                          e.target.value as 'all' | 'published' | 'draft'
                        )
                      }
                      className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
                    >
                      <option value="all">All Statuses</option>
                      <option value="published">Published</option>
                      <option value="draft">Drafts</option>
                    </select>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                      <span className="tabular-nums">
                        {filteredGuides.length} guide{filteredGuides.length === 1 ? '' : 's'} shown
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Published guides appear immediately in the Whisk Discover feed.
                      </span>
                    </div>

                    {filteredGuides.length === 0 ? (
                      <div className="p-10 text-center space-y-3">
                        <p className="text-xs text-slate-500">
                          No community guides found in Firestore for this filter.
                        </p>
                        <button
                          type="button"
                          onClick={() => setEditorState({ open: true, guide: null })}
                          className="h-9 px-4 rounded-xl bg-[var(--whisk-navy)] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create First Guide
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              <th className="py-3 px-5">Guide</th>
                              <th className="py-3 px-4">Destination</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Updated</th>
                              <th className="py-3 px-5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredGuides.map((guide) => {
                              const isBusy = busyGuideId === guide.id;
                              const isConfirming = confirmDeleteGuideId === guide.id;

                              return (
                                <tr key={guide.id} className="hover:bg-slate-50/60">
                                  <td className="py-3 px-5 max-w-[300px]">
                                    <div className="font-semibold text-[var(--whisk-navy)] truncate">
                                      {guide.title}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                                      /{guide.slug || guide.id}
                                    </div>
                                  </td>

                                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                    {guide.destination}
                                  </td>

                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1.5 font-semibold ${
                                        guide.isPublished
                                          ? 'text-emerald-700'
                                          : 'text-amber-700'
                                      }`}
                                    >
                                      <Globe className="w-3.5 h-3.5" />
                                      {guide.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                  </td>

                                  <td className="py-3 px-4 text-slate-500 tabular-nums whitespace-nowrap">
                                    {formatShortDate(guide.updatedAt || guide.createdAt)}
                                  </td>

                                  <td className="py-3 px-5 text-right whitespace-nowrap">
                                    {isConfirming ? (
                                      <div className="inline-flex items-center gap-1.5">
                                        <span className="text-[11px] font-semibold text-rose-600">
                                          Delete guide?
                                        </span>
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() => handleConfirmDeleteGuide(guide)}
                                          className="h-7 px-2.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold cursor-pointer"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteGuideId(null)}
                                          className="h-7 px-2 rounded-lg border border-slate-200 text-slate-600 text-[11px] cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="inline-flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() => handleToggleGuidePublish(guide)}
                                          title={guide.isPublished ? 'Unpublish' : 'Publish'}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--whisk-navy)] hover:bg-slate-100 cursor-pointer"
                                        >
                                          {guide.isPublished ? (
                                            <EyeOff className="w-3.5 h-3.5" />
                                          ) : (
                                            <Eye className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() =>
                                            setEditorState({ open: true, guide })
                                          }
                                          title="Edit guide"
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--whisk-navy)] hover:bg-slate-100 cursor-pointer"
                                        >
                                          <FileEdit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onOpenPublicGuide(guide)}
                                          title="Open guide view"
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 cursor-pointer"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() => setConfirmDeleteGuideId(guide.id)}
                                          title="Delete guide"
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {editorState.open && (
        <GuideEditorModal
          guide={editorState.guide}
          saving={savingGuide}
          onClose={() => setEditorState({ open: false, guide: null })}
          onSave={handleSaveGuide}
        />
      )}
    </div>
  );
};
