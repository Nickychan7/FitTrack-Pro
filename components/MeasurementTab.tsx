'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, Edit2, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function TapeMeasureSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="14 42" strokeLinecap="round" />
      <rect x="7" y="10.5" width="10" height="3" rx="1" fill="currentColor" opacity="0.4" />
      <line x1="9" y1="10.5" x2="9" y2="13.5" stroke="currentColor" strokeWidth="0.8" />
      <line x1="11" y1="10.5" x2="11" y2="13.5" stroke="currentColor" strokeWidth="0.8" />
      <line x1="13" y1="10.5" x2="13" y2="13.5" stroke="currentColor" strokeWidth="0.8" />
      <line x1="15" y1="10.5" x2="15" y2="13.5" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

type MeasurementRecord = {
  id: string;
  userId: string;
  date: string;
  bodyweight: number;
  waist: number;
  arms: number;
  armsLeft?: number;
  chest: number;
  thigh: number;
  shoulder?: number;
  bodyFat?: number;
  bodyMuscle?: number;
};

export default function MeasurementTab({ userId }: { userId: string }) {
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bodyweight: '',
    waist: '',
    arms: '',
    armsLeft: '',
    chest: '',
    thigh: '',
    shoulder: '',
    bodyFat: '',
    bodyMuscle: '',
  });

  useEffect(() => {
    fetchRecords();
  }, [userId]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/measurements?userId=${userId}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newRecord: MeasurementRecord = {
      id: editingId || crypto.randomUUID(),
      userId,
      date: formData.date,
      bodyweight: Number(formData.bodyweight),
      waist: Number(formData.waist),
      arms: Number(formData.arms),
      armsLeft: formData.armsLeft ? Number(formData.armsLeft) : undefined,
      chest: Number(formData.chest),
      thigh: Number(formData.thigh),
      shoulder: formData.shoulder ? Number(formData.shoulder) : undefined,
      bodyFat: formData.bodyFat ? Number(formData.bodyFat) : undefined,
      bodyMuscle: formData.bodyMuscle ? Number(formData.bodyMuscle) : undefined,
    };
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      await fetch('/api/data/measurements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
      
      await fetchRecords();
      
      setEditingId(null);
      setFormData(prev => ({
        ...prev,
        bodyweight: '',
        waist: '',
        arms: '',
        armsLeft: '',
        chest: '',
        thigh: '',
        shoulder: '',
        bodyFat: '',
        bodyMuscle: '',
      }));
    } catch (error) {
      alert('Failed to save record.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (record: MeasurementRecord) => {
    setEditingId(record.id);
    setFormData({
      date: record.date,
      bodyweight: record.bodyweight.toString(),
      waist: record.waist.toString(),
      arms: record.arms.toString(),
      armsLeft: record.armsLeft?.toString() || '',
      chest: record.chest.toString(),
      thigh: record.thigh.toString(),
      shoulder: record.shoulder?.toString() || '',
      bodyFat: record.bodyFat?.toString() || '',
      bodyMuscle: record.bodyMuscle?.toString() || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(prev => ({
      ...prev,
      bodyweight: '',
      waist: '',
      arms: '',
      armsLeft: '',
      chest: '',
      thigh: '',
      shoulder: '',
      bodyFat: '',
      bodyMuscle: '',
    }));
  };

  const deleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await fetch(`/api/data/measurements?id=${id}`, { method: 'DELETE' });
        await fetchRecords();
        if (editingId === id) cancelEdit();
      } catch (error) {
        alert('Failed to delete record.');
      }
    }
  };

  const renderDiff = (current: number | undefined, previous: number | undefined, invertColors: boolean = false) => {
    if (current === undefined || previous === undefined || current === previous) {
      return <span className="text-gray-300 inline-flex items-center ml-1"><Minus className="w-3 h-3" /></span>;
    }
    const diff = current - previous;
    const isPositive = diff > 0;
    
    const isGood = invertColors ? !isPositive : isPositive;
    const color = isGood ? 'text-emerald-500' : 'text-rose-500';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <span className={`text-xs ml-1 inline-flex items-center font-medium ${color}`} title={`${isPositive ? '+' : ''}${diff.toFixed(1)} from previous`}>
        <Icon className="w-3 h-3 mr-0.5" />
        {Math.abs(diff).toFixed(1)}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingId ? 'Edit Measurement' : 'Add New Measurement'}
          </h3>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
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
            <label className="text-sm font-medium text-gray-700">Bodyweight (kg)</label>
            <input 
              type="number" 
              step="0.1"
              required
              placeholder="e.g. 75.5"
              value={formData.bodyweight}
              onChange={e => setFormData({...formData, bodyweight: e.target.value})}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Waist (cm)</label>
            <input 
              type="number" 
              step="0.1"
              required
              placeholder="e.g. 80"
              value={formData.waist}
              onChange={e => setFormData({...formData, waist: e.target.value})}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Arms R (cm)</label>
            <input 
              type="number" 
              step="0.1"
              required
              placeholder="e.g. 35"
              value={formData.arms}
              onChange={e => setFormData({...formData, arms: e.target.value})}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Arms L (cm) <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input 
              type="number" 
              step="0.1"
              placeholder="e.g. 34.5"
              value={formData.armsLeft}
              onChange={e => setFormData({...formData, armsLeft: e.target.value})}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Chest (cm)</label>
            <input 
              type="number" 
              step="0.1"
              required
              placeholder="e.g. 100"
              value={formData.chest}
              onChange={e => setFormData({...formData, chest: e.target.value})}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Thigh (cm)</label>
            <input 
              type="number" 
              step="0.1"
              required
              placeholder="e.g. 60"
              value={formData.thigh}
              onChange={e => setFormData({...formData, thigh: e.target.value})}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Shoulder Diameter <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input 
              type="number" 
              step="0.1"
              placeholder="e.g. 45"
              value={formData.shoulder}
              onChange={e => setFormData({...formData, shoulder: e.target.value})}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Body Fat % <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input 
              type="number" 
              step="0.1"
              placeholder="e.g. 15.5"
              value={formData.bodyFat}
              onChange={e => setFormData({...formData, bodyFat: e.target.value})}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Muscle % <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input 
              type="number" 
              step="0.1"
              placeholder="e.g. 40.2"
              value={formData.bodyMuscle}
              onChange={e => setFormData({...formData, bodyMuscle: e.target.value})}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 sm:py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <TapeMeasureSpinner /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : (editingId ? 'Update Measurement' : 'Save Measurement')}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
        {isLoading ? (
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Weight</th>
                  <th className="px-4 py-3 font-medium">Fat %</th>
                  <th className="px-4 py-3 font-medium">Muscle %</th>
                  <th className="px-4 py-3 font-medium">Waist</th>
                  <th className="px-4 py-3 font-medium">Arms R</th>
                  <th className="px-4 py-3 font-medium">Arms L</th>
                  <th className="px-4 py-3 font-medium">Chest</th>
                  <th className="px-4 py-3 font-medium">Thigh</th>
                  <th className="px-4 py-3 font-medium">Shoulder</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-14"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-14"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-14"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-14"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-14"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-14"></div></td>
                    <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No measurements recorded yet.
          </div>
        ) : (
          <>
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Weight</th>
                  <th className="px-4 py-3 font-medium">Fat %</th>
                  <th className="px-4 py-3 font-medium">Muscle %</th>
                  <th className="px-4 py-3 font-medium">Waist</th>
                  <th className="px-4 py-3 font-medium">Arms R</th>
                  <th className="px-4 py-3 font-medium">Arms L</th>
                  <th className="px-4 py-3 font-medium">Chest</th>
                  <th className="px-4 py-3 font-medium">Thigh</th>
                  <th className="px-4 py-3 font-medium">Shoulder</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.slice(0, visibleCount).map((record, index) => {
                  const prevRecord = records[index + 1];
                  
                  return (
                    <tr key={record.id} className={`hover:bg-gray-50/50 transition-colors ${editingId === record.id ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatDate(record.date)}</td>
                      <td className="px-4 py-3">
                        {record.bodyweight}kg
                        {renderDiff(record.bodyweight, prevRecord?.bodyweight, true)}
                      </td>
                      <td className="px-4 py-3">
                        {record.bodyFat ? `${record.bodyFat}%` : '-'}
                        {renderDiff(record.bodyFat, prevRecord?.bodyFat, true)}
                      </td>
                      <td className="px-4 py-3">
                        {record.bodyMuscle ? `${record.bodyMuscle}%` : '-'}
                        {renderDiff(record.bodyMuscle, prevRecord?.bodyMuscle, false)}
                      </td>
                      <td className="px-4 py-3">
                        {record.waist}cm
                        {renderDiff(record.waist, prevRecord?.waist, true)}
                      </td>
                      <td className="px-4 py-3">
                        {record.arms}cm
                        {renderDiff(record.arms, prevRecord?.arms, false)}
                      </td>
                      <td className="px-4 py-3">
                        {record.armsLeft ? `${record.armsLeft}cm` : '-'}
                        {renderDiff(record.armsLeft, prevRecord?.armsLeft, false)}
                      </td>
                      <td className="px-4 py-3">
                        {record.chest}cm
                        {renderDiff(record.chest, prevRecord?.chest, false)}
                      </td>
                      <td className="px-4 py-3">
                        {record.thigh}cm
                        {renderDiff(record.thigh, prevRecord?.thigh, false)}
                      </td>
                      <td className="px-4 py-3">
                        {record.shoulder ? `${record.shoulder}cm` : '-'}
                        {renderDiff(record.shoulder, prevRecord?.shoulder, false)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(record)}
                            className="text-indigo-500 hover:text-indigo-700 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                            title="Edit record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteRecord(record.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {visibleCount < records.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="px-6 py-2.5 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm"
              >
                Load More ({records.length - visibleCount} remaining)
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
