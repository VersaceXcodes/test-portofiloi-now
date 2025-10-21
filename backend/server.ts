import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

// Import Zod schemas
import {
  userSchema, createUserInputSchema, updateUserInputSchema, userQuerySchema,
  projectSchema, createProjectInputSchema, updateProjectInputSchema, projectQuerySchema,
  projectGalleryImageSchema, createProjectGalleryImageInputSchema, updateProjectGalleryImageInputSchema, projectGalleryImageQuerySchema,
  skillSchema, createSkillInputSchema, updateSkillInputSchema, skillQuerySchema,
  userSkillSchema, createUserSkillInputSchema, updateUserSkillInputSchema, userSkillQuerySchema,
  experienceSchema, createExperienceInputSchema, updateExperienceInputSchema, experienceQuerySchema,
  educationSchema, createEducationInputSchema, updateEducationInputSchema, educationQuerySchema,
  contactMessageSchema, createContactMessageInputSchema, updateContactMessageInputSchema, contactMessageQuerySchema,
  socialLinkSchema, createSocialLinkInputSchema, updateSocialLinkInputSchema, socialLinkQuerySchema,
  resumeSchema, createResumeInputSchema, updateResumeInputSchema, resumeQuerySchema
} from './schema.ts';

dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error response utility
interface ErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  details?: any;
  timestamp: string;
}

/*
  Creates standardized error response objects for consistent API error handling
  Includes timestamp and optional error details for debugging
*/
function createErrorResponse(
  message: string,
  error?: any,
  errorCode?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

// Environment variables and database setup
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432, JWT_SECRET = 'your-secret-key' } = process.env;

const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: "5mb" }));
app.use(morgan('combined'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create storage directories if they don't exist
const storageDir = path.join(__dirname, 'storage');
const resumesDir = path.join(storageDir, 'resumes');
const profilesDir = path.join(storageDir, 'profiles');
const projectsDir = path.join(storageDir, 'projects');

[storageDir, resumesDir, profilesDir, projectsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = storageDir;
    if (req.path.includes('/resumes')) {
      uploadPath = resumesDir;
    } else if (req.path.includes('/profile')) {
      uploadPath = profilesDir;
    } else if (req.path.includes('/projects')) {
      uploadPath = projectsDir;
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (req.path.includes('/resumes')) {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed for resumes'));
      }
    } else {
      // For other file types (images)
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  }
});

/*
  Authentication middleware that validates JWT tokens and attaches user info to request
  Used to protect routes that require user authentication
*/
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_MISSING'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT user_id, email, full_name, role, created_at FROM users WHERE user_id = $1', [decoded.user_id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid token', null, 'AUTH_USER_NOT_FOUND'));
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

/*
  Role-based access control middleware
  Restricts access to certain endpoints based on user role
*/
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Authentication required', null, 'AUTH_REQUIRED'));
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(createErrorResponse('Insufficient permissions', null, 'INSUFFICIENT_PERMISSIONS'));
    }
    
    next();
  };
};

// ===================== AUTHENTICATION ROUTES =====================

/*
  User registration endpoint
  Creates new user account and returns JWT token for immediate login
*/
app.post('/api/auth/register', async (req, res) => {
  try {
    const validatedInput = createUserInputSchema.parse(req.body);
    const { email, password, full_name, bio, role = 'user' } = validatedInput;

    // Check if user exists
    const existingUser = await pool.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json(createErrorResponse('User with this email already exists', null, 'USER_ALREADY_EXISTS'));
    }

    // Create user (NO HASHING - store password directly for development)
    const userId = uuidv4();
    const result = await pool.query(
      'INSERT INTO users (user_id, email, password_hash, full_name, bio, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id, email, full_name, bio, role, created_at',
      [userId, email.toLowerCase().trim(), password, full_name.trim(), bio || null, role, new Date().toISOString()]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        bio: user.bio,
        role: user.role,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  User login endpoint
  Validates credentials and returns JWT token
*/
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Email and password are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Find user (NO HASHING - direct password comparison for development)
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    const user = result.rows[0];

    // Check password (direct comparison for development)
    if (password !== user.password_hash) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = $1 WHERE user_id = $2', [new Date().toISOString(), user.user_id]);

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        bio: user.bio,
        role: user.role,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Token verification endpoint
  Validates JWT token and returns user info
*/
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: {
      user_id: req.user.user_id,
      email: req.user.email,
      full_name: req.user.full_name,
      role: req.user.role,
      created_at: req.user.created_at
    }
  });
});

/*
  Get current user profile endpoint
  Returns detailed user information for authenticated user
*/
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, email, full_name, profile_pic_url, bio, role, created_at, last_login FROM users WHERE user_id = $1', [req.user.user_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    res.json({
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update user profile endpoint
  Allows authenticated users to update their profile information
*/
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const validatedInput = updateUserInputSchema.parse(req.body);
    const userId = req.user.user_id;

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(validatedInput).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    values.push(userId);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex} RETURNING user_id, email, full_name, profile_pic_url, bio, role, created_at`;
    
    const result = await pool.query(query, values);

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ===================== PROJECT ROUTES =====================

/*
  Get all projects with filtering, sorting, and pagination
  Supports search by title/content, filtering by category, and sorting options
*/
app.get('/api/projects', async (req, res) => {
  try {
    const validatedQuery = projectQuerySchema.parse({
      search: req.query.search,
      category: req.query.category,
      user_id: req.query.user_id,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    });

    const { search, category, user_id, page, limit, sort_by, sort_order } = validatedQuery;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.full_name as author_name 
      FROM projects p 
      JOIN users u ON p.user_id = u.user_id 
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND p.category = $${paramIndex}`;
      values.push(category);
      paramIndex++;
    }

    if (user_id) {
      query += ` AND p.user_id = $${paramIndex}`;
      values.push(user_id);
      paramIndex++;
    }

    query += ` ORDER BY p.${sort_by} ${sort_order.toUpperCase()}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM projects p WHERE 1=1';
    const countValues = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (p.title ILIKE $${countParamIndex} OR p.content ILIKE $${countParamIndex})`;
      countValues.push(`%${search}%`);
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND p.category = $${countParamIndex}`;
      countValues.push(category);
      countParamIndex++;
    }

    if (user_id) {
      countQuery += ` AND p.user_id = $${countParamIndex}`;
      countValues.push(user_id);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      projects: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get project by ID with gallery images
  Returns detailed project information including associated gallery images
*/
app.get('/api/projects/:project_id', async (req, res) => {
  try {
    const { project_id } = req.params;

    // Get project details
    const projectResult = await pool.query(`
      SELECT p.*, u.full_name as author_name 
      FROM projects p 
      JOIN users u ON p.user_id = u.user_id 
      WHERE p.project_id = $1
    `, [project_id]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Project not found', null, 'PROJECT_NOT_FOUND'));
    }

    // Get gallery images
    const galleryResult = await pool.query(
      'SELECT * FROM project_gallery_images WHERE project_id = $1 ORDER BY sort_order ASC',
      [project_id]
    );

    const project = projectResult.rows[0];
    project.gallery_images = galleryResult.rows;

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create new project
  Requires authentication and validates project data before creation
*/
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const validatedInput = createProjectInputSchema.parse({
      ...req.body,
      user_id: req.user.user_id
    });

    // Check if slug is unique
    const existingProject = await pool.query('SELECT project_id FROM projects WHERE slug = $1', [validatedInput.slug]);
    if (existingProject.rows.length > 0) {
      return res.status(400).json(createErrorResponse('Project with this slug already exists', null, 'SLUG_EXISTS'));
    }

    const projectId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO projects (project_id, title, slug, featured_image, category, excerpt, content, client, technologies, project_url, project_date, created_at, updated_at, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [
        projectId,
        validatedInput.title,
        validatedInput.slug,
        validatedInput.featured_image,
        validatedInput.category,
        validatedInput.excerpt,
        validatedInput.content,
        validatedInput.client || null,
        JSON.stringify(validatedInput.technologies || []),
        validatedInput.project_url || null,
        validatedInput.project_date,
        now,
        now,
        validatedInput.user_id
      ]
    );

    res.status(201).json({
      message: 'Project created successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Create project error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update existing project
  Requires authentication and ownership verification
*/
app.put('/api/projects/:project_id', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    
    // Check if project exists and user owns it
    const existingProject = await pool.query('SELECT * FROM projects WHERE project_id = $1', [project_id]);
    if (existingProject.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Project not found', null, 'PROJECT_NOT_FOUND'));
    }

    if (existingProject.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json(createErrorResponse('You can only update your own projects', null, 'INSUFFICIENT_PERMISSIONS'));
    }

    const validatedInput = updateProjectInputSchema.parse({
      ...req.body,
      project_id,
      user_id: req.user.user_id
    });

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(validatedInput).forEach(([key, value]) => {
      if (value !== undefined && key !== 'project_id' && key !== 'user_id') {
        if (key === 'technologies') {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    updateFields.push(`updated_at = $${paramIndex}`);
    values.push(new Date().toISOString());
    paramIndex++;

    values.push(project_id);
    const query = `UPDATE projects SET ${updateFields.join(', ')} WHERE project_id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);

    res.json({
      message: 'Project updated successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete project
  Requires authentication and ownership verification
*/
app.delete('/api/projects/:project_id', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    
    // Check if project exists and user owns it
    const existingProject = await pool.query('SELECT * FROM projects WHERE project_id = $1', [project_id]);
    if (existingProject.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Project not found', null, 'PROJECT_NOT_FOUND'));
    }

    if (existingProject.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json(createErrorResponse('You can only delete your own projects', null, 'INSUFFICIENT_PERMISSIONS'));
    }

    await pool.query('DELETE FROM projects WHERE project_id = $1', [project_id]);

    res.json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ===================== PROJECT GALLERY IMAGE ROUTES =====================

/*
  Get gallery images for a project
  Returns all images associated with a specific project
*/
app.get('/api/projects/:project_id/gallery', async (req, res) => {
  try {
    const { project_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM project_gallery_images WHERE project_id = $1 ORDER BY sort_order ASC',
      [project_id]
    );

    res.json({
      gallery_images: result.rows
    });
  } catch (error) {
    console.error('Get gallery images error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Add gallery image to project
  Requires authentication and project ownership verification
*/
app.post('/api/projects/:project_id/gallery', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    
    // Check if project exists and user owns it
    const existingProject = await pool.query('SELECT * FROM projects WHERE project_id = $1', [project_id]);
    if (existingProject.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Project not found', null, 'PROJECT_NOT_FOUND'));
    }

    if (existingProject.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json(createErrorResponse('You can only modify your own projects', null, 'INSUFFICIENT_PERMISSIONS'));
    }

    const validatedInput = createProjectGalleryImageInputSchema.parse({
      ...req.body,
      project_id
    });

    const imageId = uuidv4();
    const result = await pool.query(
      'INSERT INTO project_gallery_images (image_id, project_id, image_url, caption, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [imageId, project_id, validatedInput.image_url, validatedInput.caption || null, validatedInput.sort_order]
    );

    res.status(201).json({
      message: 'Gallery image added successfully',
      gallery_image: result.rows[0]
    });
  } catch (error) {
    console.error('Add gallery image error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update gallery image
  Allows updating caption and sort order of gallery images
*/
app.put('/api/gallery-images/:image_id', authenticateToken, async (req, res) => {
  try {
    const { image_id } = req.params;
    
    // Check if image exists and user owns the project
    const existingImage = await pool.query(`
      SELECT pgi.*, p.user_id 
      FROM project_gallery_images pgi 
      JOIN projects p ON pgi.project_id = p.project_id 
      WHERE pgi.image_id = $1
    `, [image_id]);
    
    if (existingImage.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Gallery image not found', null, 'IMAGE_NOT_FOUND'));
    }

    if (existingImage.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json(createErrorResponse('You can only modify your own projects', null, 'INSUFFICIENT_PERMISSIONS'));
    }

    const validatedInput = updateProjectGalleryImageInputSchema.parse({
      ...req.body,
      image_id
    });

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(validatedInput).forEach(([key, value]) => {
      if (value !== undefined && key !== 'image_id') {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    values.push(image_id);
    const query = `UPDATE project_gallery_images SET ${updateFields.join(', ')} WHERE image_id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);

    res.json({
      message: 'Gallery image updated successfully',
      gallery_image: result.rows[0]
    });
  } catch (error) {
    console.error('Update gallery image error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete gallery image
  Removes gallery image with ownership verification
*/
app.delete('/api/gallery-images/:image_id', authenticateToken, async (req, res) => {
  try {
    const { image_id } = req.params;
    
    // Check if image exists and user owns the project
    const existingImage = await pool.query(`
      SELECT pgi.*, p.user_id 
      FROM project_gallery_images pgi 
      JOIN projects p ON pgi.project_id = p.project_id 
      WHERE pgi.image_id = $1
    `, [image_id]);
    
    if (existingImage.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Gallery image not found', null, 'IMAGE_NOT_FOUND'));
    }

    if (existingImage.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json(createErrorResponse('You can only modify your own projects', null, 'INSUFFICIENT_PERMISSIONS'));
    }

    await pool.query('DELETE FROM project_gallery_images WHERE image_id = $1', [image_id]);

    res.json({
      message: 'Gallery image deleted successfully'
    });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ===================== CONTACT MESSAGE ROUTES =====================

/*
  Create contact message
  Public endpoint for visitors to send contact messages
*/
app.post('/api/contact', async (req, res) => {
  try {
    const validatedInput = createContactMessageInputSchema.parse(req.body);

    const messageId = uuidv4();
    const result = await pool.query(
      'INSERT INTO contact_messages (message_id, name, email, subject, message, created_at, read) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [messageId, validatedInput.name, validatedInput.email, validatedInput.subject || null, validatedInput.message, new Date().toISOString(), false]
    );

    res.status(201).json({
      message: 'Contact message sent successfully',
      contact_message: result.rows[0]
    });
  } catch (error) {
    console.error('Create contact message error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get contact messages
  Admin-only endpoint to retrieve and manage contact messages
*/
app.get('/api/contact', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const validatedQuery = contactMessageQuerySchema.parse({
      search: req.query.search,
      read: req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    });

    const { search, read, start_date, end_date, page, limit, sort_by, sort_order } = validatedQuery;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM contact_messages WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (read !== undefined) {
      query += ` AND read = $${paramIndex}`;
      values.push(read);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      values.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      values.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM contact_messages WHERE 1=1';
    const countValues = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex} OR message ILIKE $${countParamIndex})`;
      countValues.push(`%${search}%`);
      countParamIndex++;
    }

    if (read !== undefined) {
      countQuery += ` AND read = $${countParamIndex}`;
      countValues.push(read);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      contact_messages: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Mark contact message as read
  Admin-only endpoint to update message read status
*/
app.put('/api/contact/:message_id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { message_id } = req.params;
    const validatedInput = updateContactMessageInputSchema.parse({
      ...req.body,
      message_id
    });

    const result = await pool.query(
      'UPDATE contact_messages SET read = $1 WHERE message_id = $2 RETURNING *',
      [validatedInput.read, message_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Contact message not found', null, 'MESSAGE_NOT_FOUND'));
    }

    res.json({
      message: 'Contact message updated successfully',
      contact_message: result.rows[0]
    });
  } catch (error) {
    console.error('Update contact message error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ===================== SKILL ROUTES =====================

/*
  Get all skills
  Public endpoint with filtering and search capabilities
*/
app.get('/api/skills', async (req, res) => {
  try {
    const validatedQuery = skillQuerySchema.parse({
      search: req.query.search,
      category: req.query.category,
      min_proficiency: req.query.min_proficiency ? parseInt(req.query.min_proficiency) : undefined,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    });

    const { search, category, min_proficiency, sort_by, sort_order, limit } = validatedQuery;

    let query = 'SELECT * FROM skills WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND name ILIKE $${paramIndex}`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      values.push(category);
      paramIndex++;
    }

    if (min_proficiency) {
      query += ` AND proficiency >= $${paramIndex}`;
      values.push(min_proficiency);
      paramIndex++;
    }

    query += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    query += ` LIMIT $${paramIndex}`;
    values.push(limit);

    const result = await pool.query(query, values);

    res.json({
      skills: result.rows
    });
  } catch (error) {
    console.error('Get skills error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create new skill
  Admin-only endpoint for creating skills
*/
app.post('/api/skills', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const validatedInput = createSkillInputSchema.parse(req.body);

    // Check if skill already exists
    const existingSkill = await pool.query('SELECT skill_id FROM skills WHERE name = $1', [validatedInput.name]);
    if (existingSkill.rows.length > 0) {
      return res.status(400).json(createErrorResponse('Skill with this name already exists', null, 'SKILL_EXISTS'));
    }

    const skillId = uuidv4();
    const result = await pool.query(
      'INSERT INTO skills (skill_id, name, category, proficiency) VALUES ($1, $2, $3, $4) RETURNING *',
      [skillId, validatedInput.name, validatedInput.category || null, validatedInput.proficiency || null]
    );

    res.status(201).json({
      message: 'Skill created successfully',
      skill: result.rows[0]
    });
  } catch (error) {
    console.error('Create skill error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ===================== USER SKILL ROUTES =====================

/*
  Get user skills
  Returns skills associated with a specific user including skill details
*/
app.get('/api/users/:user_id/skills', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(`
      SELECT us.*, s.name, s.category, s.proficiency as skill_proficiency
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.skill_id
      WHERE us.user_id = $1
      ORDER BY s.name ASC
    `, [user_id]);

    res.json({
      user_skills: result.rows
    });
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Add skill to user
  Allows authenticated users to add skills to their profile
*/
app.post('/api/user-skills', authenticateToken, async (req, res) => {
  try {
    const validatedInput = createUserSkillInputSchema.parse({
      ...req.body,
      user_id: req.user.user_id
    });

    // Check if user already has this skill
    const existingUserSkill = await pool.query(
      'SELECT user_skill_id FROM user_skills WHERE user_id = $1 AND skill_id = $2',
      [validatedInput.user_id, validatedInput.skill_id]
    );
    
    if (existingUserSkill.rows.length > 0) {
      return res.status(400).json(createErrorResponse('User already has this skill', null, 'USER_SKILL_EXISTS'));
    }

    const userSkillId = uuidv4();
    const result = await pool.query(
      'INSERT INTO user_skills (user_skill_id, user_id, skill_id, years_experience) VALUES ($1, $2, $3, $4) RETURNING *',
      [userSkillId, validatedInput.user_id, validatedInput.skill_id, validatedInput.years_experience || null]
    );

    res.status(201).json({
      message: 'Skill added to user successfully',
      user_skill: result.rows[0]
    });
  } catch (error) {
    console.error('Create user skill error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ===================== EXPERIENCE ROUTES =====================

/*
  Get user experiences
  Returns work experience history for a specific user
*/
app.get('/api/users/:user_id/experiences', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM experiences WHERE user_id = $1 ORDER BY start_date DESC',
      [user_id]
    );

    res.json({
      experiences: result.rows
    });
  } catch (error) {
    console.error('Get experiences error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create new experience
  Allows authenticated users to add work experience to their profile
*/
app.post('/api/experiences', authenticateToken, async (req, res) => {
  try {
    const validatedInput = createExperienceInputSchema.parse({
      ...req.body,
      user_id: req.user.user_id
    });

    const experienceId = uuidv4();
    const result = await pool.query(
      'INSERT INTO experiences (experience_id, user_id, title, company, description, start_date, end_date, current, location) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        experienceId,
        validatedInput.user_id,
        validatedInput.title,
        validatedInput.company,
        validatedInput.description,
        validatedInput.start_date,
        validatedInput.end_date || null,
        validatedInput.current,
        validatedInput.location || null
      ]
    );

    res.status(201).json({
      message: 'Experience created successfully',
      experience: result.rows[0]
    });
  } catch (error) {
    console.error('Create experience error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update experience
  Allows authenticated users to update their own work experience
*/
app.put('/api/experiences/:experience_id', authenticateToken, async (req, res) => {
  try {
    const { experience_id } = req.params;
    
    // Check if experience exists and user owns it
    const existingExperience = await pool.query('SELECT * FROM experiences WHERE experience_id = $1', [experience_id]);
    if (existingExperience.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Experience not found', null, 'EXPERIENCE_NOT_FOUND'));
    }

    if (existingExperience.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json(createErrorResponse('You can only update your own experiences', null, 'INSUFFICIENT_PERMISSIONS'));
    }

    const validatedInput = updateExperienceInputSchema.parse({
      ...req.body,
      experience_id
    });

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(validatedInput).forEach(([key, value]) => {
      if (value !== undefined && key !== 'experience_id') {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    values.push(experience_id);
    const query = `UPDATE experiences SET ${updateFields.join(', ')} WHERE experience_id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);

    res.json({
      message: 'Experience updated successfully',
      experience: result.rows[0]
    });
  } catch (error) {
    console.error('Update experience error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete experience
  Allows authenticated users to delete their own work experience
*/
app.delete('/api/experiences/:experience_id', authenticateToken, async (req, res) => {
  try {
    const { experience_id } = req.params;
    
    // Check if experience exists and user owns it
    const existingExperience = await pool.query('SELECT * FROM experiences WHERE experience_id = $1', [experience_id]);
    if (existingExperience.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Experience not found', null, 'EXPERIENCE_NOT_FOUND'));
    }

    if (existingExperience.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json(createErrorResponse('You can only delete your own experiences', null, 'INSUFFICIENT_PERMISSIONS'));
    }

    await pool.query('DELETE FROM experiences WHERE experience_id = $1', [experience_id]);

    res.json({
      message: 'Experience deleted successfully'
    });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ===================== EDUCATION ROUTES =====================

/*
  Get user education
  Returns education history for a specific user
*/
app.get('/api/users/:user_id/education', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM educations WHERE user_id = $1 ORDER BY start_year DESC',
      [user_id]
    );

    res.json({
      educations: result.rows
    });
  } catch (error) {
    console.error('Get education error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create new education
  Allows authenticated users to add education to their profile
*/
app.post('/api/education', authenticateToken, async (req, res) => {
  try {
    const validatedInput = createEducationInputSchema.parse({
      ...req.body,
      user_id: req.user.user_id
    });

    const educationId = uuidv4();
    const result = await pool.query(
      'INSERT INTO educations (education_id, user_id, institution, degree, field_of_study, description, start_year, end_year, current) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        educationId,
        validatedInput.user_id,
        validatedInput.institution,
        validatedInput.degree,
        validatedInput.field_of_study || null,
        validatedInput.description || null,
        validatedInput.start_year,
        validatedInput.end_year || null,
        validatedInput.current
      ]
    );

    res.status(201).json({
      message: 'Education created successfully',
      education: result.rows[0]
    });
  } catch (error) {
    console.error('Create education error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ===================== SOCIAL LINKS ROUTES =====================

/*
  Get user social links
  Returns social media links for a specific user
*/
app.get('/api/users/:user_id/social-links', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM social_links WHERE user_id = $1 ORDER BY platform ASC',
      [user_id]
    );

    res.json({
      social_links: result.rows
    });
  } catch (error) {
    console.error('Get social links error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create social link
  Allows authenticated users to add social media links to their profile
*/
app.post('/api/social-links', authenticateToken, async (req, res) => {
  try {
    const validatedInput = createSocialLinkInputSchema.parse({
      ...req.body,
      user_id: req.user.user_id
    });

    const socialId = uuidv4();
    const result = await pool.query(
      'INSERT INTO social_links (social_id, user_id, platform, url, display_text) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [socialId, validatedInput.user_id, validatedInput.platform, validatedInput.url, validatedInput.display_text || null]
    );

    res.status(201).json({
      message: 'Social link created successfully',
      social_link: result.rows[0]
    });
  } catch (error) {
    console.error('Create social link error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ===================== RESUME ROUTES =====================

/*
  Get user resume
  Returns primary resume for a specific user
*/
app.get('/api/users/:user_id/resume', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM resumes WHERE user_id = $1 AND primary_resume = true',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Resume not found', null, 'RESUME_NOT_FOUND'));
    }

    res.json({
      resume: result.rows[0]
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Upload resume
  Allows authenticated users to upload their resume file
*/
app.post('/api/resumes', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(createErrorResponse('No file uploaded', null, 'NO_FILE_UPLOADED'));
    }

    // Mark other resumes as non-primary if this is primary
    const isPrimary = req.body.primary_resume !== 'false';
    if (isPrimary) {
      await pool.query('UPDATE resumes SET primary_resume = false WHERE user_id = $1', [req.user.user_id]);
    }

    const resumeId = uuidv4();
    const fileUrl = `/storage/resumes/${req.file.filename}`;
    
    const result = await pool.query(
      'INSERT INTO resumes (resume_id, user_id, file_url, file_name, file_size, uploaded_at, primary_resume) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [resumeId, req.user.user_id, fileUrl, req.file.originalname, req.file.size, new Date().toISOString(), isPrimary]
    );

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: result.rows[0]
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Download resume file
  Serves resume files from storage directory
*/
app.get('/storage/resumes/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(resumesDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json(createErrorResponse('File not found', null, 'FILE_NOT_FOUND'));
  }
  
  res.sendFile(filePath);
});

// ===================== USER ROUTES =====================

/*
  Get user profile by ID
  Returns public profile information for any user
*/
app.get('/api/users/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      'SELECT user_id, email, full_name, profile_pic_url, bio, role, created_at FROM users WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    res.json({
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get all users
  Admin-only endpoint for user management
*/
app.get('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const validatedQuery = userQuerySchema.parse({
      role: req.query.role,
      search: req.query.search,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    });

    const { role, search, page, limit, sort_by, sort_order } = validatedQuery;
    const offset = (page - 1) * limit;

    let query = 'SELECT user_id, email, full_name, profile_pic_url, bio, role, created_at, last_login FROM users WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex}`;
      values.push(role);
      paramIndex++;
    }

    if (search) {
      query += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countValues = [];
    let countParamIndex = 1;

    if (role) {
      countQuery += ` AND role = $${countParamIndex}`;
      countValues.push(role);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (full_name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
      countValues.push(`%${search}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ===================== HEALTH CHECK =====================

/*
  Health check endpoint
  Returns server status and database connectivity
*/
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Serve static files for uploaded content
app.use('/storage', express.static(storageDir));

// SPA catch-all: serve index.html for non-API routes only
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export { app, pool };

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} and listening on 0.0.0.0`);
});