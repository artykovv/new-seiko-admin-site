import { createRouter, createWebHistory } from 'vue-router'
import { BACKEND_API_URL } from '../config'

const routes = [
  {
    path: '/login',
    name: 'login',
    meta: {
      title: 'Вход',
      icon: 'bi-box-arrow-in-right',
      hideInSidebar: true
    },
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    name: 'home',
    meta: {
      title: 'Главная',
      icon: 'bi-house'
    },
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/participants',
    name: 'participants',
    meta: {
      title: 'Участники',
      icon: 'bi-person-check'
    },
    component: () => import('../views/ParticipantsView.vue')
  },
  {
    path: '/registrations',
    name: 'registrations',
    meta: {
      title: 'Регистрации',
      icon: 'bi-person-dash'
    },
    component: () => import('../views/RegistrationsView.vue')
  },

  {
    path: '/bonuses',
    meta: {
      title: 'Бонусы',
      icon: 'bi-stars',
      tabs: [
        { path: '/bonuses/binary-check', label: 'Бинар и чек от чека' },
        { path: '/bonuses/referral', label: 'Реферальные' },
        { path: '/bonuses/status-sponsor', label: 'Статусные и Спонсорские' }
      ]
    },
    component: () => import('../views/bonuses/BonusesView.vue'),
    children: [
      {
        path: '',
        redirect: '/bonuses/binary-check'
      },
      {
        path: 'binary-check',
        name: 'bonuses-binary-check',
        meta: {
          title: 'Бонусы - Бинар и чек от чека',
          icon: 'bi-stars'
        },
        component: () => import('../views/bonuses/BonusesBinaryCheckView.vue')
      },
      {
        path: 'referral',
        name: 'bonuses-referral',
        meta: {
          title: 'Бонусы - Реферальные',
          icon: 'bi-stars'
        },
        component: () => import('../views/bonuses/BonusesReferralView.vue')
      },
      {
        path: 'status-sponsor',
        name: 'bonuses-status-sponsor',
        meta: {
          title: 'Бонусы - Статусные и Спонсорские',
          icon: 'bi-stars'
        },
        component: () => import('../views/bonuses/BonusesStatusSponsorView.vue')
      }
    ]
  },
  {
    path: '/gifts',
    meta: {
      title: 'Подарочные',
      icon: 'bi-bezier2',
      tabs: [
        { path: '/gifts/surprise-bonus', label: 'Сюрприз бонус' },
        { path: '/gifts/travel-bonus', label: 'Туристический бонус' },
        { path: '/gifts/auto-program', label: 'Автопрограмма' },
        { path: '/gifts/leader-travel', label: 'Лидерское Путешествие' },
        { path: '/gifts/discounts', label: 'Скидка' }
      ]
    },
    component: () => import('../views/gifts/GiftsView.vue'),
    children: [
      {
        path: '',
        redirect: '/gifts/surprise-bonus'
      },
      {
        path: 'surprise-bonus',
        name: 'gifts-surprise-bonus',
        meta: {
          title: 'Подарочные - Сюрприз бонус',
          icon: 'bi-bezier2'
        },
        component: () => import('../views/gifts/GiftsSurpriseBonusView.vue')
      },
      {
        path: 'travel-bonus',
        name: 'gifts-travel-bonus',
        meta: {
          title: 'Подарочные - Туристический бонус',
          icon: 'bi-bezier2'
        },
        component: () => import('../views/gifts/GiftsTravelBonusView.vue')
      },
      {
        path: 'auto-program',
        name: 'gifts-auto-program',
        meta: {
          title: 'Подарочные - Автопрограмма',
          icon: 'bi-bezier2'
        },
        component: () => import('../views/gifts/GiftsAutoProgramView.vue')
      },
      {
        path: 'leader-travel',
        name: 'gifts-leader-travel',
        meta: {
          title: 'Подарочные - Лидерское Путешествие',
          icon: 'bi-bezier2'
        },
        component: () => import('../views/gifts/GiftsLeaderTravelView.vue')
      },
      {
        path: 'discounts',
        name: 'gifts-discounts',
        meta: {
          title: 'Подарочные - Скидка',
          icon: 'bi-percent'
        },
        component: () => import('../views/gifts/DiscountsView.vue')
      }
    ]
  },
  {
    path: '/upgrades',
    name: 'upgrades',
    meta: {
      title: 'Апгрейд',
      icon: 'bi-person-up'
    },
    component: () => import('../views/UpgradesView.vue')
  },
  {
    path: '/products',
    name: 'products',
    meta: {
      title: 'Товары',
      icon: 'bi-box-seam'
    },
    component: () => import('../views/ProductsView.vue')
  },
  {
    path: '/config',
    meta: {
      title: 'Конфигурация',
      icon: 'bi-sliders2',
      tabs: [
        { path: '/config/statuses', label: 'Статусы' },
        { path: '/config/packages', label: 'Пакеты' },
        { path: '/config/branches', label: 'Филиалы' },
        { path: '/config/employees', label: 'Сотрудники' }
      ]
    },
    component: () => import('../views/config/ConfigView.vue'),
    children: [
      {
        path: '',
        redirect: '/config/statuses'
      },
      {
        path: 'statuses',
        name: 'config-statuses',
        meta: {
          title: 'Конфигурация - Статусы',
          icon: 'bi-sliders2'
        },
        component: () => import('../views/config/ConfigStatusesView.vue')
      },
      {
        path: 'packages',
        name: 'config-packages',
        meta: {
          title: 'Конфигурация - Пакеты',
          icon: 'bi-sliders2'
        },
        component: () => import('../views/config/ConfigPackagesView.vue')
      },
      {
        path: 'branches',
        name: 'config-branches',
        meta: {
          title: 'Конфигурация - Филиалы',
          icon: 'bi-sliders2'
        },
        component: () => import('../views/config/ConfigBranchesView.vue')
      },
      {
        path: 'employees',
        name: 'config-employees',
        meta: {
          title: 'Конфигурация - Сотрудники',
          icon: 'bi-sliders2'
        },
        component: () => import('../views/config/ConfigEmployeesView.vue')
      }
    ]
  },
  {
    path: '/cash',
    name: 'cash',
    meta: {
      title: 'Касса',
      icon: 'bi-coin'
    },
    component: () => import('../views/CashView.vue')
  },
  {
    path: '/orders',
    name: 'orders',
    meta: {
      title: 'Заказы',
      icon: 'bi-cart'
    },
    component: () => import('../views/OrdersView.vue')
  },
  {
    path: '/structure/:cabinetId',
    name: 'structure',
    meta: {
      title: 'Структура',
      icon: 'bi-diagram-3',
      hideInSidebar: true
    },
    component: () => import('../views/StructureView.vue')
  },
  {
    path: '/print/blank/:cabinetId',
    name: 'print-blank',
    meta: {
      title: 'Печать бланка',
      hideInSidebar: true,
      requiresAuth: true
    },
    component: () => import('../views/PrintBlankView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    meta: {
      title: 'Страница не найдена',
      hideInSidebar: true,
      public: true
    },
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const publicPages = ['/login'];
  const authRequired = !publicPages.includes(to.path) && !to.meta?.public;
  const token = localStorage.getItem('access_token');

  if (authRequired && !token) {
    return next('/login');
  }

  if (authRequired && token) {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/admin/auth/validate-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Token invalid');
      }
    } catch (error) {
      localStorage.removeItem('access_token');
      return next('/login');
    }
  }

  next();
});

export default router

