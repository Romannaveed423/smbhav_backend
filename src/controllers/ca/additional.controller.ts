import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import {Testimonial }  from '../../models/Testimonial';
import { Course } from '../../models/Course';
import { createError } from '../../utils/errors';
import { getPagination } from '../../utils/pagination';



/**
 * Get testimonials
 */

export const getTestimonials = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.query;
    const { page, limit, skip, sort } = getPagination(req.query);

    const filter: any = { isActive: true };
    if (type) filter.type = type;

    const [testimonials, total] = await Promise.all([
      Testimonial.find(filter).sort(sort).skip(skip).limit(limit),
      Testimonial.countDocuments(filter),
    ]);

    res.json({
      success: true,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: testimonials,
    });
  } catch (error) {
    next(error);
  }
};



/**
 * Get recent courses
 */
export const getRecentCourses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.query;
    const { page, limit, skip, sort } = getPagination(req.query);

    const filter: any = { isPublished: true };
    if (category) filter.category = category;

    const [courses, total] = await Promise.all([
      Course.find(filter).sort(sort).skip(skip).limit(limit),
      Course.countDocuments(filter),
    ]);

    res.json({
      success: true,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Admin controller below
 */

/** Create a testimonial
 */
export const createTestimonial = async (  
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, content, type } = req.body;

    const testimonial = await Testimonial.create({
      name,
      content,
      type,
    });

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: { testimonial },
    });
  } catch (error) {
    next(error);
  }
};

/** get all testimonials (admin)
 */
export const getAllTestimonials = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, skip, sort } = getPagination(_req.query);
    
    const [testimonials, total] = await Promise.all([
      Testimonial.find().sort(sort).skip(skip).limit(limit),
      Testimonial.countDocuments(),
    ]);

    res.json({
      success: true,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: testimonials,
    });
  } catch (error) {
    next(error);
  } 
};

/**
 * update testimonial (admin)
 */
export const updateTestimonial = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, content, type } = req.body;

    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      { name, content, type },
      { new: true }
    );

    if (!testimonial) {
      return next(createError( 'Testimonial not found', 404));
    }

    res.json({
      success: true,
      message: 'Testimonial updated successfully',
      data: { testimonial },
    });
  } catch (error) {
    next(error);
  }
};

/** delete testimonial (admin)
 */
export const deleteTestimonial = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByIdAndDelete(id);
    if (!testimonial) {
      return next(createError('Testimonial not found', 404));
    } 
    res.json({
      success: true,
      message: 'Testimonial deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};


/** * get create course (admin)
 */
export const createCourse = async (  
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, category } = req.body;  
    const course = await Course.create({
      title,
      description,
      category,
    });
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 *  Get all courses (admin)
 */

export const getAllCourses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, skip, sort } = getPagination(req.query);

    const [courses, total] = await Promise.all([
      Course.find().sort(sort).skip(skip).limit(limit),
      Course.countDocuments(),
    ]);

    res.json({
      success: true,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};


/** update course (admin)
 */
export const updateCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;
    const course = await Course.findByIdAndUpdate(
      id,
      { title, description, category },
      { new: true }
    );

    if (!course) {
      return next(createError('Course not found', 404));
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

/** delete course (admin)
 */
export const deleteCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);  
    if (!course) {
      return next(createError('Course not found', 404));
    }
    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error)
  }
};
  