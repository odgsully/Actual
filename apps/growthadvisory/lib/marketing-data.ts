// Marketing page content data

// =============================================
// NAVIGATION TYPES
// =============================================

export interface NavChild {
  label: string;
  href: string;
  description?: string;
}

export interface NavLink {
  label: string;
  href: string;
  hasDropdown: boolean;
  children?: NavChild[];
}

// =============================================
// TESTIMONIAL TYPES
// =============================================

export interface Testimonial {
  quote: string;
  name: string;
  initials: string;
  company: string;
  role: string;
  category?: 'ai' | 'operations' | 'development';
  rating?: number; // 1-5 stars
  featured?: boolean;
  outcome?: string; // e.g., "40% improvement in forecasting"
}

// =============================================
// PAGE CONTENT
// =============================================

export const heroContent = {
  eyebrow: 'AI-Driven Growth for SMBs',
  headline: 'Empower your business with intelligent systems',
  highlightWord: 'intelligent',
  subheadline:
    'Bleeding-edge tooling insights and custom AI solutions that amplify your domain expertise — turning operational friction into competitive advantage.',
  primaryCta: {
    text: 'Book a Discovery Call',
    href: 'https://calendar.notion.so/meet/gbsullivan/meet',
  },
  secondaryCta: {
    text: 'View Services',
    href: '#services',
  },
};

export const clientLogos = [
  {
    name: '6735 PV LLC',
    src: '/assets/6735pvllc.png',
  },
  {
    name: 'Base Robotics',
    src: '/assets/BASE+ROBOTICS+(3).webp',
  },
  {
    name: 'Velocity Volts',
    src: '/assets/VelocityVolts_Logo.webp',
  },
  {
    name: 'Last Mile Logistics',
    src: '/assets/lastmilelogistics.png',
  },
];

export const painPoints = [
  {
    stat: '47%',
    title: 'Data Integrity Crisis',
    description:
      'Newly-created data records contain at least one critical error. Bad data cascades through every decision your team makes — from sales forecasting to customer targeting.',
    isLarge: true, // First card spans 2 columns
  },
  {
    stat: '15-20%',
    title: 'Wasted Software Potential',
    description: 'Teams utilize only a fraction of their software capabilities.',
    isLarge: false,
  },
  {
    stat: '30%',
    title: 'Revenue Lost to Fragmentation',
    description: 'Disconnected tools and siloed data create friction that compounds daily.',
    isLarge: false,
  },
];

export const services = [
  {
    icon: 'ai',
    title: 'AI Solutions',
    description:
      'Custom AI implementations that integrate directly into your existing workflows. From automating repetitive tasks to building predictive models that inform strategy.',
    features: ['Process Automation', 'LLM Integration', 'Predictive Analytics'],
  },
  {
    icon: 'workflow',
    title: 'Operations & Workflow',
    description:
      'Streamline your revenue operations with connected systems. We eliminate data silos and build workflows that keep your team focused on what matters.',
    features: ['CRM Setup', 'RevOps', 'Tool Integration'],
  },
  {
    icon: 'code',
    title: 'Full-Stack Development',
    description:
      'Custom web applications, internal tools, and API integrations built with modern frameworks. Scalable architecture that grows with your business.',
    features: ['Web Apps', 'Internal Tools', 'API Development'],
  },
];

export const methodology = [
  {
    phase: 1,
    title: 'Discover',
    duration: '1 Week',
    description:
      'Deep-dive into your current systems, pain points, and aspirations. We map every tool, process, and data flow.',
  },
  {
    phase: 2,
    title: 'Design',
    duration: '1 Week',
    description:
      'Architect solutions tailored to your team. Wireframes, system diagrams, and a clear roadmap before we write a line of code.',
  },
  {
    phase: 3,
    title: 'Develop',
    duration: '1-4 Months',
    description:
      'Iterative sprints with weekly check-ins. You see progress in real-time and can adjust priorities as we build.',
  },
  {
    phase: 4,
    title: 'Maintain',
    duration: 'Ongoing',
    description:
      'Continuous monitoring, optimization, and support. Your systems evolve as your business scales.',
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      'Growth Advisory transformed how we handle our operations. The AI integrations alone saved us 20+ hours a week.',
    name: 'Sarah Chen',
    initials: 'SC',
    company: 'TechStart',
    role: 'CEO',
    category: 'ai',
    rating: 5,
    featured: true,
    outcome: '20+ hours saved weekly',
  },
  {
    quote:
      'AI integrations have given us insights we didn\'t know were possible. Forecasting accuracy improved by 40%.',
    name: 'Marcus Johnson',
    initials: 'MJ',
    company: 'ScaleUp',
    role: 'Ops Director',
    category: 'ai',
    rating: 5,
    featured: true,
    outcome: '40% improvement in forecasting',
  },
  {
    quote:
      'The team understands both technical and business implications. They don\'t just build — they think alongside you.',
    name: 'Emily Rodriguez',
    initials: 'ER',
    company: 'GreenLeaf',
    role: 'Founder',
    category: 'development',
    rating: 5,
    featured: false,
  },
  {
    quote:
      'Our CRM was a mess before working with Growth Advisory. Now our sales team has full visibility into the pipeline and closes 25% more deals.',
    name: 'David Kim',
    initials: 'DK',
    company: 'Nexus Solutions',
    role: 'VP Sales',
    category: 'operations',
    rating: 5,
    featured: true,
    outcome: '25% increase in closed deals',
  },
  {
    quote:
      'They built us a custom dashboard that connects all our tools. We went from 8 tabs open at all times to one source of truth.',
    name: 'Rachel Torres',
    initials: 'RT',
    company: 'Bright Horizons',
    role: 'COO',
    category: 'development',
    rating: 5,
    featured: false,
    outcome: '8 tools unified into 1 dashboard',
  },
  {
    quote:
      'The implementation audit revealed $50k in annual savings we didn\'t know we were leaving on the table. Worth every penny.',
    name: 'Michael Okonkwo',
    initials: 'MO',
    company: 'Evergreen Retail',
    role: 'CFO',
    category: 'operations',
    rating: 5,
    featured: true,
    outcome: '$50k annual savings identified',
  },
  {
    quote:
      'Working with Growth Advisory felt like having a senior engineer and business strategist in one. They questioned our assumptions in the best way.',
    name: 'Lisa Wang',
    initials: 'LW',
    company: 'Pulse Analytics',
    role: 'CTO',
    category: 'ai',
    rating: 5,
    featured: false,
  },
  {
    quote:
      'We needed someone who could speak both to our engineers and our executives. Growth Advisory bridged that gap perfectly.',
    name: 'James Martinez',
    initials: 'JM',
    company: 'SkyPath Ventures',
    role: 'Managing Partner',
    category: 'operations',
    rating: 5,
    featured: false,
  },
];

export const navLinks: NavLink[] = [
  {
    label: 'Services',
    href: '/services',
    hasDropdown: true,
    children: [
      {
        label: 'Growth Academy',
        href: '/services/growth-academy',
        description: 'Training and enablement programs',
      },
      {
        label: 'Human Context Suites',
        href: '/services/human-context-suites',
        description: 'AI + human workflow integration',
      },
      {
        label: 'Custom Scaffolding',
        href: '/services/custom-scaffolding',
        description: 'Tailored system architecture',
      },
      {
        label: 'Implementation Audit',
        href: '/services/implementation-audit',
        description: 'Diagnostic review of your stack',
      },
    ],
  },
  {
    label: 'Referral Wall',
    href: '/referral-wall',
    hasDropdown: false,
  },
  {
    label: 'Resources',
    href: '/resources',
    hasDropdown: true,
    children: [
      {
        label: 'Case Studies',
        href: '/resources/case-studies',
        description: 'Client success stories',
      },
      {
        label: 'Podcast',
        href: '/resources/podcast',
        description: 'Growth insights on demand',
      },
      {
        label: 'Newsletter',
        href: '/resources/newsletter',
        description: 'Weekly insights delivered',
      },
    ],
  },
];

export const footerLinks = {
  services: [
    { label: 'AI Solutions', href: '#services' },
    { label: 'Operations & Workflow', href: '#services' },
    { label: 'Full-Stack Development', href: '#services' },
    { label: 'Our Process', href: '#process' },
  ],
  company: [
    { label: 'Client Stories', href: '#clients' },
    { label: 'Contact', href: 'mailto:hello@growthadvisory.ai' },
    { label: 'Book a Call', href: 'https://calendar.notion.so/meet/gbsullivan/meet' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export const companyInfo = {
  name: 'Growth Advisory',
  tagline: 'AI-driven consulting for small and mid-size businesses ready to scale with intelligent systems.',
  email: 'hello@growthadvisory.ai',
  bookingUrl: 'https://calendar.notion.so/meet/gbsullivan/meet',
};
