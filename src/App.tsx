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
  getPayments,
  addPayment,
  deletePayment,
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
  subscribePayments,
  subscribeProjects,
  subscribeTeamMembers,
  subscribeLeads,
  addLead,
  updateLead,
  deleteLead,
  updateClient,
} from './lib/firebase';
import { Client, Package, Offer, ProjectItem, Sale, Expense, Payment, TeamMember, SystemType, ScreenView, ALL_SCREENS_CONFIG, Lead } from './types';
import { isScreenAllowedForUser, getFirstAllowedScreen } from './lib/permissions';
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
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true;
      return isStandalone;
    }
    return false;
  });

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (isStandalone) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      // If browser fires beforeinstallprompt, app is not installed
      const currentStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true;
      if (!currentStandalone) {
        setIsAppInstalled(false);
      }
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
      setShowPwaModal(false);
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
    localStorage.removeItem('bm_active_user_id');
    sessionStorage.removeItem('bm_active_user_id');
    localStorage.removeItem('bm_username');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentScreen('home');
  };

  const handleSwitchUser = (user: TeamMember) => {
    setCurrentUser(user);
    const activeUserId = user.id;
    if (localStorage.getItem('bm_is_logged_in') === 'true') {
      localStorage.setItem('bm_active_user_id', activeUserId);
      sessionStorage.removeItem('bm_active_user_id');
    } else {
      sessionStorage.setItem('bm_active_user_id', activeUserId);
      localStorage.removeItem('bm_active_user_id');
    }
    const allowed = getFirstAllowedScreen(user);
    setCurrentScreen(allowed);
  };

  // Firestore Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);

  // Active Sale being edited
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Active Lead being confirmed in POS
  const [prefilledLead, setPrefilledLead] = useState<Lead | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);

  // 1. Always subscribe to team members in real-time so LoginScreen & auth state are up-to-date
  useEffect(() => {
    let unsubTeam: (() => void) | undefined;
    const initTeam = async () => {
      try {
        await seedInitialDataIfEmpty();
        unsubTeam = subscribeTeamMembers((tList) => {
          setTeamMembers(tList);
        });
      } catch (err) {
        console.error('Error fetching team members:', err);
      }
    };
    initTeam();
    return () => {
      if (unsubTeam) unsubTeam();
    };
  }, []);

  // 2. Synchronize currentUser with activeUserId and teamMembers list
  useEffect(() => {
    if (!isLoggedIn) {
      if (currentUser !== null) {
        setCurrentUser(null);
      }
      return;
    }

    const activeUserId =
      localStorage.getItem('bm_active_user_id') || sessionStorage.getItem('bm_active_user_id');

    if (!activeUserId) {
      handleLogout();
      return;
    }

    let found = teamMembers.find((m) => m.id === activeUserId);
    if (!found && activeUserId === 'owner-default') {
      found = teamMembers.find((m) => m.position === 'owner') || {
        id: 'owner-default',
        name: 'صاحب المشروع (البارودي)',
        email: 'admin@system.local',
        phone: '01000000000',
        username: 'admin',
        position: 'owner',
        defaultCommissionRate: 10,
        isActive: true,
        allowedScreens: [
          'home',
          'pos',
          'add-client',
          'clients',
          'packages',
          'sector',
          'sales',
          'expenses',
          'reports',
          'team',
        ],
        permissions: {
          canManageProjects: true,
          canManageSales: true,
          canManagePackages: true,
          canViewExpenses: true,
          canManageTeam: true,
          canViewReports: true,
          canConfirmLeads: true,
        },
      };
    }

    if (found) {
      if (found.isActive === false) {
        alert('تم تعطيل هذا الحساب من قبل صاحب المشروع.');
        handleLogout();
        return;
      }
      setCurrentUser(found);
    } else if (teamMembers.length > 0) {
      // User ID no longer exists in database -> account removed -> logout
      handleLogout();
    }
  }, [isLoggedIn, teamMembers]);

  // 3. Setup remaining Real-time Listeners (clients, packages, sales, etc.) when logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    let unsubClients: (() => void) | undefined;
    let unsubPackages: (() => void) | undefined;
    let unsubOffers: (() => void) | undefined;
    let unsubSales: (() => void) | undefined;
    let unsubExpenses: (() => void) | undefined;
    let unsubPayments: (() => void) | undefined;
    let unsubProjects: (() => void) | undefined;
    let unsubLeads: (() => void) | undefined;

    const setupDataSubscriptions = async () => {
      try {
        setLoading(true);
        unsubClients = subscribeClients((cList) => setClients(cList));
        unsubPackages = subscribePackages((pList) => setPackages(pList));
        unsubOffers = subscribeOffers((oList) => setOffers(oList));
        unsubSales = subscribeSales((sList) => setSales(sList));
        unsubExpenses = subscribeExpenses((eList) => setExpenses(eList));
        unsubPayments = subscribePayments((payList) => setPayments(payList));
        unsubProjects = subscribeProjects((prList) => setProjects(prList));
        unsubLeads = subscribeLeads((lList) => setLeads(lList));
      } catch (err) {
        console.error('Error initializing data subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };

    setupDataSubscriptions();

    return () => {
      if (unsubClients) unsubClients();
      if (unsubPackages) unsubPackages();
      if (unsubOffers) unsubOffers();
      if (unsubSales) unsubSales();
      if (unsubExpenses) unsubExpenses();
      if (unsubPayments) unsubPayments();
      if (unsubProjects) unsubProjects();
      if (unsubLeads) unsubLeads();
    };
  }, [isLoggedIn]);

  // Ensure user is always on an authorized screen (Redirect if unauthorized)
  useEffect(() => {
    if (isLoggedIn && currentUser && !isScreenAllowedForUser(currentUser, currentScreen)) {
      const allowed = getFirstAllowedScreen(currentUser);
      setCurrentScreen(allowed);
    }
  }, [currentUser, currentScreen, isLoggedIn]);

  // Navigation Handler
  const handleNavigate = (screen: ScreenView, sector?: SystemType) => {
    let targetScreen = screen;
    if (!isScreenAllowedForUser(currentUser, targetScreen)) {
      targetScreen = getFirstAllowedScreen(currentUser);
    }
    if (sector) {
      setSelectedSector(sector);
    }
    setCurrentScreen(targetScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CRUD Actions
  const handleAddClient = async (clientData: Omit<Client, 'id'>) => {
    return await addClient(clientData);
  };

  const handleUpdateClient = async (id: string, clientData: Partial<Client>) => {
    await updateClient(id, clientData);
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

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setCurrentScreen('pos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateSaleFull = async (id: string, saleData: Partial<Sale>) => {
    await updateSale(id, saleData);
    setEditingSale(null);
  };

  const handleUpdateSaleStatus = async (id: string, status: 'mowakad' | 'morsal_qabl_dafa') => {
    await updateSale(id, { status });
  };

  const handleDeleteSale = async (id: string) => {
    await deleteSale(id);
    if (editingSale?.id === id) {
      setEditingSale(null);
    }
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
    return await addExpense(expenseData);
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
  };

  const handleAddPayment = async (paymentData: Omit<Payment, 'id'>) => {
    return await addPayment(paymentData);
  };

  const handleDeletePayment = async (id: string) => {
    await deletePayment(id);
  };

  const handleAddLead = async (leadData: Omit<Lead, 'id'>) => {
    return await addLead(leadData);
  };

  const handleUpdateLead = async (id: string, leadData: Partial<Lead>) => {
    await updateLead(id, leadData);
  };

  const handleDeleteLead = async (id: string) => {
    await deleteLead(id);
  };

  const handleConfirmLeadToPos = (lead: Lead) => {
    setPrefilledLead(lead);
    setCurrentScreen('pos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmLeadDone = async (leadId: string) => {
    await updateLead(leadId, { status: 'مؤكد' });
    setPrefilledLead(null);
  };

  // If not logged in, render LoginScreen
  if (!isLoggedIn) {
    return (
      <LoginScreen
        teamMembers={teamMembers}
        onLoginSuccess={(member) => {
          if (member) {
            setCurrentUser(member);
            const allowed = getFirstAllowedScreen(member);
            setCurrentScreen(allowed);
          }
          setIsLoggedIn(true);
        }}
        savedUsername={localStorage.getItem('bm_username') || 'admin'}
        installPrompt={installPrompt}
        onInstallApp={handleInstallApp}
        isAppInstalled={isAppInstalled}
      />
    );
  }

  // If logged in but currentUser is still loading
  if (isLoggedIn && !currentUser && loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex flex-col justify-center items-center p-4 text-white font-sans">
        <div className="w-10 h-10 border-4 border-[#FF7A1A] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-gray-300">جاري التحقق من الجلسة وصلاحيات الحساب...</p>
      </div>
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

      {/* Automatic responsive layout container (Mobile ~390px, Tablet md:max-w-4xl, Desktop lg:max-w-6xl) */}
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-6xl mx-auto min-h-screen flex flex-col relative bg-[#0B1220] z-10 transition-all duration-300">
        {/* Navbar */}
        <Navbar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          sales={sales}
          clients={clients}
          leads={leads}
          currentUser={currentUser}
          onOpenBackup={() => setShowBackupModal(true)}
          onOpenInstallPwa={!isAppInstalled ? () => setShowPwaModal(true) : undefined}
          onLogout={handleLogout}
          isAppInstalled={isAppInstalled}
        />

        {/* Screen Content */}
        <main className="flex-1 px-3.5 pt-1 pb-28">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 space-y-3">
              <div className="w-10 h-10 border-4 border-[#FF7A1A] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-300 font-bold">جاري تحميل البيانات والتحديث التلقائي من Firestore...</p>
            </div>
          ) : (
            <ErrorBoundary onReset={() => handleNavigate(getFirstAllowedScreen(currentUser))}>
              {isScreenAllowedForUser(currentUser, currentScreen) && (
                <>
                  {currentScreen === 'home' && (
                    <HomeScreen
                      sales={sales}
                      expenses={expenses}
                      payments={payments}
                      clients={clients}
                      currentUser={currentUser}
                      teamMembers={teamMembers}
                      isAppInstalled={isAppInstalled}
                      onNavigate={handleNavigate}
                      onEditSale={handleEditSale}
                      onDeleteSale={handleDeleteSale}
                      onOpenInstallPwa={!isAppInstalled ? () => setShowPwaModal(true) : undefined}
                    />
                  )}

                  {currentScreen === 'pos' && (
                    <PosScreen
                      clients={clients}
                      leads={leads}
                      packages={packages}
                      offers={offers}
                      teamMembers={teamMembers}
                      editingSale={editingSale}
                      prefilledLead={prefilledLead}
                      onConfirmLeadDone={handleConfirmLeadDone}
                      onSaveSale={handleSaveSale}
                      onUpdateSale={handleUpdateSaleFull}
                      onAddClient={handleAddClient}
                      onUpdateClient={handleUpdateClient}
                      onUpdateLead={handleUpdateLead}
                      onCancelEdit={() => setEditingSale(null)}
                      onNavigate={handleNavigate}
                    />
                  )}

                  {currentScreen === 'add-client' && (
                    <AddClientScreen
                      clients={clients}
                      leads={leads}
                      onAddClient={handleAddClient}
                      onUpdateClient={handleUpdateClient}
                      onUpdateLead={handleUpdateLead}
                      onNavigate={handleNavigate}
                    />
                  )}

                  {(currentScreen === 'clients' || currentScreen === 'leads') && (
                    <ClientsScreen
                      clients={clients}
                      sales={sales}
                      payments={payments}
                      leads={leads}
                      teamMembers={teamMembers}
                      currentUser={currentUser}
                      initialScreen={currentScreen}
                      onDeleteClient={handleDeleteClient}
                      onUpdateClient={handleUpdateClient}
                      onAddPayment={handleAddPayment}
                      onDeletePayment={handleDeletePayment}
                      onEditSale={handleEditSale}
                      onDeleteSale={handleDeleteSale}
                      onNavigate={handleNavigate}
                      onAddLead={handleAddLead}
                      onUpdateLead={handleUpdateLead}
                      onDeleteLead={handleDeleteLead}
                      onConfirmLeadToPos={handleConfirmLeadToPos}
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
                      onNavigate={handleNavigate}
                    />
                  )}

                  {currentScreen === 'team' && (
                    <TeamScreen
                      teamMembers={teamMembers}
                      projects={projects}
                      clients={clients}
                      currentUser={currentUser}
                      onSwitchUser={(user) => handleSwitchUser(user)}
                      onOpenBackup={() => setShowBackupModal(true)}
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
                      payments={payments}
                      clients={clients}
                      onNavigate={handleNavigate}
                    />
                  )}

                  {currentScreen === 'sales' && (
                    <SalesScreen
                      sales={sales}
                      clients={clients}
                      onUpdateSaleStatus={handleUpdateSaleStatus}
                      onEditSale={handleEditSale}
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
                      payments={payments}
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
        <QuickSaleButton currentScreen={currentScreen} onOpenPos={() => handleNavigate('pos')} currentUser={currentUser} />

        {/* Global Bottom Navigation */}
        <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} currentUser={currentUser} />

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
            onNavigate={handleNavigate}
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
