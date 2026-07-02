import { z } from 'zod'

export interface Profile {
  name: string
  role: string
  summary: string
  photoUrl: string
  showPhoto: boolean
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  github: string
}

export interface Experience {
  title: string
  company: string
  dateRange: string
  location: string
  note: string
  bullets: string[]
}

export interface Education {
  degree: string
  institution: string
  location: string
  dateRange: string
}

export interface Project {
  title: string
  dateRange: string
  location: string
  note: string
  bullets: string[]
}

export interface Language {
  name: string
  level: string
}

export interface CustomEntry {
  title: string
  subtitle: string
  dateRange: string
  bullets: string[]
}

export interface CustomSection {
  id: string
  title: string
  entries: CustomEntry[]
}

export interface Layout {
  left: string[]
  right: string[]
}

// Not rendered on the resume itself — a private note for tracking which job this variant
// was fine-tuned for, so it's easy to tell documents apart later (e.g. in the Documents
// sidebar) beyond just the document's own display name.
export interface TailoredFor {
  company: string
  position: string
}

export interface Resume {
  accentColor: string
  profile: Profile
  experience: Experience[]
  education: Education[]
  skills: string[]
  projects: Project[]
  languages: Language[]
  interests: string[]
  customSections: CustomSection[]
  layout: Layout
  dateInline: boolean
  tailoredFor: TailoredFor
}

export interface StringField {
  value: string
}

export interface FormExperience extends Omit<Experience, 'bullets'> {
  bullets: StringField[]
}

export interface FormProject extends Omit<Project, 'bullets'> {
  bullets: StringField[]
}

export interface FormCustomEntry extends Omit<CustomEntry, 'bullets'> {
  bullets: StringField[]
}

export interface FormCustomSection extends Omit<CustomSection, 'entries'> {
  entries: FormCustomEntry[]
}

export interface FormResume extends Omit<
  Resume,
  'experience' | 'projects' | 'skills' | 'interests' | 'customSections'
> {
  experience: FormExperience[]
  projects: FormProject[]
  skills: StringField[]
  interests: StringField[]
  customSections: FormCustomSection[]
}

const profileSchema = z.object({
  name: z.string(),
  role: z.string(),
  summary: z.string(),
  photoUrl: z.string(),
  showPhoto: z.boolean().default(true),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  website: z.string(),
  linkedin: z.string(),
  github: z.string(),
})

const experienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  dateRange: z.string(),
  location: z.string(),
  note: z.string().default(''),
  bullets: z.array(z.string()),
})

const educationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  location: z.string(),
  dateRange: z.string().default(''),
})

const projectSchema = z.object({
  title: z.string(),
  dateRange: z.string().default(''),
  location: z.string().default(''),
  note: z.string().default(''),
  bullets: z.array(z.string()),
})

const languageSchema = z.object({
  name: z.string(),
  level: z.string(),
})

const customEntrySchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().default(''),
  dateRange: z.string().default(''),
  bullets: z.array(z.string()).default([]),
})

const customSectionSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  entries: z.array(customEntrySchema).default([]),
})

const layoutSchema = z.object({
  left: z.array(z.string()),
  right: z.array(z.string()),
})

const tailoredForSchema = z.object({
  company: z.string().default(''),
  position: z.string().default(''),
})

export const resumeSchema = z.object({
  accentColor: z.string().default('#292929'),
  profile: profileSchema,
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: z.array(z.string()),
  projects: z.array(projectSchema),
  languages: z.array(languageSchema),
  interests: z.array(z.string()),
  customSections: z.array(customSectionSchema).default([]),
  layout: layoutSchema.default({
    left: ['experience', 'education'],
    right: ['skills', 'projects', 'languages', 'interests'],
  }),
  dateInline: z.boolean().default(false),
  tailoredFor: tailoredForSchema.default({ company: '', position: '' }),
})

// ============================================================
// Multiple resume documents ("Documents" sidebar)
// ============================================================
// A user can upload/keep several resumes side by side (e.g. one variant per job
// description) and switch between them. Storage keeps a lightweight index (`DocumentMeta`,
// one per document) separate from each document's heavy `Resume` body (which can carry a
// multi-hundred-KB base64 photo) — see storage.ts. `ResumeDocument` is the assembled shape
// the rest of the app works with.
export interface DocumentMeta {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  accentColor: string
}

export interface ResumeDocument {
  id: string
  name: string
  resume: Resume
  createdAt: number
  updatedAt: number
}

export const documentMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  accentColor: z.string(),
})

export const documentMetaListSchema = z.array(documentMetaSchema)

export const resumeDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  resume: resumeSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
})
