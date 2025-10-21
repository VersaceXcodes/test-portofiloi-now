-- Create Tables Section with proper constraints and relationships
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    profile_pic_url TEXT,
    bio TEXT,
    created_at TEXT NOT NULL,
    last_login TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    CONSTRAINT unique_email UNIQUE (email)
);

CREATE TABLE projects (
    project_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    featured_image TEXT NOT NULL,
    category TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    client TEXT,
    technologies JSONB,
    project_url TEXT,
    project_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE project_gallery_images (
    image_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE skills (
    skill_id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    proficiency INTEGER,
    CONSTRAINT unique_skill_name UNIQUE (name)
);

CREATE TABLE user_skills (
    user_skill_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    years_experience DECIMAL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
);

CREATE TABLE experiences (
    experience_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    current BOOLEAN NOT NULL DEFAULT false,
    location TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE educations (
    education_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field_of_study TEXT,
    description TEXT,
    start_year INTEGER NOT NULL,
    end_year INTEGER,
    current BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE contact_messages (
    message_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE social_links (
    social_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    display_text TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE resumes (
    resume_id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TEXT NOT NULL,
    primary_resume BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Seed Data Section with comprehensive examples

-- Insert Users
INSERT INTO users (user_id, email, password_hash, full_name, profile_pic_url, bio, created_at, last_login, role) VALUES
('usr_1', 'admin@example.com', 'admin123', 'Admin User', 'https://picsum.photos/seed/admin/300/300', 'System administrator with full access', '2023-01-15T09:00:00Z', '2023-10-25T14:30:00Z', 'admin'),
('usr_2', 'alice@example.com', 'password123', 'Alice Johnson', 'https://picsum.photos/seed/alice/300/300', 'Web developer and tech enthusiast', '2023-02-20T10:15:00Z', '2023-10-25T16:45:00Z', 'user');

-- Insert Project
INSERT INTO projects (project_id, title, slug, featured_image, category, excerpt, content, client, technologies, project_url, project_date, created_at, updated_at, user_id) VALUES
('proj_1', 'E-commerce Platform', 'ecommerce-platform', 'https://picsum.photos/seed/ecommerce/1200/800', 'Web Development', 
  'A fully featured e-commerce platform with modern UI and secure checkout.',
  'This project involved creating a complete e-commerce solution with inventory management, user authentication, and payment processing. The stack includes React, Node.js, and PostgreSQL.',
  'Retail Store Inc.', '["React", "Node.js", "Express", "PostgreSQL"]'::jsonb,
  'https://ecommerce.example.com', '2023-06-01', '2023-05-15T10:30:00Z', '2023-10-20T14:20:00Z', 'usr_2');

-- Insert Project Gallery Images
INSERT INTO project_gallery_images (image_id, project_id, image_url, caption, sort_order) VALUES
('img_1', 'proj_1', 'https://picsum.photos/seed/ecommerce-gallery1/800/600', 'Homepage showing featured products', 1),
('img_2', 'proj_1', 'https://picsum.photos/seed/ecommerce-gallery2/800/600', 'Mobile responsive product listing', 2),
('img_3', 'proj_1', 'https://picsum.photos/seed/ecommerce-gallery3/800/600', 'Secure checkout process', 3);

-- Insert Skills
INSERT INTO skills (skill_id, name, category, proficiency) VALUES
('skill_1', 'JavaScript', 'Programming', 90),
('skill_2', 'React', 'Frontend', 85),
('skill_3', 'Node.js', 'Backend', 88),
('skill_4', 'PostgreSQL', 'Database', 80),
('skill_5', 'CSS', 'Frontend', 85);

-- Insert User Skills
INSERT INTO user_skills (user_skill_id, user_id, skill_id, years_experience) VALUES
('us_1', 'usr_2', 'skill_1', 5.5),
('us_2', 'usr_2', 'skill_2', 4.0),
('us_3', 'usr_2', 'skill_3', 4.5),
('us_4', 'usr_2', 'skill_4', 3.5);

-- Insert Experiences
INSERT INTO experiences (experience_id, user_id, title, company, description, start_date, end_date, current, location) VALUES
('exp_1', 'usr_2', 'Senior Frontend Developer', 'Tech Solutions Inc.', 
 'Led the development of various client projects and mentored junior developers.', 
 '2020-03-01', '2023-08-31', false, 'New York, NY'),
('exp_2', 'usr_2', 'Full Stack Developer', 'Innovate Labs', 
 'Developing full-stack applications using modern web technologies.', 
 '2023-09-01', NULL, true, 'Remote');

-- Insert Education
INSERT INTO educations (education_id, user_id, institution, degree, field_of_study, description, start_year, end_year, current) VALUES
('edu_1', 'usr_2', 'State University', 'B.S. in Computer Science', 'Computer Science', 'Graduated with honors', 2015, 2019, false),
('edu_2', 'usr_2', 'Online Academy', 'Advanced React Development', 'Software Development', 'Focus on modern React patterns and best practices', 2022, 2022, false);

-- Insert Social Links
INSERT INTO social_links (social_id, user_id, platform, url, display_text) VALUES
('soc_1', 'usr_2', 'github', 'https://github.com/alicej', 'alicej'),
('soc_2', 'usr_2', 'linkedin', 'https://linkedin.com/in/alicejohnson', 'Alice Johnson'),
('soc_3', 'usr_2', 'twitter', 'https://twitter.com/alicecoding', '@alicecoding');

-- Insert Resume
INSERT INTO resumes (resume_id, user_id, file_url, file_name, file_size, uploaded_at, primary_resume) 
VALUES ('res_1', 'usr_2', 'https://example.com/resumes/alice_johnson.pdf', 'Alice_Johnson_Resume.pdf', 102400, '2023-10-01T14:30:00Z', true);

-- Insert Contact Messages
INSERT INTO contact_messages (message_id, name, email, subject, message, created_at, read) 
VALUES ('msg_1', 'John Smith', 'john@example.com', 'Partnership Inquiry', 
        'I would like to discuss a potential partnership. Please contact me at your earliest convenience.',
        '2023-10-25T10:30:00Z', false);