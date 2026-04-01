'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, Plus, Trophy, Edit2, X } from 'lucide-react';

function DumbbellSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="10" width="3" height="4" rx="1" fill="currentColor" />
      <rect x="1" y="9" width="4" height="6" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="19" y="10" width="3" height="4" rx="1" fill="currentColor" />
      <rect x="19" y="9" width="4" height="6" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="5" y="11" width="14" height="2" rx="1" fill="currentColor" opacity="0.8" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 48" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

const EXERCISES = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Lat Pull Down',
  'Barbell Row'
];

type ExerciseSet = {
  id: string;
  weight: number;
  reps: number;
};

type ExerciseRecord = {
  id: string;
  userId: string;
  date: string;
  exercise: string;
  sets: ExerciseSet[];
};

export default function ExerciseTab({ userId }: { userId: string }) {
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    exercise: EXERCISES[0],
  });
  const [currentSets, setCurrentSets] = useState<Omit<ExerciseSet, 'id'>[]>([
    { weight: 0, reps: 0 }
  ]);

  useEffect(() => {
    fetchRecords();
  }, [userId]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/exercise%20tracking?userId=${userId}`);
      const data = await res.json();
      if (!data.error) {
        // Parse the sets JSON string back to array
        const parsedData = data.map((r: any) => ({
          ...r,
          sets: typeof r.sets === 'string' ? JSON.parse(r.sets) : r.sets
        }));
        setRecords(parsedData.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSet = () => {
    setCurrentSets([...currentSets, { weight: 0, reps: 0 }]);
  };

  const handleRemoveSet = (index: number) => {
    if (currentSets.length > 1) {
      setCurrentSets(currentSets.filter((_, i) => i !== index));
    }
  };

  const handleSetChange = (index: number, field: 'weight' | 'reps', value: string) => {
    const newSets = [...currentSets];
    newSets[index][field] = Number(value);
    setCurrentSets(newSets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validSets = currentSets.filter(s => s.weight > 0 && s.reps > 0);
    
    if (validSets.length === 0) {
      alert('Please enter at least one valid set with weight and reps.');
      return;
    }

    setIsSaving(true);
    const newRecord = {
      id: editingId || crypto.randomUUID(),
      userId,
      date: formData.date,
      exercise: formData.exercise,
      sets: JSON.stringify(validSets.map(s => ({ ...s, id: crypto.randomUUID() }))),
    };
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      await fetch('/api/data/exercise%20tracking', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
      
      await fetchRecords();
      
      setEditingId(null);
      setCurrentSets([{ weight: 0, reps: 0 }]);
    } catch (error) {
      alert('Failed to save exercise.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (record: ExerciseRecord) => {
    setEditingId(record.id);
    setFormData({
      date: record.date,
      exercise: record.exercise,
    });
    setCurrentSets(record.sets.map(s => ({ weight: s.weight, reps: s.reps })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(prev => ({ ...prev, exercise: EXERCISES[0] }));
    setCurrentSets([{ weight: 0, reps: 0 }]);
  };

  const deleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this exercise?')) {
      try {
        await fetch(`/api/data/exercise%20tracking?id=${id}`, { method: 'DELETE' });
        await fetchRecords();
        if (editingId === id) cancelEdit();
      } catch (error) {
        alert('Failed to delete exercise.');
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getBestRecord = () => {
    let bestWeight = 0;
    let bestReps = 0;
    let bestDate = '';

    records.forEach(r => {
      if (r.exercise === formData.exercise) {
        r.sets.forEach(s => {
          if (s.weight > bestWeight || (s.weight === bestWeight && s.reps > bestReps)) {
            bestWeight = s.weight;
            bestReps = s.reps;
            bestDate = r.date;
          }
        });
      }
    });

    if (bestWeight === 0) return null;
    return { weight: bestWeight, reps: bestReps, date: bestDate };
  };

  const bestRecord = getBestRecord();

  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, ExerciseRecord[]>);

  const sortedDates = Object.keys(groupedRecords);
  const visibleDates = sortedDates.slice(0, visibleCount);
  const hasMore = visibleCount < sortedDates.length;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingId ? 'Edit Exercise' : 'Log Exercise'}
          </h3>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Date</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Exercise</label>
            <select 
              value={formData.exercise}
              onChange={e => setFormData({...formData, exercise: e.target.value})}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              {EXERCISES.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
            
            {bestRecord && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100">
                <Trophy className="w-3.5 h-3.5" />
                <span>
                  <strong>PR:</strong> {bestRecord.weight}kg × {bestRecord.reps} reps <span className="text-amber-500/80">({formatDate(bestRecord.date)})</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Sets</label>
            <button 
              type="button"
              onClick={handleAddSet}
              className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-2 sm:px-2 sm:py-1 rounded-md transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Set
            </button>
          </div>
          
          {currentSets.map((set, index) => (
            <div key={index} className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 sm:w-8 text-center text-sm font-medium text-gray-400">
                {index + 1}
              </div>
              <div className="flex-1 relative">
                <input 
                  type="number" 
                  step="0.5"
                  required
                  min="0"
                  placeholder="Weight"
                  value={set.weight || ''}
                  onChange={e => handleSetChange(index, 'weight', e.target.value)}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pr-8"
                />
                <span className="absolute right-3 top-3.5 sm:top-2.5 text-xs text-gray-400">kg</span>
              </div>
              <div className="text-gray-400 text-sm">×</div>
              <div className="flex-1 relative">
                <input 
                  type="number" 
                  required
                  min="0"
                  placeholder="Reps"
                  value={set.reps || ''}
                  onChange={e => handleSetChange(index, 'reps', e.target.value)}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pr-10"
                />
                <span className="absolute right-3 top-3.5 sm:top-2.5 text-xs text-gray-400">reps</span>
              </div>
              <button 
                type="button"
                onClick={() => handleRemoveSet(index)}
                disabled={currentSets.length === 1}
                className="p-3 sm:p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 sm:py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <DumbbellSpinner /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : (editingId ? 'Update Exercise' : 'Save Exercise')}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Log</h3>
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                </div>
                <div className="divide-y divide-gray-100">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-36 mb-3"></div>
                      <div className="flex gap-2">
                        {[...Array(3)].map((_, k) => (
                          <div key={k} className="h-7 bg-gray-200 rounded w-20"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedRecords).length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No exercises recorded yet.
          </div>
        ) : (
          <div className="space-y-6">
            {visibleDates.map((date) => {
              const dayRecords = groupedRecords[date];
              return (
              <div key={date} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-gray-900">
                  {formatDate(date)}
                </div>
                <div className="divide-y divide-gray-100">
                  {dayRecords.map((record) => (
                    <div key={record.id} className={`p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 group transition-colors ${editingId === record.id ? 'bg-indigo-50/30' : ''}`}>
                      <div>
                        <h4 className="font-semibold text-indigo-900 mb-2">{record.exercise}</h4>
                        <div className="flex flex-wrap gap-2">
                          {record.sets.map((set, i) => (
                            <div key={set.id} className="bg-white border border-gray-200 px-2.5 py-1 rounded-md text-sm text-gray-700 shadow-sm">
                              <span className="text-gray-400 text-xs mr-1">{i + 1}</span>
                              <span className="font-medium">{set.weight}</span>
                              <span className="text-gray-500 text-xs mx-0.5">kg</span>
                              <span className="text-gray-400 mx-1">×</span>
                              <span className="font-medium">{set.reps}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 self-start opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(record)}
                          className="text-gray-400 hover:text-indigo-500 p-2 rounded-md hover:bg-indigo-50 transition-colors"
                          title="Edit exercise"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteRecord(record.id)}
                          className="text-gray-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete exercise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
            })}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="px-6 py-2.5 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm"
                >
                  Load More ({sortedDates.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

