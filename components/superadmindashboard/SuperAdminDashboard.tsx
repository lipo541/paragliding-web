'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddLocationFly from './addlocation/AddLocationFly';
import AddCountry from './addcountry/AddCountry';
import AddCountryPage from './addcountry/AddCountryPage';
import LocationsList from './addlocation/LocationsList';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [editLocationId, setEditLocationId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Container */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 border-r border-foreground/10 min-h-screen bg-background">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground">CMS Panel</h1>
            <p className="text-xs text-foreground/60 mt-1">Super Admin</p>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-foreground text-background'
                  : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              მთავარი
            </button>

            <button
              onClick={() => setActiveTab('addcountry')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'addcountry'
                  ? 'bg-foreground text-background'
                  : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              დაამატე ქვეყანა
            </button>

            <button
              onClick={() => setActiveTab('countrycontent')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'countrycontent'
                  ? 'bg-foreground text-background'
                  : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              ქვეყნების კონტენტი
            </button>

            <button
              onClick={() => setActiveTab('addlocation')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'addlocation'
                  ? 'bg-foreground text-background'
                  : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ლოკაციის დამატება
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-foreground text-background'
                  : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              მომხმარებლები
            </button>

            <button
              onClick={() => setActiveTab('pilots')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'pilots'
                  ? 'bg-foreground text-background'
                  : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              პილოტები
            </button>

            <button
              onClick={() => setActiveTab('companies')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'companies'
                  ? 'bg-foreground text-background'
                  : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              კომპანიები
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-foreground text-background'
                  : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              პარამეტრები
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background border-b border-foreground/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {activeTab === 'overview' && 'მთავარი გვერდი'}
                  {activeTab === 'addcountry' && 'დაამატე ქვეყანა'}
                  {activeTab === 'countrycontent' && 'ქვეყნების კონტენტი'}
                  {activeTab === 'addlocation' && 'ლოკაციის დამატება'}
                  {activeTab === 'users' && 'მომხმარებლები'}
                  {activeTab === 'pilots' && 'პილოტები'}
                  {activeTab === 'companies' && 'კომპანიები'}
                  {activeTab === 'settings' && 'პარამეტრები'}
                </h2>
                {activeTab === 'addlocation' && !showAddLocationForm && (
                  <button
                    onClick={() => setShowAddLocationForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                  >
                    დაამატე ლოკაცია
                  </button>
                )}
              </div>
              <button
                onClick={() => router.push('/ka')}
                className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground border border-foreground/20 rounded-md hover:bg-foreground/5 transition-colors"
              >
                უკან დაბრუნება
              </button>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stats Cards */}
                <div className="p-6 rounded-lg border border-foreground/10 bg-background">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground/60">მომხმარებლები</p>
                      <p className="text-2xl font-bold text-foreground mt-2">1,234</p>
                    </div>
                    <div className="p-3 rounded-full bg-foreground/10">
                      <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg border border-foreground/10 bg-background">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground/60">პილოტები</p>
                      <p className="text-2xl font-bold text-foreground mt-2">45</p>
                    </div>
                    <div className="p-3 rounded-full bg-foreground/10">
                      <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg border border-foreground/10 bg-background">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground/60">კომპანიები</p>
                      <p className="text-2xl font-bold text-foreground mt-2">12</p>
                    </div>
                    <div className="p-3 rounded-full bg-foreground/10">
                      <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg border border-foreground/10 bg-background">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground/60">აქტიური</p>
                      <p className="text-2xl font-bold text-foreground mt-2">892</p>
                    </div>
                    <div className="p-3 rounded-full bg-foreground/10">
                      <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'addcountry' && <AddCountry />}

            {activeTab === 'countrycontent' && <AddCountryPage />}

            {activeTab === 'addlocation' && showAddLocationForm && (
              <AddLocationFly 
                onBack={() => {
                  setShowAddLocationForm(false);
                  setEditLocationId(null);
                }} 
                editLocationId={editLocationId}
              />
            )}

            {activeTab === 'addlocation' && !showAddLocationForm && (
              <LocationsList onEdit={(locationId) => {
                setEditLocationId(locationId);
                setShowAddLocationForm(true);
              }} />
            )}

            {activeTab === 'users' && (
              <div className="bg-background rounded-lg border border-foreground/10 p-6">
                <p className="text-foreground/60">მომხმარებლების მართვა - განვითარების პროცესშია</p>
              </div>
            )}

            {activeTab === 'pilots' && (
              <div className="bg-background rounded-lg border border-foreground/10 p-6">
                <p className="text-foreground/60">პილოტების მართვა - განვითარების პროცესშია</p>
              </div>
            )}

            {activeTab === 'companies' && (
              <div className="bg-background rounded-lg border border-foreground/10 p-6">
                <p className="text-foreground/60">კომპანიების მართვა - განვითარების პროცესშია</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-background rounded-lg border border-foreground/10 p-6">
                <p className="text-foreground/60">პარამეტრები - განვითარების პროცესშია</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
