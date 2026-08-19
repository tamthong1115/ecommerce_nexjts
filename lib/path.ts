export const paths = {
  home: '/',
  login: '/auth/login',
  verify_request: '/auth/verify-request',

  cart: {
    base: '/api/cart',
    remove_item: (variantId: string) => `/api/cart/${variantId}`,
  },

  products: {
    detail_id: (id: string) => `/products/${id}`,
    detail_slug: (slug: string) => `/products/slug/${slug}`,
  },

  customer: {
    account: {
      edit: '/customer/account/edit',
      address: '/customer/account/address',
    },
  },

  orders: {
    order_detail_customer: (id: string) => `/customer/account/orders/${id}`,
  },

  messages: {
    message_detail: (id: string) => `/messages/${id}`,
    message_detail_shop: (shopId: string, conversationId: string) =>
      `/seller/shops/${shopId}/messages/${conversationId}`,
  },

  voucher: {
    public: '/api/vouchers',
    seller_list: '/api/seller/vouchers',
    manager_list: '/api/manager/voucher',
  },

  seller: {
    account: {
      edit: '/seller/account/edit',
    },
    shops: {
      dashboard: '/seller/shops',
      create: '/seller/shops/create',
      edit: (shopId: string) => `/seller/shops/${shopId}/edit`,
      message_shop: (shopId: string) => `/seller/shops/${shopId}/messages`,
      members: (shopId: string) => `/seller/shops/${shopId}/members`,

      api: {
        fetch_all: '/api/seller/shops',
      },
    },
  },

  //admin's api
  manager: {
    account: {
      edit: '/manager/account/edit',
    },
    category: {
      search: '/api/manager/category/search',
      fetch_all: '/api/manager/category',
      fetch_form: '/api/manager/category/form',
      fetch_detail: (id: string) => `/api/manager/category/query?id=${id}`,
      create: '/api/manager/category',
      update: '/api/manager/category',
      del_one: (id: string | undefined) => `/api/manager/category?id=${id}`,
    },
    product: {
      search: '/api/manager/product/search',
      update: '/api/manager/product',
      fetch_all: '/api/manager/product',
      fetch_detail: '/api/manager/product/query',
    },
    shop: {
      search: '/api/manager/shop/search',
      fetch_all: '/api/manager/shop',
      fetch_detail: `/api/manager/shop/query`,
      update: '/api/manager/shop',
    },
    user: {
      search: '/api/manager/user/search',
      fetch_all: '/api/manager/user',
      fetch_detail: `/api/manager/user/query`,
    },
    warehouse: {
      search: '/api/manager/warehouse/search',
      fetch_all: '/api/manager/warehouse',
      update: '/api/manager/warehouse',
      fetch_detail: '/api/manager/warehouse/query',
      create: '/api/manager/warehouse',
      del_one: (id: string) => `/api/manager/warehouse?id=${id}`,
    },

    system_settings:{
      default: '/manager/system-settings',
      email: '/manager/system-settings/email'
    }
  },

  reviews: {
    fetch_all: '/api/reviews',
  },

  shop: {
    fetch_all: '/api/product/query',
    accept_invite: (token: string) => '/shop/accept-invite/' + token,
  },

  notifications: {
    default: '/api/notification',
  },
};
