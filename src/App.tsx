/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Lock, 
  Unlock,
  ChevronRight,
  BookOpen,
  DollarSign,
  Award,
  Camera
} from 'lucide-react';

// --- Types ---

interface Setting {
  mission_statement: string;
  experience: string;
  pricing_info: string;
  profile_image: string;
}

interface Availability {
  id: number;
  start_time: string;
  end_time: string;
  type: 'individual' | 'group';
  description: string;
}

interface Booking extends Availability {
  user_name: string;
  user_email: string;
  created_at: string;
}

// --- Components ---

const AdminLogin = ({ onLogin, isSet }: { onLogin: (pw: string, isSetup: boolean) => Promise<void>, isSet: boolean }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('Password cannot be empty');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onLogin(password, !isSet);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-100 rounded-full">
            <Lock className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">
          {!isSet ? 'Set Admin Password' : 'Admin Access'}
        </h2>
        <p className="text-gray-500 text-center mb-6">
          {!isSet 
            ? 'Create a password to manage your tutoring sessions. This cannot be changed later.' 
            : 'Enter your password to enter admin mode.'}
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter password"
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none mb-4 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            !isSet ? 'Set Password' : 'Login'
          )}
        </button>
        
        <button 
          onClick={() => window.location.reload()} 
          className="w-full mt-4 text-stone-400 text-sm hover:text-stone-600 transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
};

const EditableText = ({ 
  value, 
  onSave, 
  isAdmin, 
  multiline = false,
  className = "" 
}: { 
  value: string, 
  onSave: (val: string) => void, 
  isAdmin: boolean,
  multiline?: boolean,
  className?: string
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  if (isAdmin && isEditing) {
    return (
      <div className="relative w-full">
        {multiline ? (
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${className}`}
            rows={4}
          />
        ) : (
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${className}`}
          />
        )}
        <div className="flex gap-2 mt-2 justify-end">
          <button onClick={() => setIsEditing(false)} className="p-1 text-gray-400 hover:text-red-500"><X size={18}/></button>
          <button onClick={() => { onSave(tempValue); setIsEditing(false); }} className="p-1 text-emerald-600 hover:text-emerald-700"><Check size={18}/></button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative ${className}`}>
      <p className="whitespace-pre-wrap">{value}</p>
      {isAdmin && (
        <button 
          onClick={() => { setTempValue(value); setIsEditing(true); }}
          className="absolute -top-2 -right-2 p-1.5 bg-white shadow-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600"
        >
          <Edit3 size={14} />
        </button>
      )}
    </div>
  );
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthSet, setIsAuthSet] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [settings, setSettings] = useState<Setting>({
    mission_statement: '',
    experience: '',
    pricing_info: '',
    profile_image: ''
  });
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'booking' | 'pricing'>('home');
  const [bookingForm, setBookingForm] = useState<{ slotId: number | null, name: string, email: string }>({ slotId: null, name: '', email: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAuthStatus();
    fetchSettings();
    fetchAvailability();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchBookings();
    }
  }, [isAdmin]);

  const fetchAuthStatus = async () => {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    setIsAuthSet(data.isSet);
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    setSettings(data);
  };

  const fetchAvailability = async () => {
    const res = await fetch('/api/availability');
    const data = await res.json();
    setAvailability(data);
  };

  const fetchBookings = async () => {
    const res = await fetch('/api/bookings', {
      headers: { 'x-admin-password': adminPassword }
    });
    const data = await res.json();
    setBookings(data);
  };

  const handleAdminLogin = async (pw: string, isSetup: boolean) => {
    if (isSetup) {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw })
      });
      
      if (res.ok) {
        setIsAuthSet(true);
        setAdminPassword(pw);
        setIsAdmin(true);
        setShowLogin(false);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to set password');
      }
    } else {
      // Test password with a simple settings fetch
      const res = await fetch('/api/settings', {
        headers: { 'x-admin-password': pw }
      });
      
      if (res.ok) {
        setAdminPassword(pw);
        setIsAdmin(true);
        setShowLogin(false);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Incorrect password');
      }
    }
  };

  const updateSetting = async (key: string, value: string) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword
      },
      body: JSON.stringify({ key, value })
    });
    if (res.ok) {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const addAvailability = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      type: formData.get('type'),
      description: formData.get('description')
    };

    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword
      },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      fetchAvailability();
      (e.target as HTMLFormElement).reset();
    }
  };

  const deleteAvailability = async (id: number) => {
    const res = await fetch(`/api/availability/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': adminPassword }
    });
    if (res.ok) fetchAvailability();
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        availability_id: bookingForm.slotId,
        user_name: bookingForm.name,
        user_email: bookingForm.email
      })
    });
    if (res.ok) {
      alert('Booking successful! Alessandro has been notified.');
      setBookingForm({ slotId: null, name: '', email: '' });
      fetchAvailability();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSetting('profile_image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-800 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Alessandro Tutors</h1>
          </div>
          
          <div className="flex items-center gap-8">
            <button onClick={() => setActiveTab('home')} className={`text-sm font-medium transition-colors ${activeTab === 'home' ? 'text-emerald-600' : 'text-stone-500 hover:text-stone-900'}`}>Home</button>
            <button onClick={() => setActiveTab('booking')} className={`text-sm font-medium transition-colors ${activeTab === 'booking' ? 'text-emerald-600' : 'text-stone-500 hover:text-stone-900'}`}>Book a Lesson</button>
            <button onClick={() => setActiveTab('pricing')} className={`text-sm font-medium transition-colors ${activeTab === 'pricing' ? 'text-emerald-600' : 'text-stone-500 hover:text-stone-900'}`}>Pricing</button>
            
            <button 
              onClick={() => {
                if (isAdmin) {
                  setIsAdmin(false);
                  setAdminPassword('');
                } else {
                  fetchAuthStatus().then(() => setShowLogin(true));
                }
              }}
              className={`p-2 rounded-full transition-colors ${isAdmin ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
            >
              {isAdmin ? <Unlock size={18} /> : <Lock size={18} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-20"
            >
              {/* Hero Section */}
              <section className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <span className="text-emerald-600 font-semibold tracking-wider uppercase text-xs">Welcome to Alessandro Tutors</span>
                    <h2 className="text-5xl font-bold leading-tight text-stone-900">
                      Master your subjects with confidence.
                    </h2>
                    <EditableText 
                      value={settings.mission_statement} 
                      onSave={(val) => updateSetting('mission_statement', val)}
                      isAdmin={isAdmin}
                      multiline
                      className="text-xl text-stone-500 leading-relaxed"
                    />
                  </div>
                  <button 
                    onClick={() => setActiveTab('booking')}
                    className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all hover:-translate-y-1"
                  >
                    Get Started
                  </button>
                </div>
                
                <div className="relative">
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl relative group">
                    <img 
                      src={settings.profile_image || 'https://picsum.photos/seed/tutor/400/400'} 
                      alt="Alessandro" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isAdmin && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Camera className="mb-2" />
                        <span className="text-sm font-medium">Change Photo</span>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageUpload} 
                          className="hidden" 
                          accept="image/*"
                        />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-stone-100 hidden lg:block">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <Award />
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">Certified Expert</p>
                        <p className="text-sm text-stone-500">5+ Years Experience</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Experience Section */}
              <section className="bg-stone-50 rounded-[2.5rem] p-12 md:p-20">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-sm font-medium text-stone-600">
                    <BookOpen size={16} className="text-emerald-600" />
                    Tutoring Experience
                  </div>
                  <EditableText 
                    value={settings.experience} 
                    onSave={(val) => updateSetting('experience', val)}
                    isAdmin={isAdmin}
                    multiline
                    className="text-2xl md:text-3xl font-medium text-stone-800 leading-relaxed"
                  />
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'booking' && (
            <motion.div 
              key="booking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-stone-900">Available Sessions</h2>
                <p className="text-stone-500">Choose a time that works for you and book your lesson instantly.</p>
              </div>

              {isAdmin && (
                <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Plus className="text-emerald-600" /> Add Availability
                  </h3>
                  <form onSubmit={addAvailability} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Start Time</label>
                      <input name="start_time" type="datetime-local" required className="w-full p-3 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-400">End Time</label>
                      <input name="end_time" type="datetime-local" required className="w-full p-3 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Type</label>
                      <select name="type" className="w-full p-3 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="individual">Individual</option>
                        <option value="group">Group</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Description</label>
                      <input name="description" placeholder="e.g. Calculus BC" className="w-full p-3 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="lg:col-span-4">
                      <button type="submit" className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-colors">
                        Add Slot
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availability.map(slot => (
                  <div key={slot.id} className="bg-white border border-stone-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${slot.type === 'individual' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {slot.type}
                      </div>
                      {isAdmin && (
                        <button onClick={() => deleteAvailability(slot.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-stone-600">
                        <Calendar size={16} />
                        <span className="text-sm font-medium">{new Date(slot.start_time).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-600">
                        <Clock size={16} />
                        <span className="text-sm font-medium">
                          {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-stone-900 font-semibold mt-2">{slot.description || 'No description provided'}</p>
                    </div>
                    <button 
                      onClick={() => setBookingForm(prev => ({ ...prev, slotId: slot.id }))}
                      className="w-full mt-6 py-3 bg-stone-50 text-stone-900 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      Book Now <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {isAdmin && (
                <div className="mt-20 space-y-8">
                  <h3 className="text-2xl font-bold text-stone-900">Upcoming Booked Sessions</h3>
                  <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Student</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Time</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Type</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Topic</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {bookings.map(booking => (
                          <tr key={booking.id} className="hover:bg-stone-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-stone-900">{booking.user_name}</div>
                              <div className="text-xs text-stone-500">{booking.user_email}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-600">
                              {new Date(booking.start_time).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${booking.type === 'individual' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                {booking.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-600">{booking.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'pricing' && (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-stone-900">Simple, Transparent Pricing</h2>
                <p className="text-stone-500">Quality education shouldn't be complicated. Choose the plan that fits your needs.</p>
              </div>

              <div className="bg-white border border-stone-200 rounded-[2.5rem] p-12 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16" />
                <div className="relative space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
                      <DollarSign size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900">Rates & Packages</h3>
                  </div>
                  <EditableText 
                    value={settings.pricing_info} 
                    onSave={(val) => updateSetting('pricing_info', val)}
                    isAdmin={isAdmin}
                    multiline
                    className="text-xl text-stone-600 leading-relaxed"
                  />
                  <div className="pt-8 border-t border-stone-100">
                    <p className="text-sm text-stone-400 italic">* All sessions include personalized study materials and follow-up support.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingForm.slotId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingForm({ slotId: null, name: '', email: '' })}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl"
            >
              <button 
                onClick={() => setBookingForm({ slotId: null, name: '', email: '' })}
                className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="text-2xl font-bold mb-2">Book Your Session</h3>
              <p className="text-stone-500 mb-8">Please provide your details to confirm the booking.</p>
              
              <form onSubmit={handleBooking} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                    <User size={14} /> Full Name
                  </label>
                  <input 
                    required
                    value={bookingForm.name}
                    onChange={e => setBookingForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-4 bg-stone-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                    <Mail size={14} /> Email Address
                  </label>
                  <input 
                    required
                    type="email"
                    value={bookingForm.email}
                    onChange={e => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-4 bg-stone-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="john@example.com"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                >
                  Confirm Booking
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      {showLogin && (
        <AdminLogin 
          isSet={isAuthSet} 
          onLogin={handleAdminLogin} 
        />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-100 mt-20 py-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <span className="font-bold text-stone-900">Alessandro Tutors</span>
          </div>
          <p className="text-stone-400 text-sm">© 2026 Alessandro Tutors. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-stone-400 hover:text-stone-900 transition-colors"><Mail size={20} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
