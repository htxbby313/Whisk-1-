import * as React from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckSquare,
  Loader2,
  Luggage,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { PackingItem, TripItinerary, TripNote } from '../../types';
import { useAuth } from '../context/AuthContext';
import {
  addTripJournalNote,
  addTripPackingItem,
  deleteTripJournalNote,
  deleteTripPackingItem,
  fetchTripToolkit,
  suggestPackingItems,
  toggleTripPackingItem,
} from '../../geminiService';

interface TripToolkitProps {
  itinerary: TripItinerary;
  onSignInRequest: () => Promise<void>;
}

const CATEGORIES = ['Essentials', 'Clothing', 'Tech', 'Documents', 'Health'];

export const TripToolkit: React.FC<TripToolkitProps> = ({
  itinerary,
  onSignInRequest,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'packing' | 'journal'>('packing');
  const [packingItems, setPackingItems] = React.useState<PackingItem[]>([]);
  const [tripNotes, setTripNotes] = React.useState<TripNote[]>([]);
  const [loadingToolkit, setLoadingToolkit] = React.useState(false);
  const [suggesting, setSuggesting] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const [newItemText, setNewItemText] = React.useState('');
  const [newItemCategory, setNewItemCategory] = React.useState('Essentials');

  const [noteTitle, setNoteTitle] = React.useState('');
  const [noteContent, setNoteContent] = React.useState('');
  const [noteRating, setNoteRating] = React.useState(5);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user || !itinerary.id) {
        setPackingItems([]);
        setTripNotes([]);
        return;
      }
      setLoadingToolkit(true);
      setLocalError(null);
      try {
        const token = await user.getIdToken();
        const data = await fetchTripToolkit(token, itinerary.id);
        if (!active) return;
        setPackingItems(Array.isArray(data.packingItems) ? data.packingItems : []);
        setTripNotes(Array.isArray(data.tripNotes) ? data.tripNotes : []);
      } catch (err: any) {
        if (!active) return;
        setLocalError(err?.message || 'Unable to load your trip toolkit right now.');
      } finally {
        if (active) setLoadingToolkit(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user, itinerary.id]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !user || submitting) return;
    setSubmitting(true);
    setLocalError(null);
    try {
      const token = await user.getIdToken();
      const created = await addTripPackingItem(token, itinerary.id, {
        destination: itinerary.destination,
        item: newItemText.trim(),
        category: newItemCategory,
      });
      setPackingItems((prev) => [created, ...prev]);
      setNewItemText('');
    } catch (err: any) {
      setLocalError(err?.message || 'Could not add packing item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuggestPacking = async () => {
    if (!user || suggesting) return;
    setSuggesting(true);
    setLocalError(null);
    try {
      const suggestions = await suggestPackingItems({
        destination: itinerary.destination,
        duration: itinerary.duration,
        interests: itinerary.interests,
      });
      const existingNames = new Set(packingItems.map((p) => p.item.toLowerCase()));
      const token = await user.getIdToken();
      const createdRows: PackingItem[] = [];
      for (const s of suggestions) {
        if (!s.item || existingNames.has(s.item.toLowerCase())) continue;
        const created = await addTripPackingItem(token, itinerary.id, {
          destination: itinerary.destination,
          item: s.item,
          category: s.category || 'Essentials',
        });
        createdRows.push(created);
      }
      if (createdRows.length > 0) {
        setPackingItems((prev) => [...createdRows, ...prev]);
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Could not generate packing suggestions.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleToggleItem = async (item: PackingItem) => {
    if (!user) return;
    const nextPacked = !item.isPacked;
    setPackingItems((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, isPacked: nextPacked } : p))
    );
    try {
      const token = await user.getIdToken();
      await toggleTripPackingItem(token, item.id, nextPacked);
    } catch (err: any) {
      setPackingItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, isPacked: item.isPacked } : p))
      );
      setLocalError(err?.message || 'Could not update item.');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!user) return;
    const snapshot = packingItems;
    setPackingItems((prev) => prev.filter((p) => p.id !== itemId));
    try {
      const token = await user.getIdToken();
      await deleteTripPackingItem(token, itemId);
    } catch (err: any) {
      setPackingItems(snapshot);
      setLocalError(err?.message || 'Could not remove item.');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim() || !user || submitting) return;
    setSubmitting(true);
    setLocalError(null);
    try {
      const token = await user.getIdToken();
      const created = await addTripJournalNote(token, itinerary.id, {
        destination: itinerary.destination,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        rating: noteRating,
      });
      setTripNotes((prev) => [created, ...prev]);
      setNoteTitle('');
      setNoteContent('');
      setNoteRating(5);
    } catch (err: any) {
      setLocalError(err?.message || 'Could not save note.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!user) return;
    const snapshot = tripNotes;
    setTripNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      const token = await user.getIdToken();
      await deleteTripJournalNote(token, noteId);
    } catch (err: any) {
      setTripNotes(snapshot);
      setLocalError(err?.message || 'Could not remove note.');
    }
  };

  const packedCount = packingItems.filter((i) => i.isPacked).length;
  const packPct =
    packingItems.length > 0 ? Math.round((packedCount / packingItems.length) * 100) : 0;

  return (
    <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-xl border-4 border-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="vibrant-gradient p-3 rounded-2xl text-white shadow-md">
            <Luggage className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[var(--whisk-navy)] tracking-tight">
              Trip Toolkit
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Packing checklist & personal travel notes for {itinerary.destination}
            </p>
          </div>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('packing')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'packing'
                ? 'bg-white text-[var(--whisk-navy)] shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-[var(--whisk-orange)]" />
            Packing ({packingItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-white text-[var(--whisk-navy)] shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[var(--whisk-cyan)]" />
            Journal ({tripNotes.length})
          </button>
        </div>
      </div>

      {localError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      {!user ? (
        <div className="bg-slate-50 rounded-3xl p-8 text-center border border-slate-100 space-y-4">
          <p className="text-sm font-semibold text-slate-500">
            Sign in with Google to save custom packing checklists and trip journal notes across your devices.
          </p>
          <button
            type="button"
            onClick={onSignInRequest}
            className="vibrant-gradient text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer shadow-md"
          >
            Sign in with Google
          </button>
        </div>
      ) : loadingToolkit ? (
        <div className="py-10 flex items-center justify-center gap-3 text-slate-400 text-sm font-bold">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--whisk-orange)]" />
          Loading your trip toolkit...
        </div>
      ) : activeTab === 'packing' ? (
        <div className="space-y-5">
          {packingItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-400">
                <span>Packed Progress</span>
                <span className="text-[var(--whisk-navy)]">
                  {packedCount} / {packingItems.length} ({packPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full vibrant-gradient rounded-full transition-all duration-500"
                  style={{ width: `${packPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleAddItem} className="flex-1 flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add item (e.g., Universal power adapter)"
                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-[var(--whisk-orange)] transition-colors"
              />
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-wider text-slate-600 outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submitting || !newItemText.trim()}
                className="vibrant-gradient text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-102 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            <button
              type="button"
              onClick={handleSuggestPacking}
              disabled={suggesting}
              className="cyan-gradient text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-102 transition-all disabled:opacity-60 cursor-pointer shrink-0 shadow-md"
            >
              {suggesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {suggesting ? 'Curating...' : 'Bestie Suggest'}
            </button>
          </div>

          {packingItems.length === 0 ? (
            <p className="text-center py-6 text-sm text-slate-400 font-medium">
              No packing items yet—add your own or tap <strong>Bestie Suggest</strong> for tailored essentials!
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {packingItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                    item.isPacked
                      ? 'bg-emerald-50/50 border-emerald-100'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleItem(item)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        item.isPacked
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white border-2 border-slate-200'
                      }`}
                    >
                      {item.isPacked && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-bold truncate ${
                          item.isPacked ? 'line-through text-slate-400' : 'text-[var(--whisk-navy)]'
                        }`}
                      >
                        {item.item}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {item.category}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <form onSubmit={handleAddNote} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title (e.g., Train pass confirmation or Hidden alley cafe)"
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[var(--whisk-cyan)]"
              />
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-3 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNoteRating(star)}
                    className="p-0.5 cursor-pointer"
                    title={`${star} stars`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= noteRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={2}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write down booking reminders, insider tips, or memories..."
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--whisk-cyan)] resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !noteTitle.trim() || !noteContent.trim()}
                className="cyan-gradient text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:scale-102 transition-all disabled:opacity-50 cursor-pointer"
              >
                Save Journal Note
              </button>
            </div>
          </form>

          {tripNotes.length === 0 ? (
            <p className="text-center py-6 text-sm text-slate-400 font-medium">
              No journal notes yet. Keep reservation numbers, foodie must-tries, or highlights here!
            </p>
          ) : (
            <div className="space-y-3">
              {tripNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-base text-[var(--whisk-navy)]">
                        {note.title}
                      </h4>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: note.rating }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
