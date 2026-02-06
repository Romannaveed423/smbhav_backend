import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../middleware/admin';

/**
 * List Categories (Admin)
 * Returns available category enums from Product model
 */
export const listCategories = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { section } = req.query;

    // Categories are enum values from Product model
    const allCategories = [
      { value: 'campaign', label: 'Campaign', section: 'sambhav' },
      { value: 'dsa_mfd_agent', label: 'DSA/MFD Agent', section: 'sambhav' },
      { value: 'social_task', label: 'Social Task', section: 'sambhav' },
      { value: 'other_tasks', label: 'Other Tasks', section: 'sambhav' },
      { value: 'influencer_marketing', label: 'Influencer Marketing', section: 'public' },
      { value: 'company_task', label: 'Company Task', section: 'public' },
      { value: 'freelancer_task', label: 'Freelancer Task', section: 'public' },
    ];

    let categories = allCategories;
    if (section) {
      categories = allCategories.filter((cat) => cat.section === section);
    }

    res.json({
      success: true,
      data: {
        categories: categories.map((cat) => ({
          value: cat.value,
          label: cat.label,
          section: cat.section,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Note: Categories are enum-based in the Product model.
 * If you need full CRUD operations for categories, you would need to:
 * 1. Create a separate Category model
 * 2. Update Product model to reference Category model
 * 3. Implement create, update, delete operations
 * 
 * For now, categories are predefined enums.
 */

