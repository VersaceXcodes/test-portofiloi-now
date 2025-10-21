import { z } from 'zod';

// --------------------- USER SCHEMAS ---------------------
const UserRole = z.enum(['user', 'admin']);

export const userSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  profile_pic_url: z.string().url().nullable(),
  bio: z.string().nullable(),
  created_at: z.coerce.date(),
  last_login: z.coerce.date().nullable(),
  role: UserRole.default('user')
});

export const createUserInputSchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(8),
  full_name: z.string().min(1),
  profile_pic: z.any().optional(),
  bio: z.string().optional(),
  role: UserRole.optional()
});

export const updateUserInputSchema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().min(1).optional(),
  profile_pic: z.any().optional(),
  bio: z.string().nullable().optional(),
  role: UserRole.optional()
});

export const userQuerySchema = z.object({
  role: UserRole.optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sort_by: z.enum(['full_name', 'created_at', 'last_login']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// --------------------- PROJECT SCHEMAS ---------------------
export const projectSchema = z.object({
  project_id: z.string(),
  title: z.string(),
  slug: z.string(),
  featured_image: z.string().url(),
  category: z.string(),
  excerpt: z.string(),
  content: z.string(),
  client: z.string().nullable(),
  technologies: z.array(z.string()).nullable(),
  project_url: z.string().url().nullable(),
  project_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  user_id: z.string()
});

export const createProjectInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  featured_image: z.string().url("Feature image must be a valid URL"),
  category: z.string().min(1, "Category is required"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
  content: z.string().min(100, "Content must be at least 100 characters"),
  client: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  project_url: z.string().url("Project URL must be valid").optional().or(z.literal("")),
  project_date: z.coerce.date("Invalid date format"),
  user_id: z.string().uuid("Invalid user ID")
});

export const updateProjectInputSchema = createProjectInputSchema.partial()
  .extend({
    project_id: z.string().uuid("Invalid project ID"),
    user_id: z.string().uuid("Invalid user ID")
  });

export const projectQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  user_id: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sort_by: z.enum(['title', 'project_date', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

// --------------------- PROJECT GALLERY IMAGE SCHEMAS ---------------------
export const projectGalleryImageSchema = z.object({
  image_id: z.string(),
  project_id: z.string(),
  image_url: z.string().url(),
  caption: z.string().nullable(),
  sort_order: z.number().int().nonnegative()
});

export const createProjectGalleryImageInputSchema = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  image_url: z.string().url("Image URL must be valid"),
  caption: z.string().optional().nullable(),
  sort_order: z.number().int().nonnegative().default(0)
});

export const updateProjectGalleryImageInputSchema = z.object({
  image_id: z.string().min(1, "Image ID is required"),
  caption: z.string().optional().nullable(),
  sort_order: z.number().int().nonnegative().optional()
});

export const projectGalleryImageQuerySchema = z.object({
  project_id: z.string().optional(),
  sort_by: z.enum(['sort_order']).default('sort_order'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

export type ProjectGalleryImage = z.infer<typeof projectGalleryImageSchema>;
export type CreateProjectGalleryImageInput = z.infer<typeof createProjectGalleryImageInputSchema>;
export type UpdateProjectGalleryImageInput = z.infer<typeof updateProjectGalleryImageInputSchema>;

// --------------------- SKILL SCHEMAS ---------------------
export const skillSchema = z.object({
  skill_id: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  proficiency: z.number().int().min(0).max(100).nullable()
});

export const createSkillInputSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  category: z.string().optional().nullable(),
  proficiency: z.number().int().min(0).max(100).optional().nullable()
});

export const updateSkillInputSchema = z.object({
  skill_id: z.string().min(1, "Skill ID is required"),
  name: z.string().min(1, "Skill name is required").optional(),
  category: z.string().optional().nullable(),
  proficiency: z.number().int().min(0).max(100).optional().nullable()
});

export const skillQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  min_proficiency: z.number().int().min(0).max(100).optional(),
  sort_by: z.enum(['name', 'category', 'proficiency']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().positive().max(100).default(20)
});

export type Skill = z.infer<typeof skillSchema>;
export type CreateSkillInput = z.infer<typeof createSkillInputSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillInputSchema>;

// --------------------- USER SKILL SCHEMAS ---------------------
export const userSkillSchema = z.object({
  user_skill_id: z.string(),
  user_id: z.string(),
  skill_id: z.string(),
  years_experience: z.number().positive().nullable()
});

export const createUserSkillInputSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  skill_id: z.string().min(1, "Skill ID is required"),
  years_experience: z.number().positive().optional().nullable()
});

export const updateUserSkillInputSchema = z.object({
  user_skill_id: z.string().min(1, "User Skill ID is required"),
  years_experience: z.number().positive().optional().nullable()
});

export const userSkillQuerySchema = z.object({
  user_id: z.string().optional(),
  skill_id: z.string().optional(),
  min_years: z.number().positive().optional(),
  include_skill_details: z.boolean().default(true)
});

export type UserSkill = z.infer<typeof userSkillSchema>;
export type CreateUserSkillInput = z.infer<typeof createUserSkillInputSchema>;
export type UpdateUserSkillInput = z.infer<typeof updateUserSkillInputSchema>;

// --------------------- EXPERIENCE SCHEMAS ---------------------
export const experienceSchema = z.object({
  experience_id: z.string(),
  user_id: z.string(),
  title: z.string(),
  company: z.string(),
  description: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  current: z.boolean().default(false),
  location: z.string().nullable()
});

export const createExperienceInputSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  start_date: z.coerce.date("Invalid start date"),
  end_date: z.coerce.date("Invalid end date").optional().nullable(),
  current: z.boolean().default(false),
  location: z.string().optional().nullable()
});

export const updateExperienceInputSchema = z.object({
  experience_id: z.string().min(1, "Experience ID is required"),
  title: z.string().min(1, "Title is required").optional(),
  company: z.string().min(1, "Company name is required").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  start_date: z.coerce.date("Invalid start date").optional(),
  end_date: z.coerce.date("Invalid end date").optional().nullable(),
  current: z.boolean().optional(),
  location: z.string().optional().nullable()
});

export const experienceQuerySchema = z.object({
  user_id: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  current: z.boolean().optional(),
  start_year: z.number().int().positive().optional(),
  sort_by: z.enum(['start_date', 'title', 'company']).default('start_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Experience = z.infer<typeof experienceSchema>;
export type CreateExperienceInput = z.infer<typeof createExperienceInputSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceInputSchema>;

// --------------------- EDUCATION SCHEMAS ---------------------
export const educationSchema = z.object({
  education_id: z.string(),
  user_id: z.string(),
  institution: z.string(),
  degree: z.string(),
  field_of_study: z.string().nullable(),
  description: z.string().nullable(),
  start_year: z.number().int().min(1900).max(2100),
  end_year: z.number().int().min(1900).max(2100).nullable(),
  current: z.boolean().default(false)
});

export const createEducationInputSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().min(1, "Degree name is required"),
  field_of_study: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  start_year: z.number().int().min(1900).max(2100),
  end_year: z.number().int().min(1900).max(2100).optional().nullable(),
  current: z.boolean().default(false)
});

export const updateEducationInputSchema = z.object({
  education_id: z.string().min(1, "Education ID is required"),
  institution: z.string().min(1, "Institution name is required").optional(),
  degree: z.string().min(1, "Degree name is required").optional(),
  field_of_study: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  start_year: z.number().int().min(1900).max(2100).optional(),
  end_year: z.number().int().min(1900).max(2100).optional().nullable(),
  current: z.boolean().optional()
});

export const educationQuerySchema = z.object({
  user_id: z.string().optional(),
  degree: z.string().optional(),
  institution: z.string().optional(),
  sort_by: z.enum(['start_year', 'degree', 'institution']).default('start_year'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Education = z.infer<typeof educationSchema>;
export type CreateEducationInput = z.infer<typeof createEducationInputSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationInputSchema>;

// --------------------- CONTACT MESSAGE SCHEMAS ---------------------
export const contactMessageSchema = z.object({
  message_id: z.string(),
  name: z.string(),
  email: z.string().email(),
  subject: z.string().nullable(),
  message: z.string(),
  created_at: z.coerce.date(),
  read: z.boolean().default(false)
});

export const createContactMessageInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  subject: z.string().optional().nullable(),
  message: z.string().min(10, "Message must be at least 10 characters")
});

export const updateContactMessageInputSchema = z.object({
  message_id: z.string().min(1, "Message ID is required"),
  read: z.boolean().optional()
});

export const contactMessageQuerySchema = z.object({
  search: z.string().optional(),
  read: z.boolean().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sort_by: z.enum(['created_at', 'name', 'read']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;
export type CreateContactMessageInput = z.infer<typeof createContactMessageInputSchema>;
export type UpdateContactMessageInput = z.infer<typeof updateContactMessageInputSchema>;

// --------------------- SOCIAL LINK SCHEMAS ---------------------
export const socialLinkSchema = z.object({
  social_id: z.string(),
  user_id: z.string(),
  platform: z.string(),
  url: z.string().url(),
  display_text: z.string().nullable()
});

export const createSocialLinkInputSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("URL must be valid").startsWith("https://", { message: "URL must use HTTPS" }),
  display_text: z.string().optional().nullable()
});

export const updateSocialLinkInputSchema = z.object({
  social_id: z.string().min(1, "Social ID is required"),
  platform: z.string().min(1, "Platform is required").optional(),
  url: z.string().url("URL must be valid").optional(),
  display_text: z.string().optional().nullable()
});

export const socialLinkQuerySchema = z.object({
  user_id: z.string().optional(),
  platform: z.string().optional()
});

export type SocialLink = z.infer<typeof socialLinkSchema>;
export type CreateSocialLinkInput = z.infer<typeof createSocialLinkInputSchema>;
export type UpdateSocialLinkInput = z.infer<typeof updateSocialLinkInputSchema>;

// --------------------- RESUME SCHEMAS ---------------------
const SUPPORTED_FILE_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const resumeSchema = z.object({
  resume_id: z.string(),
  user_id: z.string(),
  file_url: z.string().url(),
  file_name: z.string(),
  file_size: z.number().int().positive(),
  uploaded_at: z.coerce.date(),
  primary_resume: z.boolean().default(true)
});

export const createResumeInputSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  file: z
    .any()
    .refine(file => file?.size && file.size <= MAX_FILE_SIZE, "File size must be less than 10MB")
    .refine(
      file => SUPPORTED_FILE_TYPES.includes(file?.type),
      "Only PDF files are accepted"
    ),
  primary_resume: z.boolean().default(true)
});

export const updateResumeInputSchema = z.object({
  resume_id: z.string().min(1, "Resume ID is required"),
  primary_resume: z.boolean().optional()
});

export const resumeQuerySchema = z.object({
  user_id: z.string().optional(),
  is_primary: z.boolean().optional()
});

export type Resume = z.infer<typeof resumeSchema>;
export type CreateResumeInput = z.infer<typeof createResumeInputSchema> & { file: File };
export type UpdateResumeInput = z.infer<typeof updateResumeInputSchema>;