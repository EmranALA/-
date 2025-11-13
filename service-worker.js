
const CACHE_NAME = 'halaqa-cache-v10';
// All the files that make up the app shell.
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/index.tsx',
    '/manifest.json',
    '/metadata.json',
    '/App.tsx',
    '/types.ts',
    '/data/mockData.ts',
    '/context/AuthContext.tsx',
    '/components/Login.tsx',
    '/components/Dashboard.tsx',
    '/components/Header.tsx',
    '/components/Sidebar.tsx',
    '/components/MainContent.tsx',
    '/components/dashboards/AdminDashboard.tsx',
    '/components/dashboards/SupervisorDashboard.tsx',
    '/components/dashboards/TeacherDashboard.tsx',
    '/components/dashboards/AccountantDashboard.tsx',
    '/components/Attendance.tsx',
    '/components/StudentManagement.tsx',
    '/components/HalaqaManagement.tsx',
    '/components/UserManagement.tsx',
    '/components/Reports.tsx',
    '/components/Payments.tsx',
    '/components/Subscription.tsx',
    '/components/AppManager.tsx',
    '/components/Profile.tsx',
    '/components/PromotionPage.tsx',
    '/components/TeacherPayments.tsx',
    '/components/StudyPlanManagement.tsx',
    '/components/LessonPrep.tsx',
    '/components/SupervisoryVisits.tsx',
    '/components/PlanApprovals.tsx',
    '/components/StudentRecords.tsx',
    '/components/MessageSettings.tsx',
    '/components/Settings.tsx',
    '/components/AccountantAlerts.tsx',
    '/components/ImportantDates.tsx',
    '/components/SubordinateInstitutions.tsx',
    '/components/HierarchicalInstitutions.tsx',
    '/components/GitHubActionsGuide.tsx',
    '/components/GitHubSecretsManager.tsx',
    '/components/ConfirmationModal.tsx',
    '/components/SubscriberDetails.tsx',
    '/components/ImportLogicBuilder.tsx',
    '/components/QuranEvaluation.tsx',
    '/data/AmiriFont.ts',
    '/components/Tutorial.tsx',
    '/components/Chat.tsx',
    '/data/quranData.ts',
    '/data/quranMetadata.ts',
    '/components/SubscriptionSettings.tsx',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap'
];


// On install, precache the app shell.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        // Add all assets, but ignore failures on external resources
        const cachePromises = PRECACHE_ASSETS.map(asset => {
            return cache.add(asset).catch(err => {
                // Don't fail the entire install for external resources
                if (new URL(asset, self.location.origin).origin !== self.location.origin) {
                    console.warn(`Service Worker: Failed to cache external asset: ${asset}`);
                } else {
                    // Re-throw for local assets, as they are critical
                    throw err;
                }
            });
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting())
  );
});

// On activate, clean up old caches and take control.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// On fetch, use a stale-while-revalidate strategy.
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Try to get the response from the cache.
      const cachedResponse = await cache.match(event.request);

      // 2. Fetch the response from the network.
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // If the network request is successful, clone it and cache it.
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      }).catch(err => {
        console.error('Service Worker: fetch failed', event.request.url, err);
        // If network fails and we have a cached response, it will be used.
        // If we don't have a cached response, this error will propagate.
      });

      // 3. Return the cached response immediately if available, 
      // otherwise wait for the network response.
      // The fetch is always happening in the background to update the cache.
      return cachedResponse || fetchPromise;
    })
  );
});
