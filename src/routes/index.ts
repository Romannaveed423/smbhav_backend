import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import homeRoutes from './home.routes';
import earningsRoutes from './earnings.routes';
import referralRoutes from './referral.routes';
import caRoutes from './ca.routes';
import podRoutes from './pod.routes';
import storeRoutes from './store.routes';
import cartRoutes from './cart.routes';
import notificationRoutes from './notification.routes';
import locationRoutes from './location.routes';
import billsRoutes from './bills.routes';
import adminEarningsRoutes from './admin/earnings.routes';
import adminProductsRoutes from './admin/products.routes';
import adminOffersRoutes from './admin/offers.routes';
import adminOfferApplicationsRoutes from './admin/offer-applications.routes';
import adminEarningsManagementRoutes from './admin/earnings-management.routes';
import adminDashboardRoutes from './admin/dashboard.routes';
import adminCategoriesRoutes from './admin/categories.routes';
import adminUsersRoutes from './admin/users.routes';
import adminPODRoutes from './admin/pod.routes';
import adminFinancialApplicationsRoutes from './admin/financial-applications.routes';
import adminBillsRoutes from './admin/bills.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/home', homeRoutes);
router.use('/earn', earningsRoutes);
router.use('/referral', referralRoutes);
router.use('/ca', caRoutes);
router.use('/pod', podRoutes);
router.use('/store', storeRoutes);
router.use('/cart', cartRoutes);
router.use('/notifications', notificationRoutes);
router.use('/locations', locationRoutes);
router.use('/bills', billsRoutes);

// Admin routes
router.use('/admin/users', adminUsersRoutes);
router.use('/admin/pod', adminPODRoutes);
router.use('/admin/earn', adminProductsRoutes);
router.use('/admin/earn', adminOffersRoutes);
router.use('/admin/earn/offer-applications', adminOfferApplicationsRoutes);
router.use('/admin/earn', adminEarningsManagementRoutes);
router.use('/admin/earn', adminDashboardRoutes);
router.use('/admin/earn', adminCategoriesRoutes);
router.use('/admin/earnings', adminEarningsRoutes); // Click logs and conversions
router.use('/admin/earn', adminFinancialApplicationsRoutes); // SIP and Mutual Fund applications
router.use('/admin/bills', adminBillsRoutes); // Bills & Recharges module

export default router;

