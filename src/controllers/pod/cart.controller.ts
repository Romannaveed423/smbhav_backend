import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { PODCart } from '../../models/PODCart';
import { PODProduct } from '../../models/PODProduct';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

/**
 * Add product to cart
 */
export const addToCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    console.log('🔵 [Backend] addToCart - Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔵 [Backend] addToCart - productId:', req.body.productId, 'type:', typeof req.body.productId);
    console.log('🔵 [Backend] addToCart - quantity:', req.body.quantity, 'type:', typeof req.body.quantity);
    console.log('🔵 [Backend] addToCart - selectedColor:', JSON.stringify(req.body.selectedColor));
    console.log('🔵 [Backend] addToCart - selectedSize:', req.body.selectedSize, 'type:', typeof req.body.selectedSize);
    
    const {
      productId,
      quantity,
      selectedColor,
      selectedSize,
      customization,
      deliveryType = 'standard',
      notes,
    } = req.body;

    // Validate product exists and is active
    // Handle both MongoDB _id and custom productId
    let product;
    if (mongoose.Types.ObjectId.isValid(productId) && productId.length === 24) {
      // Try MongoDB _id first if it's a valid ObjectId
      product = await PODProduct.findOne({
        $or: [
          { _id: new mongoose.Types.ObjectId(productId) },
          { productId: productId },
        ],
      });
    } else {
      // If not a valid ObjectId, search by custom productId only
      product = await PODProduct.findOne({
        productId: productId,
      });
    }

    if (!product || !product.isActive) {
      throw createError('Product not found or unavailable', 404, 'NOT_FOUND');
    }

    // Check stock
    if (!product.stock.inStock || product.stock.quantity < quantity) {
      throw createError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
    }

    // Validate color and size
    if (selectedColor) {
      const colorExists = product.colors.some(
        (c) => c.id === selectedColor.id && c.isAvailable
      );
      if (!colorExists) {
        throw createError('Selected color is not available', 400, 'INVALID_COLOR');
      }
    }

    if (selectedSize) {
      const sizeExists = product.sizes.some(
        (s) => s.size === selectedSize && s.isAvailable
      );
      if (!sizeExists) {
        throw createError('Selected size is not available', 400, 'INVALID_SIZE');
      }
    }

    // Handle size - ensure we have a valid size
    let finalSelectedSize = selectedSize;
    if (product.sizes && product.sizes.length > 0) {
      // Product has sizes
      if (!finalSelectedSize) {
        // If no size selected, use first available size
        const firstSize = product.sizes.find((s: any) => s.isAvailable !== false);
        if (firstSize) {
          finalSelectedSize = typeof firstSize === 'string' ? firstSize : firstSize.size;
        } else {
          // Fallback to first size even if not marked as available
          finalSelectedSize = typeof product.sizes[0] === 'string' ? product.sizes[0] : product.sizes[0].size;
        }
      }
      // If still no size after trying to auto-select, throw error
      if (!finalSelectedSize) {
        throw createError('Size is required for this product', 400, 'VALIDATION_ERROR');
      }
    } else {
      // Product has no sizes, so finalSelectedSize can be null/undefined
      finalSelectedSize = null;
    }

    // Calculate prices
    const sizePrice = product.sizes?.find((s: any) => {
      const sSize = typeof s === 'string' ? s : s.size;
      return sSize === finalSelectedSize;
    })?.price;
    const unitPrice = sizePrice || product.discountPrice;
    const totalPrice = unitPrice * quantity;
    const deliveryPrice = deliveryType === 'express' ? product.expressDeliveryPrice : product.standardDeliveryPrice;

    // Calculate estimated delivery
    const deliveryDays = deliveryType === 'express' ? product.expressDeliveryDays : product.standardDeliveryDays;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    // Handle color - ensure we have a valid color
    let finalSelectedColor = selectedColor;
    if (!finalSelectedColor && product.colors && product.colors.length > 0) {
      finalSelectedColor = product.colors[0];
    }

    // Create cart item
    const cartItem = await PODCart.create({
      userId: new mongoose.Types.ObjectId(userId),
      productId: product._id,
      quantity,
      selectedColor: finalSelectedColor || {},
      selectedSize: finalSelectedSize,
      customization: customization || {},
      deliveryType,
      unitPrice,
      totalPrice,
      deliveryPrice,
      estimatedDelivery,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Product added to cart successfully',
      data: {
        cartItemId: cartItem.cartItemId,
        productId: product.productId,
        productName: product.name,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        totalPrice: cartItem.totalPrice,
        deliveryType: cartItem.deliveryType,
        deliveryPrice: cartItem.deliveryPrice,
        estimatedDelivery: cartItem.estimatedDelivery,
        addedAt: cartItem.addedAt,
      },
    });
    
    console.log('✅ [Backend] addToCart - Successfully created cart item:', cartItem.cartItemId);
    console.log('✅ [Backend] addToCart - User ID:', userId);
  } catch (error: any) {
    console.error('❌ [Backend] addToCart Error:', error);
    console.error('❌ [Backend] addToCart Error Message:', error.message);
    console.error('❌ [Backend] addToCart Error Stack:', error.stack);
    next(error);
  }
};

/**
 * Get cart items
 */
export const getCartItems = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    console.log('🔵 [Backend] getCartItems - userId:', userId);
    console.log('🔵 [Backend] getCartItems - userId type:', typeof userId);

    const cartItems = await PODCart.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate('productId', 'name thumbnail discountPrice')
      .sort({ addedAt: -1 })
      .lean();
    
    console.log('🔵 [Backend] getCartItems - Found cart items:', cartItems.length);
    console.log('🔵 [Backend] getCartItems - Cart items:', JSON.stringify(cartItems, null, 2));

    // Calculate summary
    let subtotal = 0;
    let totalDeliveryCharges = 0;
    let totalItems = 0;
    let latestDeliveryDate: Date | null = null;

    cartItems.forEach((item) => {
      subtotal += item.totalPrice;
      totalDeliveryCharges += item.deliveryPrice;
      totalItems += item.quantity;
      if (!latestDeliveryDate || item.estimatedDelivery > latestDeliveryDate) {
        latestDeliveryDate = item.estimatedDelivery;
      }
    });

    const discount = 0; // Can be calculated from coupons
    const total = subtotal + totalDeliveryCharges - discount;

    res.json({
      success: true,
      data: {
        cartItems: cartItems.map((item) => ({
          id: item._id.toString(),
          cartItemId: item.cartItemId,
          productId: (item.productId as any)?._id?.toString() || item.productId?.toString(),
          productName: (item.productId as any)?.name || 'N/A',
          productImage: (item.productId as any)?.thumbnail || '',
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          deliveryType: item.deliveryType,
          deliveryPrice: item.deliveryPrice,
          estimatedDelivery: item.estimatedDelivery,
          customization: item.customization,
          addedAt: item.addedAt,
        })),
        summary: {
          subtotal,
          deliveryCharges: totalDeliveryCharges,
          discount,
          total,
          totalItems,
          estimatedDelivery: latestDeliveryDate,
        },
      },
    });
    
    console.log('✅ [Backend] getCartItems - Returning', cartItems.length, 'items');
  } catch (error: any) {
    console.error('❌ [Backend] getCartItems Error:', error);
    console.error('❌ [Backend] getCartItems Error Message:', error.message);
    next(error);
  }
};

/**
 * Update cart item
 */
export const updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user?.id;
    const { quantity, selectedColor, selectedSize, deliveryType } = req.body;

    const cartItem = await PODCart.findOne({
      cartItemId,
      userId: new mongoose.Types.ObjectId(userId),
    }).populate('productId');

    if (!cartItem) {
      throw createError('Cart item not found', 404, 'NOT_FOUND');
    }

    const product = cartItem.productId as any;

    // Update quantity if provided
    if (quantity !== undefined) {
      if (quantity < 1) {
        throw createError('Quantity must be at least 1', 400, 'VALIDATION_ERROR');
      }
      if (product.stock.quantity < quantity) {
        throw createError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
      }
      cartItem.quantity = quantity;
    }

    // Update color if provided
    if (selectedColor) {
      const colorExists = product.colors.some(
        (c) => c.id === selectedColor.id && c.isAvailable
      );
      if (!colorExists) {
        throw createError('Selected color is not available', 400, 'INVALID_COLOR');
      }
      cartItem.selectedColor = selectedColor;
    }

    // Update size if provided
    if (selectedSize) {
      const sizeExists = product.sizes.some(
        (s) => s.size === selectedSize && s.isAvailable
      );
      if (!sizeExists) {
        throw createError('Selected size is not available', 400, 'INVALID_SIZE');
      }
      cartItem.selectedSize = selectedSize;
      const sizePrice = product.sizes.find((s) => s.size === selectedSize)?.price;
      cartItem.unitPrice = sizePrice || product.discountPrice;
    }

    // Update delivery type if provided
    if (deliveryType) {
      cartItem.deliveryType = deliveryType;
      cartItem.deliveryPrice = deliveryType === 'express' ? product.expressDeliveryPrice : product.standardDeliveryPrice;
      const deliveryDays = deliveryType === 'express' ? product.expressDeliveryDays : product.standardDeliveryDays;
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);
      cartItem.estimatedDelivery = estimatedDelivery;
    }

    // Recalculate total price
    cartItem.totalPrice = cartItem.unitPrice * cartItem.quantity;

    await cartItem.save();

    res.json({
      success: true,
      data: {
        cartItemId: cartItem.cartItemId,
        quantity: cartItem.quantity,
        totalPrice: cartItem.totalPrice,
        updatedAt: cartItem.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove cart item
 */
export const removeCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user?.id;

    const cartItem = await PODCart.findOneAndDelete({
      cartItemId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!cartItem) {
      throw createError('Cart item not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 */
export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    await PODCart.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};

