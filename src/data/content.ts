/**
 * All portfolio copy lives here. Edit this file to update the site.
 * Anything marked TODO is a placeholder: fill it in with your real value.
 */

export const profile = {
  name: 'Shreya Shah',
  role: 'Frontend Developer II',
  company: 'CloudThat',
  subtitle: 'Software Developer | Creative Problem Solver | Digital Builder',
  email: 'shreyashah2699@gmail.com',
  // TODO: add your LinkedIn and GitHub URLs. Empty strings render as "soon".
  linkedin: '',
  github: '',
  resumeUrl: '/resume.pdf', // TODO: drop your resume PDF into /public/resume.pdf
  intro: [
    "Hey! I'm Shreya Shah.",
    "I'm a software developer passionate about creating interactive web experiences, building scalable applications, solving real-world problems and exploring new technologies.",
    'I work across frontend development, backend APIs, cloud technologies and automation.',
  ],
  contactHeading: "Every great project starts with an idea. Let's build something amazing!",
}

export const journey = [
  {
    title: 'Frontend Developer II',
    org: 'CloudThat',
    when: 'Current role',
    text: 'Building enterprise web applications, microfrontend architecture, backend APIs, AWS integrations and chatbot experiences.',
  },
  {
    title: 'Enterprise portals',
    org: 'IOCL Vishleshan Portal',
    when: 'Project',
    text: 'Analytics portal with microfrontends, reconciliation monitoring dashboards and a customised chatbot UI.',
  },
  {
    title: 'Product applications',
    org: 'Third Eye Pictures',
    when: 'Project',
    text: 'End-to-end photography management application covering photographers, shoots and clients.',
  },
  {
    title: 'Automation',
    org: 'Certification Automation Generator',
    when: 'Project',
    text: 'React and Python workflow that generates certificates automatically.',
  },
]

export interface Tech {
  id: string
  name: string
  short: string
  color: string
  blurb: string
  uses: string[]
}

export const techs: Tech[] = [
  { id: 'js', name: 'JavaScript', short: 'JS', color: '#f7df1e', blurb: 'The language behind every interface I build, from async data flows to complex UI state.', uses: ['Async/await and API orchestration', 'DOM and browser APIs', 'Shared utilities across enterprise apps'] },
  { id: 'react', name: 'React.js', short: 'React', color: '#61dafb', blurb: 'My primary frontend library for dashboards, portals, chatbot UIs and automation tools.', uses: ['Component libraries and hooks', 'Dashboards for IOCL Vishleshan', 'Certification Automation Generator frontend'] },
  { id: 'ts', name: 'TypeScript', short: 'TS', color: '#3178c6', blurb: 'Typed contracts between UI and APIs that keep large codebases safe to change.', uses: ['Typed API clients and models', 'Safer refactors in shared modules', 'Strict props for reusable components'] },
  { id: 'html', name: 'HTML5', short: 'HTML', color: '#e34f26', blurb: 'Semantic, accessible markup as the foundation of every page.', uses: ['Semantic structure and landmarks', 'Accessible forms', 'SEO-friendly pages'] },
  { id: 'css', name: 'CSS3', short: 'CSS', color: '#2965f1', blurb: 'Responsive layout, animation and theming without fighting the cascade.', uses: ['Grid and flexbox layouts', 'Animations and transitions', 'Design-token driven theming'] },
  { id: 'tailwind', name: 'Tailwind CSS', short: 'TW', color: '#38bdf8', blurb: 'Utility-first styling for fast, consistent interfaces.', uses: ['Design systems with utility classes', 'Responsive and dark-mode variants', 'Rapid UI iteration'] },
  { id: 'node', name: 'Node.js', short: 'Node', color: '#6cc24a', blurb: 'Backend APIs and tooling in the same language as the frontend.', uses: ['REST API development', 'Integration services', 'Build and automation scripts'] },
  { id: 'python', name: 'Python', short: 'Py', color: '#ffd43b', blurb: 'Automation and backend logic, including certificate generation workflows.', uses: ['Certification Automation Generator backend', 'Workflow automation', 'Data processing scripts'] },
  { id: 'mysql', name: 'MySQL', short: 'SQL', color: '#00758f', blurb: 'Relational data modelling and queries behind management applications.', uses: ['Schema design', 'Joins and reporting queries', 'Data for management apps like Third Eye Pictures'] },
  { id: 'aws', name: 'AWS', short: 'AWS', color: '#ff9900', blurb: 'Cloud services for hosting, auth, APIs and storage. AWS Certified Developer - Associate.', uses: ['Lambda and API Gateway backends', 'S3 storage, Cognito auth', 'RDS databases'] },
  { id: 'rest', name: 'REST APIs', short: 'API', color: '#ff5d8f', blurb: 'Designing and consuming APIs that frontends and chatbots depend on.', uses: ['Resource design and error handling', 'Third-party integrations', 'Chatbot backends'] },
  { id: 'mfe', name: 'Microfrontends', short: 'MFE', color: '#a78bfa', blurb: 'Splitting large portals into independently shipped frontends.', uses: ['Module composition in IOCL Vishleshan', 'Shared state and routing contracts', 'Independent deployment'] },
]

export interface Project {
  id: string
  name: string
  color: string
  tagline: string
  description: string
  features: string[]
  tech: string[]
  contribution: string
  github: string
  live: string
  screenshots: string[]
}

export const projects: Project[] = [
  {
    id: 'third-eye',
    name: 'Third Eye Pictures',
    color: '#4da6ff',
    tagline: 'Photography management, end to end',
    description: 'A complete working photography management application that keeps photographers, shoots and clients organised in one place.',
    features: ['Photographer management', 'Shoot scheduling', 'Client management'],
    tech: ['React.js', 'Node.js', 'MySQL', 'REST APIs'],
    contribution: 'Built the application across the stack: UI, APIs and data model.',
    github: '', live: '',
    screenshots: ['/screens/third-eye-1.png', '/screens/third-eye-2.png'],
  },
  {
    id: 'iocl',
    name: 'IOCL Vishleshan Portal',
    color: '#ff7a45',
    tagline: 'Enterprise analytics, microfrontend style',
    description: 'An enterprise analytics portal delivered as a microfrontend experience, with monitoring and dashboards for business users.',
    features: ['Microfrontend architecture', 'Reconciliation monitoring', 'Dashboard development', 'Chatbot UI customisation'],
    tech: ['React.js', 'TypeScript', 'Microfrontends', 'REST APIs'],
    contribution: 'Developed dashboards and reconciliation monitoring screens, and customised the chatbot UI.',
    github: '', live: '',
    screenshots: ['/screens/iocl-1.png', '/screens/iocl-2.png'],
  },
  {
    id: 'cert-gen',
    name: 'Certification Automation Generator',
    color: '#4ade80',
    tagline: 'Certificates, generated automatically',
    description: 'A workflow tool that produces certificates automatically, removing a repetitive manual process.',
    features: ['Automated certificate generation', 'Workflow automation', 'React.js frontend', 'Python backend'],
    tech: ['React.js', 'Python', 'REST APIs'],
    contribution: 'Built the React frontend and the Python generation workflow.',
    github: '', live: '',
    screenshots: ['/screens/cert-1.png', '/screens/cert-2.png'],
  },
  {
    id: 'chatbots',
    name: 'Chatbot Applications',
    color: '#c084fc',
    tagline: 'Conversational interfaces that feel native',
    description: 'Interactive chatbot interfaces wired to backend services, with the conversational UI customised for each product.',
    features: ['Interactive chatbot interfaces', 'API integrations', 'Conversational UI customisation'],
    tech: ['React.js', 'TypeScript', 'REST APIs', 'AWS'],
    contribution: 'Built and customised chatbot UIs and connected them to backend APIs.',
    github: '', live: '',
    screenshots: ['/screens/chatbot-1.png', '/screens/chatbot-2.png'],
  },
]

export interface AwsService {
  id: string
  name: string
  color: string
  text: string
}

export const awsServices: AwsService[] = [
  { id: 'lambda', name: 'AWS Lambda', color: '#ff9900', text: 'Serverless functions that run backend logic without managing servers.' },
  { id: 'apigw', name: 'API Gateway', color: '#a166ff', text: 'The front door for REST APIs: routing, auth and throttling in front of Lambda.' },
  { id: 's3', name: 'Amazon S3', color: '#3fb950', text: 'Object storage for static hosting, uploads and generated assets.' },
  { id: 'cognito', name: 'Amazon Cognito', color: '#e5484d', text: 'User sign-in, tokens and access control for applications.' },
  { id: 'rds', name: 'Amazon RDS', color: '#4d8dff', text: 'Managed relational databases for application data.' },
  { id: 'arch', name: 'Cloud Architecture', color: '#2dd4bf', text: 'Combining these services into secure, scalable architectures: client, API Gateway, Lambda, data layer.' },
]

export const certifications = [
  { id: 'aws-dev', name: 'AWS Certified Developer - Associate', issuer: 'Amazon Web Services', badge: '/aws-badge.png' },
]

export const experienceAreas = [
  { id: 'role', name: 'Frontend Developer II', sub: 'CloudThat (current)', text: 'My current role: designing and shipping frontend features for enterprise applications.' },
  { id: 'enterprise', name: 'Enterprise Application Development', sub: 'Experience', text: 'Delivering production portals for large organisations with a focus on reliability and clear UX.' },
  { id: 'frontend', name: 'Frontend Engineering', sub: 'Experience', text: 'React, TypeScript and Tailwind: reusable components, performance and accessibility.' },
  { id: 'mfe', name: 'Microfrontend Architecture', sub: 'Experience', text: 'Composing independently deployable frontends into a single portal experience.' },
  { id: 'backend', name: 'Backend API Development', sub: 'Experience', text: 'Node.js and Python services, REST design and relational data.' },
  { id: 'aws', name: 'AWS Integrations', sub: 'Experience', text: 'Lambda, API Gateway, S3, Cognito and RDS wired into real applications.' },
  { id: 'chat', name: 'Chatbot Development', sub: 'Experience', text: 'Conversational UIs and their API integrations, customised per product.' },
]

export interface Achievement { id: string; name: string; text: string }
export const achievementList: Achievement[] = [
  { id: 'golden-builder', name: 'Golden Builder', text: 'Collected all 10 golden bricks.' },
  { id: 'explorer', name: 'World Explorer', text: 'Visited every island.' },
  { id: 'bug-squasher', name: 'Bug Squasher', text: 'Cleared a Debug Master level.' },
  { id: 'architect', name: 'Master Architect', text: 'Completed a building in Build My Project.' },
  { id: 'racer', name: 'Developer Racer', text: 'Finished the Developer Race.' },
]
