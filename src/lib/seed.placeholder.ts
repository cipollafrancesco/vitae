import { Resume } from './types'

export const seedResume: Resume = {
  accentColor: '#292929',
  profile: {
    name: 'Alex Rivera',
    role: 'Senior Frontend Engineer',
    summary:
      "I'm a Senior Frontend Engineer with a background in both consultancy and product development. I enjoy building performant, accessible interfaces and mentoring teams on modern frontend practices. Outside of work I like exploring new frameworks and contributing to open source.",
    photoUrl: '',
    showPhoto: true,
    email: 'alex.rivera@example.com',
    phone: '(+1) 555-0100',
    location: 'Remote',
    website: 'alexrivera.example.com',
    linkedin: 'linkedin.com/in/alexrivera',
    github: 'github.com/alexrivera',
  },
  experience: [
    {
      title: 'Senior Frontend Engineer',
      company: 'Acme Streaming Co.',
      dateRange: '08/2023 - Present',
      location: 'Fully Remote',
      note: '',
      bullets: [
        'Rebuilt the core video player with a modular, monorepo-based architecture, led the design system implementation and delivered new features while optimizing performance on low-end devices.',
        'Evaluated tools and coached the team on AI-assisted development workflows, accelerating delivery across the org.',
      ],
    },
    {
      title: 'Frontend Engineer',
      company: 'Bright Media',
      dateRange: '11/2021 - 12/2024',
      location: 'Fully Remote',
      note: '',
      bullets: [
        "Modernized the platform's legacy codebase, improved developer experience, and helped make the product white-label to scale across multiple brands and Smart TV apps.",
      ],
    },
    {
      title: 'Frontend Developer',
      company: 'Northwind Software',
      dateRange: '11/2017 - 11/2021',
      location: 'City, Country',
      note: '',
      bullets: [
        'Built enterprise web apps for insurance clients using a Redux-centric architecture, alongside RxJS for reactive side-effects and complex workflows.',
      ],
    },
  ],
  education: [
    {
      degree: "Bachelor's Degree - Computer Science",
      institution: 'State University',
      location: 'City, Country',
      dateRange: '',
    },
    {
      degree: 'Undergraduate Master - Media Technologies',
      institution: 'Institute of Technology',
      location: 'City, Country',
      dateRange: '10/2016 - 07/2018',
    },
  ],
  skills: [
    'React',
    'Redux/RTK',
    'React Query',
    'Next.js',
    'TypeScript',
    'Playwright',
    'Jest',
    'Storybook',
    'Styled Components',
    'Sass',
    'Tailwind',
    'Figma',
    'UI/UX',
    'SCRUM',
    'TDD',
    'Design Systems & Tokens',
  ],
  projects: [
    {
      title: 'Freelancing',
      dateRange: '2024 - Present',
      location: '',
      note: '',
      bullets: [
        'Collaborated with clients on digital projects, focusing on fullstack development and tailored solution integration.',
        'Tech Stack: Next.js, Tailwind, Prisma, Vercel, etc.',
      ],
    },
    {
      title: 'Sample SaaS — Co-founder & Frontend Lead',
      dateRange: '2023 - 2025',
      location: '',
      note: '',
      bullets: [
        'Co-founded a SaaS product for improving ad ROAS and lead generation via data enrichment.',
        'Led app development and integrations; collaborated on product direction, onboarding flows, and analytics.',
      ],
    },
    {
      title: 'Hackathon Project',
      dateRange: 'First Prize @ Sample Hackathon 2017',
      location: '',
      note: '',
      bullets: [
        'Built a tool mapping the probabilities of severe weather events using open satellite data.',
      ],
    },
  ],
  languages: [
    { name: 'English', level: 'Native or Bilingual Proficiency' },
    { name: 'Spanish', level: 'Full Professional Proficiency' },
  ],
  interests: ['Surfing', 'Basketball', 'Music', 'Technology', 'Design', 'Travelling', 'Food'],
  customSections: [],
  layout: {
    left: ['experience', 'education'],
    right: ['skills', 'projects', 'languages', 'interests'],
  },
  dateInline: false,
  tailoredFor: { company: '', position: '' },
}
