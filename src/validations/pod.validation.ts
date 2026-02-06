import { z } from 'zod';

export const getSubcategoriesSchema = z.object({
  params: z.object({
    categoryId: z.string().min(1, 'Category ID is required'),
  }),
});

export const getProductsSchema = z.object({
  query: z.object({
    categoryId: z.string().optional(),
    subcategoryId: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['default', 'price_low_high', 'price_high_low', 'newest', 'popular']).optional(),
    priceMin: z.string().regex(/^\d+$/).transform(Number).optional(),
    priceMax: z.string().regex(/^\d+$/).transform(Number).optional(),
    colors: z.string().optional(),
    sizes: z.string().optional(),
    materials: z.string().optional(),
    productTypes: z.string().optional(),
    expressDeliveryOnly: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  }),
});

export const getProductDetailsSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
});

export const searchProductsSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    categoryId: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  }),
});

export const getBannersSchema = z.object({
  query: z.object({
    type: z.enum(['carousel', 'promotional', 'all']).optional().default('all'),
  }),
});

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    selectedColor: z.object({
      id: z.string().optional(),
      colorCode: z.string().min(1, 'Color code is required'),
      colorName: z.string().optional(),
    }).optional().nullable(),
    selectedSize: z.preprocess(
      (val) => (val === '' || val === null) ? undefined : val,
      z.string().min(1).optional()
    ),
    customization: z.object({
      designUrl: z.string().url().optional(),
      text: z.string().optional(),
      textColor: z.string().optional(),
      font: z.string().optional(),
      position: z.string().optional(),
    }).optional().nullable(),
    deliveryType: z.enum(['express', 'standard']).optional().default('standard'),
    notes: z.string().optional().nullable(),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    cartItemId: z.string().min(1, 'Cart Item ID is required'),
  }),
  body: z.object({
    quantity: z.number().int().positive().optional(),
    selectedColor: z.object({
      id: z.string(),
      colorCode: z.string(),
    }).optional(),
    selectedSize: z.string().optional(),
    deliveryType: z.enum(['express', 'standard']).optional(),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    cartItemId: z.string().min(1, 'Cart Item ID is required'),
  }),
});

const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone is required'),
  email: z.string().email('Invalid email'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(6, 'Pincode is required'),
  country: z.string().min(1, 'Country is required'),
  addressType: z.enum(['home', 'work', 'other']).optional(),
});

export const placeOrderSchema = z.object({
  body: z.object({
    cartItemIds: z.array(z.string()).optional(),
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),
    paymentMethod: z.object({
      type: z.enum(['online', 'cod']),
      paymentId: z.string().optional(),
      transactionId: z.string().optional(),
    }),
    deliveryType: z.enum(['express', 'standard']).optional().default('standard'),
    couponCode: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const getOrderDetailsSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
});

export const trackOrderSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
});

export const getUserOrdersSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'returned']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
  body: z.object({
    reason: z.string().optional(),
    refundMethod: z.enum(['original', 'wallet']).optional().default('original'),
  }),
});

export const returnOrderSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
  body: z.object({
    reason: z.enum(['defective', 'wrong_item', 'not_as_described', 'other']),
    description: z.string().min(1, 'Description is required'),
    images: z.array(z.string().url()).optional(),
    refundMethod: z.enum(['original', 'wallet']).optional().default('original'),
  }),
});

export const checkExpressDeliverySchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
});

export const getDeliveryChargesSchema = z.object({
  query: z.object({
    pincode: z.string().min(6, 'Pincode is required'),
    cartItemIds: z.array(z.string()).optional(),
    deliveryType: z.enum(['express', 'standard']).optional().default('standard'),
  }),
});

export const getAddressSuggestionsSchema = z.object({
  query: z.object({
    pincode: z.string().min(6, 'Pincode is required'),
  }),
});

export const uploadDesignSchema = z.object({
  body: z.object({
    productId: z.string().optional(),
    designType: z.enum(['image', 'text', 'logo']).optional().default('image'),
  }),
});

export const validateDesignSchema = z.object({
  body: z.object({
    designUrl: z.string().url('Invalid design URL'),
    productId: z.string().optional(),
    productType: z.string().optional(),
    printArea: z.enum(['front', 'back', 'sleeve', 'full']).optional(),
  }),
});

export const generateMockupSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    selectedColor: z.object({
      id: z.string(),
      colorCode: z.string(),
    }),
    selectedSize: z.string(),
    design: z.object({
      designUrl: z.string().url(),
      position: z.string(),
      scale: z.number().optional(),
      rotation: z.number().optional(),
    }).optional(),
    text: z.object({
      content: z.string(),
      font: z.string().optional(),
      color: z.string().optional(),
      position: z.string().optional(),
    }).optional(),
  }),
});

export const getProductReviewsSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    sort: z.enum(['newest', 'oldest', 'highest_rating', 'lowest_rating']).optional().default('newest'),
  }),
});

export const addReviewSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1, 'Comment is required'),
    images: z.array(z.string().url()).optional(),
    pros: z.array(z.string()).optional(),
    cons: z.array(z.string()).optional(),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    couponCode: z.string().min(1, 'Coupon code is required'),
    cartTotal: z.number().positive('Cart total must be positive'),
    cartItems: z.array(z.string()).optional(),
  }),
});

export const getPackagingProductsSchema = z.object({
  query: z.object({
    categoryId: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  }),
});

export const getBestSellersSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('8'),
    categoryId: z.string().optional(),
  }),
});

