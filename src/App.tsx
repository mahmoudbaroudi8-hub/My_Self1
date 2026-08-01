import React, { useState, useEffect } from 'react';
import {
  getClients,
  addClient,
  deleteClient,
  getPackages,
  addPackage,
  updatePackage,
  deletePackage,
  getOffers,
  addOffer,
  updateOffer,
  deleteOffer,
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  getSales,
  addSale,
  updateSale,
  deleteSale,
  getExpenses,
  addExpense,
  deleteExpense,
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
  seedInitialDataIfEmpty,
  subscribeClients,
  subscribePackages,
  subscribeOffers,
  subscribeSales,
  subscribeExpenses,
  subscribeProjects,
  subscribeTeamMembers,
} from './lib/firebase';
import { Client, Package, Offer, ProjectItem, Sale, Expense, TeamMember, SystemType, ScreenView, ALL_SCREENS_CONFIG } from './types';
import { Lock } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { QuickSaleButton } from './components/QuickSaleButton';
import { HomeScreen } from './components/HomeScreen';
import { PosScreen } from './components/PosScreen';
import { AddClientScreen } from './components/AddClientScreen';
import { ClientsScreen } from './components/ClientsScreen';
import { PackagesScreen } from './components/PackagesScreen';
import { SectorScreen } from './components/SectorScreen';
import { SalesScreen } from './components/SalesScreen';
import { ExpensesScreen } from './components/ExpensesScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { TeamScreen } from './components/TeamScreen';
import { LoginScreen } from './components/LoginScreen';
import { BackupModal } from './components/BackupModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('bm_is_logged_in') === 'true' || sessionStorage.getItem('bm_is_logged_in') === 'true';
  });

  const [currentScreen, setCurrentScreen] = useState<ScreenView>('home');
  const [selectedSector, setSelectedSector] = useState<SystemType>('محلات');

  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      alert('لتثبيت التطبيق على هاتفك أو جهازك:\n1. من المتصفح انقر على خيارات (⋮) أو زر المشاركة\n2. اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen)');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bm_is_logged_in');
    sessionStorage.removeItem('bm_is_logged_in');
    setIsLoggedIn(false);
  };

  // Firestore Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [isDesktopWide, setIsDesktopWide] = useState<boolean>(() => {
    const saved = localStorage.getItem('bm_desktop_wide');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleDesktopWide = () => {
    setIsDesktopWide((prev) => {
      const next = !prev;
      localStorage.setItem('bm_desktop_wide', String(next));
      return next;
    });
  };

  // Setup Real-time Listeners (onSnapshot)
  useEffect(() => {
    if (!isLoggedIn) return;

    let unsubClients: (() => void) | undefined;
    let unsubPackages: (() => void) | undefined;
    let unsubOffers: (() => void) | undefined;
    let unsubSales: (() => void) | undefined;
    let unsubExpenses: (() => void) | undefined;
    let unsubProjects: (() => void) | undefined;
    let unsubTeam: (() => void) | undefined;

    const setupSubscriptions = async () => {
      try {
        setLoading(true);
        await seedInitialDataIfEmpty();

        unsubClients = subscribeClients((cList) => setClients(cList));
        unsubPackages = subscribePackages((pList) => setPackages(pList));
        unsubOffers = subscribeOffers((oList) => setOffers(oList));
        unsubSales = subscribeSales((sList) => setSales(sList));
        unsubExpenses = subscribeExpenses((eList) => setExpenses(eList));
        unsubProjects = subscribeProjects((prList) => setProjects(prList));
        unsubTeam = subscribeTeamMembers((tList) => {
          setTeamMembers(tList);
          // Default active user to Owner or first team member if none set
          setCurrentUser((prev) => {
            if (prev) {
              const updated = tList.find((m) => m.id === prev.id);
              return updated || prev;
            }
            const owner = tList.find((m) => m.position === 'owner') || tList[0] || null;
            return owner;
          });
        });
      } catch (err) {
        console.error('Error initializing real-time subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };

    setupSubscriptions();

    return () => {
      if (unsubClients) unsubClients();
      if (unsubPackages) unsubPackages();
      if (unsubOffers) unsubOffers();
      if (unsubSales) unsubSales();
      if (unsubExpenses) unsubExpenses();
      if (unsubProjects) unsubProjects();
      if (unsubTeam) unsubTeam();
    };
  }, [isLoggedIn]);

  // Navigation Handler
  const handleNavigate = (screen: ScreenView, sector?: SystemType) => {
    if (sector) {
      setSelectedSector(sector);
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CRUD Actions
  const handleAddClient = async (clientData: Omit<Client, 'id'>) => {
    return await addClient(clientData);
  };

  const handleDeleteClient = async (id: string) => {
    await deleteClient(id);
  };

  const handleAddPackage = async (pkgData: Omit<Package, 'id'>) => {
    return await addPackage(pkgData);
  };

  const handleUpdatePackage = async (id: string, pkgData: Partial<Package>) => {
    await updatePackage(id, pkgData);
  };

  const handleDeletePackage = async (id: string) => {
    await deletePackage(id);
  };

  const handleAddOffer = async (offerData: Omit<Offer, 'id'>) => {
    return await addOffer(offerData);
  };

  const handleUpdateOffer = async (id: string, offerData: Partial<Offer>) => {
    await updateOffer(id, offerData);
  };

  const handleDeleteOffer = async (id: string) => {
    await deleteOffer(id);
  };

  const handleAddProject = async (projectData: Omit<ProjectItem, 'id'>) => {
    return await addProject(projectData);
  };

  const handleUpdateProject = async (id: string, projectData: Partial<ProjectItem>) => {
    await updateProject(id, projectData);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
  };

  const handleSaveSale = async (saleData: Omit<Sale, 'id'>) => {
    await addSale(saleData);
  };

  const handleUpdateSaleStatus = async (id: string, status: 'mowakad' | 'morsal_qabl_dafa') => {
    await updateSale(id, { status });
  };

  const handleDeleteSale = async (id: string) => {
    await deleteSale(id);
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
    return await addExpense(expenseData);
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
  };

  // If not logged in, render LoginScreen
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={() => setIsLoggedIn(true)}
        savedUsername={localStorage.getItem('bm_username') || 'admin'}
        installPrompt={installPrompt}
        onInstallApp={handleInstallApp}
        isAppInstalled={isAppInstalled}
      />
    );
  }

  const isScreenAllowed = (screen: ScreenView): boolean => {
    if (!currentUser) return true;
    if (currentUser.position === 'owner') return true;
    if (!currentUser.allowedScreens || currentUser.allowedScreens.length === 0) return true;
    return currentUser.allowedScreens.includes(screen);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-gray-100 font-['Cairo',sans-serif] selection:bg-[#FF7A1A]/30 flex flex-col justify-between relative overflow-x-clip">
      {/* Decorative Frosted Ambient Background Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] max-w-[500px] max-h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] max-w-[400px] max-h-[400px] bg-[#FF7A1A]/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Container wrapper for mobile frame or desktop wide alignment */}
      <div className={`w-full ${isDesktopWide ? 'max-w-md md:max-w-4xl lg:max-w-6xl' : 'max-w-md'} mx-auto min-h-screen flex flex-col relative shadow-2xl bg-[#0B1220] z-10 transition-all duration-300`}>
        {/* Navbar */}
        <Navbar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          sales={sales}
          clients={clients}
          currentUser={currentUser}
          onOpenBackup={() => setShowBackupModal(true)}
          onOpenInstallPwa={() => setShowPwaModal(true)}
          isDesktopWide={isDesktopWide}
          onToggleDesktopWide={toggleDesktopWide}
        />

        {/* Screen Content */}
        <main className="flex-1 px-3.5 pt-1 pb-28">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 space-y-3">
              <div className="w-10 h-10 border-4 border-[#FF7A1A] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-300 font-bold">جاري تحميل البيانات والتحديث التلقائي من Firestore...</p>
            </div>
          ) : (
            <ErrorBoundary onReset={() => handleNavigate('home')}>
              {!isScreenAllowed(currentScreen) ? (
                <div className="glass-card p-6 text-center space-y-4 max-w-md mx-auto my-12 border-2 border-red-500/40 bg-[#0B1220]/90 shadow-2xl animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-sm font-extrabold text-white">
                    شاشة محظورة ({ALL_SCREENS_CONFIG.find((s) => s.id === currentScreen)?.label || currentScreen})
                  </h2>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    الحساب الحالي (<span className="text-[#FF7A1A] font-bold">{currentUser?.name}</span>) لا يمتلك صلاحية لعرض هذه الشاشة. يرجى التواصل مع صاحب المشروع (البارودي) لتفعيل الصلاحية لك من شاشة إدارة الفريق.
                  </p>
                  <button
                    onClick={() => handleNavigate('home')}
                    className="btn-orange px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg"
                  >
                    الرجوع للشاشة الرئيسية
                  </button>
                </div>
              ) : (
                <>
                  {currentScreen === 'home' && (
                    <HomeScreen
                      sales={sales}
                      expenses={expenses}
                      onNavigate={handleNavigate}
                      onOpenInstallPwa={() => setShowPwaModal(true)}
                    />
                  )}

                  {currentScreen === 'pos' && (
                    <PosScreen
                      clients={clients}
                      packages={packages}
                      offers={offers}
                      onSaveSale={handleSaveSale}
                      onNavigate={handleNavigate}
                    />
                  )}

                  {currentScreen === 'add-client' && (
                    <AddClientScreen onAddClient={handleAddClient} onNavigate={handleNavigate} />
                  )}

                  {currentScreen === 'clients' && (
                    <ClientsScreen
                      clients={clients}
                      sales={sales}
                      onDeleteClient={handleDeleteClient}
                      onNavigate={handleNavigate}
                    />
                  )}

                  {currentScreen === 'packages' && (
                    <PackagesScreen
                      packages={packages}
                      offers={offers}
                      projects={projects}
                      teamMembers={teamMembers}
                      onAddPackage={handleAddPackage}
                      onUpdatePackage={handleUpdatePackage}
                      onDeletePackage={handleDeletePackage}
                      onAddOffer={handleAddOffer}
                      onUpdateOffer={handleUpdateOffer}
                      onDeleteOffer={handleDeleteOffer}
                      onAddProject={handleAddProject}
                      onUpdateProject={handleUpdateProject}
                      onDeleteProject={handleDeleteProject}
                      onLogout={handleLogout}
                      installPrompt={installPrompt}
                      onInstallApp={handleInstallApp}
                      isAppInstalled={isAppInstalled}
                    />
                  )}

                  {currentScreen === 'team' && (
                    <TeamScreen
                      teamMembers={teamMembers}
                      projects={projects}
                      currentUser={currentUser}
                      onSwitchUser={(user) => setCurrentUser(user)}
                      onAddTeamMember={(m) => addTeamMember(m)}
                      onUpdateTeamMember={async (id, m) => {
                        await updateTeamMember(id, m);
                      }}
                      onDeleteTeamMember={async (id) => {
                        await deleteTeamMember(id);
                      }}
                    />
                  )}

                  {currentScreen === 'sector' && (
                    <SectorScreen
                      sectorName={selectedSector}
                      sales={sales}
                      expenses={expenses}
                      clients={clients}
                      onNavigate={handleNavigate}
                    />
                  )}

                  {currentScreen === 'sales' && (
                    <SalesScreen
                      sales={sales}
                      onUpdateSaleStatus={handleUpdateSaleStatus}
                      onDeleteSale={handleDeleteSale}
                      onNavigate={handleNavigate}
                    />
                  )}

                  {currentScreen === 'expenses' && (
                    <ExpensesScreen
                      expenses={expenses}
                      onAddExpense={handleAddExpense}
                      onDeleteExpense={handleDeleteExpense}
                    />
                  )}

                  {currentScreen === 'reports' && (
                    <ReportsScreen
                      sales={sales}
                      expenses={expenses}
                      clients={clients}
                      packages={packages}
                    />
                  )}
                </>
              )}
            </ErrorBoundary>
          )}
        </main>

        {/* Global Quick Sale Floating Action Button (+) */}
        <QuickSaleButton currentScreen={currentScreen} onOpenPos={() => handleNavigate('pos')} />

        {/* Global Bottom Navigation */}
        <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />

        {/* Backup & Restore Modal */}
        {showBackupModal && (
          <BackupModal
            clients={clients}
            packages={packages}
            offers={offers}
            projects={projects}
            sales={sales}
            expenses={expenses}
            onClose={() => setShowBackupModal(false)}
          />
        )}

        {/* PWA Mobile Installation Modal */}
        <InstallPwaModal
          isOpen={showPwaModal}
          onClose={() => setShowPwaModal(false)}
          installPrompt={installPrompt}
          onInstallApp={handleInstallApp}
          isAppInstalled={isAppInstalled}
        />
      </div>
    </div>
  );
}
