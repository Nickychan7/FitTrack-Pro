'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, PieChart, Target, Edit2, X, Sparkles, Loader2, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

function FoodSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="10 46" strokeLinecap="round" />
      <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.2" />
      <circle cx="10" cy="11" r="1" fill="currentColor" opacity="0.7" />
      <circle cx="13" cy="10" r="0.8" fill="currentColor" opacity="0.7" />
      <circle cx="13" cy="13" r="1" fill="currentColor" opacity="0.7" />
      <circle cx="10" cy="13.5" r="0.7" fill="currentColor" opacity="0.5" />
    </svg>
  );
}


type MacroRecord = {
  id: string;
  userId: string;
  date: string;
  fat: number;
  carbs: number;
  protein: number;
  foodDescription: string;
};

type MacroTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export default function MacroTab({ userId }: { userId: string }) {
  const [records, setRecords] = useState<MacroRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [inputMode, setInputMode] = useState<'manual' | 'ai'>('manual');
  const [aiInput, setAiInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  
  const [targets, setTargets] = useState<MacroTargets>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fat: '',
    carbs: '',
    protein: '',
    foodDescription: '',
  });

  useEffect(() => {
    fetchRecords();
    const savedTargets = localStorage.getItem(`fitTrack_macro_targets_${userId}`);
    if (savedTargets) setTargets(JSON.parse(savedTargets));
  }, [userId]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/macro%20calories?userId=${userId}`);
      const data = await res.json();
      if (!data.error) {
        setRecords(data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`fitTrack_macro_targets_${userId}`, JSON.stringify(targets));
    setShowTargets(false);
  };

  const handleAIAnalyze = async () => {
    if (!aiInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze food.');
      setFormData(prev => ({
        ...prev,
        fat: data.fat.toString(),
        carbs: data.carbs.toString(),
        protein: data.protein.toString(),
        foodDescription: aiInput,
      }));
      setInputMode('manual');
      setAiInput('');
    } catch (error) {
      console.error(error);
      alert('Failed to analyze food. Please try again or use manual input.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newRecord: MacroRecord = {
      id: editingId || crypto.randomUUID(),
      userId,
      date: formData.date,
      fat: Number(formData.fat),
      carbs: Number(formData.carbs),
      protein: Number(formData.protein),
      foodDescription: formData.foodDescription,
    };
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      await fetch('/api/data/macro%20calories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
      
      await fetchRecords();
      
      setEditingId(null);
      setFormData(prev => ({
        ...prev,
        fat: '',
        carbs: '',
        protein: '',
        foodDescription: '',
      }));
    } catch (error) {
      alert('Failed to save macros.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (record: MacroRecord) => {
    setEditingId(record.id);
    setFormData({
      date: record.date,
      fat: record.fat.toString(),
      carbs: record.carbs.toString(),
      protein: record.protein.toString(),
      foodDescription: record.foodDescription || '',
    });
    setInputMode('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(prev => ({
      ...prev,
      fat: '',
      carbs: '',
      protein: '',
      foodDescription: '',
    }));
  };

  const deleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await fetch(`/api/data/macro%20calories?id=${id}`, { method: 'DELETE' });
        await fetchRecords();
        if (editingId === id) cancelEdit();
      } catch (error) {
        alert('Failed to delete record.');
      }
    }
  };

  const calculateCalories = (fat: number | string, carbs: number | string, protein: number | string) => {
    return (Number(fat || 0) * 9) + (Number(carbs || 0) * 4) + (Number(protein || 0) * 4);
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, MacroRecord[]>);

  const sortedDates = Object.keys(groupedRecords);
  const visibleDates = sortedDates.slice(0, visibleCount);
  const hasMore = visibleCount < sortedDates.length;

  return (
    <div className="space-y-8">
      {/* Target Settings */}
      <div className="bg-indigo-50 rounded-xl border border-indigo-100 overflow-hidden">
        <div 
          className="px-5 py-4 flex justify-between items-center cursor-pointer hover:bg-indigo-100/50 transition-colors"
          onClick={() => setShowTargets(!showTargets)}
        >
          <div className="flex items-center gap-2 text-indigo-900 font-medium">
            <Target className="w-5 h-5 text-indigo-600" />
            Daily Targets
          </div>
          <div className="text-sm text-indigo-600 font-medium">
            {showTargets ? 'Close' : 'Edit Targets'}
          </div>
        </div>
        
        {showTargets && (
          <form onSubmit={saveTargets} className="p-5 border-t border-indigo-100 bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Calories (kcal)</label>
                <input 
                  type="number" required
                  value={targets.calories}
                  onChange={e => setTargets({...targets, calories: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Protein (g)</label>
                <input 
                  type="number" required
                  value={targets.protein}
                  onChange={e => setTargets({...targets, protein: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Carbs (g)</label>
                <input 
                  type="number" required
                  value={targets.carbs}
                  onChange={e => setTargets({...targets, carbs: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Fat (g)</label>
                <input 
                  type="number" required
                  value={targets.fat}
                  onChange={e => setTargets({...targets, fat: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Save Targets
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Input Form */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingId ? 'Edit Macros' : 'Log Macros'}
          </h3>
          
          {!editingId && (
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setInputMode('manual')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${inputMode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Manual
              </button>
              <button
                onClick={() => setInputMode('ai')}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${inputMode === 'ai' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Assist
              </button>
            </div>
          )}
        </div>

        {inputMode === 'ai' && !editingId ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Describe your food/drink (English or Bahasa Indonesia)</label>
              <textarea 
                rows={3}
                placeholder="e.g. I just ate 2 slices of pepperoni pizza and a can of coke / Saya baru makan nasi padang dengan rendang dan telur dadar"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleAIAnalyze}
                disabled={isAnalyzing || !aiInput.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Macros'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4 space-y-1">
              <label className="text-sm font-medium text-gray-700">Food Description</label>
              <textarea
                rows={2}
                required
                placeholder="e.g. 2 boiled eggs and a cup of oatmeal / Nasi goreng dengan ayam dan telur"
                value={formData.foodDescription}
                onChange={e => setFormData({...formData, foodDescription: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <label className="text-sm font-medium text-gray-700">Protein (g)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  placeholder={`Target: ${targets.protein}g`}
                  value={formData.protein}
                  onChange={e => setFormData({...formData, protein: e.target.value})}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Carbs (g)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  placeholder={`Target: ${targets.carbs}g`}
                  value={formData.carbs}
                  onChange={e => setFormData({...formData, carbs: e.target.value})}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Fat (g)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  placeholder={`Target: ${targets.fat}g`}
                  value={formData.fat}
                  onChange={e => setFormData({...formData, fat: e.target.value})}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              
              <div className="sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-3 sm:py-2 rounded-md border border-gray-200 w-full sm:w-auto">
                  <PieChart className="w-4 h-4 text-indigo-500" />
                  <span>
                    Est. Calories: <strong className="text-gray-900">
                      {calculateCalories(Number(formData.fat) || 0, Number(formData.carbs) || 0, Number(formData.protein) || 0).toFixed(0)}
                    </strong> / {targets.calories} kcal
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={cancelEdit} 
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 sm:py-2.5 rounded-lg font-medium transition-colors"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  )}
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 sm:py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <FoodSpinner /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : (editingId ? 'Update Macros' : 'Save Macros')}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No macros recorded yet.
          </div>
        ) : (
          <div className="space-y-6">
            {visibleDates.map((date) => {
              const dayRecords = groupedRecords[date];
              const totalProtein = dayRecords.reduce((sum, r) => sum + Number(r.protein || 0), 0);
              const totalCarbs = dayRecords.reduce((sum, r) => sum + Number(r.carbs || 0), 0);
              const totalFat = dayRecords.reduce((sum, r) => sum + Number(r.fat || 0), 0);
              const totalCals = calculateCalories(totalFat, totalCarbs, totalProtein);
              
              const calPct = Math.min(100, (totalCals / targets.calories) * 100) || 0;
              const proteinPct = Math.min(100, (totalProtein / targets.protein) * 100) || 0;
              const carbsPct = Math.min(100, (totalCarbs / targets.carbs) * 100) || 0;
              const fatPct = Math.min(100, (totalFat / targets.fat) * 100) || 0;

              return (
                <div key={date} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center gap-3 flex-wrap">
                    <div className="font-semibold text-gray-900">{formatDate(date)}</div>
                    {(() => {
                      const pct = targets.calories > 0 ? (totalCals / targets.calories) * 100 : 0;
                      const isSuccess = pct >= 85 && pct <= 100;
                      const isWarning = pct < 85;
                      const isDanger = pct > 100;
                      const colorClass = isSuccess
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : isWarning
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-red-700 bg-red-50 border-red-200';
                      const iconClass = isSuccess
                        ? 'text-emerald-500'
                        : isWarning
                        ? 'text-amber-500'
                        : 'text-red-500';
                      const Icon = isSuccess ? CheckCircle2 : isWarning ? AlertTriangle : AlertCircle;
                      return (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${colorClass}`}>
                          <Icon className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />
                          <span>
                            <span className="text-base font-bold">{totalCals.toFixed(0)}</span>
                            <span className="font-normal opacity-70"> / {targets.calories} kcal</span>
                          </span>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                            isSuccess ? 'bg-emerald-100 text-emerald-700'
                            : isWarning ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                          }`}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="p-5">
                    {/* Daily Totals Progress Bars */}
                    <div className="space-y-4 mb-6">
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                        <div className={`h-2 rounded-full ${calPct > 100 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, calPct)}%` }}></div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-600 font-medium">Protein</span>
                          <span className="text-gray-500">{totalProtein.toFixed(1)}g / {targets.protein}g</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${proteinPct}%` }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-600 font-medium">Carbs</span>
                          <span className="text-gray-500">{totalCarbs.toFixed(1)}g / {targets.carbs}g</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${carbsPct}%` }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-600 font-medium">Fat</span>
                          <span className="text-gray-500">{totalFat.toFixed(1)}g / {targets.fat}g</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${fatPct}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Individual Logs */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Logs</h4>
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                        {dayRecords.map((record) => {
                          const recordCals = calculateCalories(record.fat, record.carbs, record.protein);
                          return (
                            <div key={record.id} className={`p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 group hover:bg-gray-50 transition-colors ${editingId === record.id ? 'bg-indigo-50/30' : 'bg-white'}`}>
                              <div className="flex-1 min-w-0">
                                {record.foodDescription ? (
                                  <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5" title={record.foodDescription}>
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                    <span className="truncate">{record.foodDescription}</span>
                                  </div>
                                ) : (
                                  <div className="text-sm font-medium text-gray-900">Manual Entry</div>
                                )}
                                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                  <span className="font-medium text-indigo-600">{recordCals.toFixed(0)} kcal</span>
                                  <span>P: {record.protein}g</span>
                                  <span>C: {record.carbs}g</span>
                                  <span>F: {record.fat}g</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 self-end sm:self-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEdit(record)}
                                  className="text-gray-400 hover:text-indigo-500 p-2 rounded-md hover:bg-indigo-50 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteRecord(record.id)}
                                  className="text-gray-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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

