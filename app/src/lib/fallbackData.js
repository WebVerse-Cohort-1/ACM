// src/lib/fallbackData.js
// High-quality local fallback data for ACM TSEC frontend if Sanity CMS is empty or unreachable due to CORS/network blocks.

export const FALLBACK_EVENTS = [
  {
    title: "Internship Gap Seminar",
    slug: "internship-gap",
    dateText: "9 JUL 2026   ONLINE",
    eventDate: "2026-07-09T10:00:00Z",
    category: "SEMINAR",
    desc: "TSEC ACM Student Chapter conducted the online seminar 'Internship Gap: Why Good Students Still Don't Get Selected' led by Ms. Deepti K S (Vendavo). The session offered practical insights into internship recruitment, resume building, LinkedIn optimization, interview preparation, and professional branding.",
    images: ["https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1200"],
    speakers: [
      { name: "Ms. Deepti K S", role: "Speaker", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400", linkedin: "#" }
    ]
  },
  {
    title: "AI Tools Workshop",
    slug: "ai-tools-workshop",
    dateText: "27 MAR 2026   2 HOURS   CC1 & CC2",
    eventDate: "2026-03-27T09:30:00Z",
    category: "WORKSHOP",
    desc: "The AI Tools Workshop 2026 was organized with the objective of introducing students to the rapidly evolving ecosystem of Artificial Intelligence-powered development tools. The workshop aimed to bridge the gap between theoretical knowledge and practical implementation by providing participants with hands-on exposure to modern AI-assisted workflows.",
    images: ["https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200"],
    tracks: [
      { name: "Prompt Engineering", desc: "Familiarize students with prompt engineering and effective interaction with LLMs." },
      { name: "Web Development", desc: "Enable participants to transform ideas into functional web applications." }
    ],
    speakers: [
      { name: "Mr. Divij Shah", role: "Speaker", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400", linkedin: "#" }
    ]
  },
  {
    title: "AI Tools Quiz",
    slug: "ai-tools-quiz",
    dateText: "27 MAR 2026   1 HOUR   CC1 & CC2",
    eventDate: "2026-03-27T11:45:00Z",
    category: "QUIZ",
    desc: "The AI Tools Quiz 2026 was organized as the concluding activity of the AI Tools Workshop. The quiz was designed to evaluate participants' understanding of the concepts, tools, and workflows introduced during the workshop. Through an engaging format, students tested their knowledge of modern AI technologies while reinforcing their practical skills.",
    images: ["https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1200"],
    prizePool: 3300
  },
  {
    title: "DEVSPRINT 2K26",
    slug: "devsprint",
    dateText: "27 MAR 2026   8.5 HOURS   LAB 12 & 13",
    eventDate: "2026-03-27T08:30:00Z",
    category: "HACKATHON",
    desc: "DevSprint Mini Hackathon was organized by ACM Students Chapter and CodeCrafters with the aim of encouraging innovation, creativity, and practical learning among students. This event provided a platform for participants to think critically, work collaboratively, and develop solutions within a limited time frame addressing real-life issues related to leftover food.",
    images: ["https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200"],
    tracks: [
      { name: "Web Development", desc: "Develop functional applications to redistribute leftover food." }
    ],
    speakers: [
      { name: "Mrs. Bhagyashri Kakirde", role: "Judge", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400", linkedin: "#" },
      { name: "Mr. Mayur Mehta", role: "Judge", image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=400", linkedin: "#" }
    ]
  },
  {
    title: "Inauguration Ceremony",
    slug: "inauguration",
    dateText: "6 MAR 2026   1.5 HOURS   3D THEATRE",
    eventDate: "2026-03-06T10:00:00Z",
    category: "CEREMONY",
    desc: "The Department of Computer Engineering successfully organized the Inauguration Ceremony of the TSEC ACM Student Chapter at the 3D Theatre, marking the beginning of a dynamic and innovation-driven student community.",
    images: ["https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200"]
  }
];

export const FALLBACK_MEMBERS = [
  { name: 'Vaishali Rane', branch: 'CO', year: '-', role: 'Chief Patron', category: 'Faculty', desc: "Leading with strategic vision and providing overarching support for the chapter's mission.", image: "#", linkedin: "#" },
  { name: 'Smita Dandge', branch: 'CO', year: '-', role: 'Faculty Sponsor', category: 'Faculty', desc: "Guiding the chapter with academic leadership and professional mentorship.", image: "#", linkedin: "#" },
  { name: 'Kashif Sheikh', branch: 'CO', year: '-', role: 'Faculty Co-Sponsor', category: 'Faculty', desc: "Providing strategic guidance and support for chapter initiatives.", image: "#", linkedin: "#" },
  { name: 'Aaditya Devghare', branch: 'CO', year: 'SY', role: 'Chairperson', category: 'Core', desc: "Leading the chapter with a focus on community building and global tech standards.", image: "#", linkedin: "https://www.linkedin.com/in/aaditya-devghare" },
  { name: 'Ishika Mehta', branch: 'CO', year: 'SY', role: 'Vice Chairperson', category: 'Core', desc: "Driving internal operations and coordinating between diverse team verticals.", image: "#", linkedin: "https://www.linkedin.com/in/ishika-mehta-" },
  { name: 'Nigam Tiwari', branch: 'CO', year: 'SY', role: 'Membership Chair', category: 'Core', desc: "Expanding our reach and ensuring value for every TSEC ACM member.", image: "#", linkedin: "https://www.linkedin.com/in/nigam-tiwari-8a76233a3" },
  { name: 'Sagar Gupta', branch: 'CO', year: 'SY', role: 'Treasurer', category: 'Core', desc: "Managing chapter finances with precision and strategic allocation.", image: "#", linkedin: "https://www.linkedin.com/in/sagar-gupta-8788052ab" },
  { name: 'Aditya Mishra', branch: 'CO', year: 'SY', role: 'Secretary', category: 'Core', desc: "Overseeing administrative tasks and maintaining chapter records.", image: "#", linkedin: "https://www.linkedin.com/in/aditya-mishra-b76b7436a" },
  { name: 'Shivam Pal', branch: 'CO', year: 'SY', role: 'Technical Head', category: 'Tech Team', desc: "Architecting codebases and leading technical research initiatives.", image: "#", linkedin: "https://www.linkedin.com/in/shivampal7" },
  { name: 'Aman Mandal', branch: 'AIML', year: 'SY', role: 'Technical Head', category: 'Tech Team', desc: "Specializing in software architecture and technical implementation.", image: "#", linkedin: "https://www.linkedin.com/in/amanmandal35" },
  { name: 'Rushabh Singh', branch: 'CO', year: 'SY', role: 'Webmaster', category: 'Web Team', desc: "Building immersive digital experiences with modern web stacks.", image: "#", linkedin: "https://www.linkedin.com/in/rushabh-anil-singh/" },
  { name: 'Shubham Singh', branch: 'CO', year: 'SY', role: 'Webmaster', category: 'Web Team', desc: "Optimizing web performance and maintaining digital infrastructure.", image: "#", linkedin: "https://www.linkedin.com/in/shubham-singh-564602314" },
  { name: 'Krishi Oza', branch: 'CO', year: 'SY', role: 'Creative Designer', category: 'Creative Team', desc: "Visual storytelling through high-impact graphic design.", image: "#", linkedin: "https://www.linkedin.com/in/krishi-oza-86399a3b2" },
  { name: 'Janish Dave', branch: 'CO', year: 'SY', role: 'Creative Designer', category: 'Creative Team', desc: "Crafting visual identities that resonate with our tech community.", image: "#", linkedin: "#" },
  { name: 'Samhita Hejmadi', branch: 'CO', year: 'SY', role: 'UI/UX Designer', category: 'Creative Team', desc: "Designing user-centric interfaces for seamless digital navigation.", image: "#", linkedin: "https://www.linkedin.com/in/samhita-hejmadi-7a0892262" },
  { name: 'Sahir Sheikh', branch: 'CO', year: 'SY', role: 'UI/UX Designer', category: 'Creative Team', desc: "Creating intuitive user journeys and aesthetic digital interfaces.", image: "#", linkedin: "https://www.linkedin.com/in/sahir-shaikh-b19b90281" },
  { name: 'Amaan Sheikh', branch: 'CO', year: 'SY', role: 'Newsletter Editor', category: 'Editorial & Content Team', desc: "Curating the latest tech news for our weekly subscriber base.", image: "#", linkedin: "https://www.linkedin.com/in/mohammed-amaan-shaikh-2a5518346" },
  { name: 'Aadiish Shukla', branch: 'CO', year: 'SY', role: 'Content Writer', category: 'Editorial & Content Team', desc: "Translating complex tech concepts into engaging written narratives.", image: "#", linkedin: "#" },
  { name: 'Shivam Tiwari', branch: 'CO', year: 'SY', role: 'Cinematographer', category: 'Editorial & Content Team', desc: "Capturing the essence of events through dynamic visual lenses.", image: "#", linkedin: "https://www.linkedin.com/in/shivam-tiwari-381872337" },
  { name: 'Aditya Bhatt', branch: 'CO', year: 'SY', role: 'Social Media Manager', category: 'Social Media Team', desc: "Managing our digital footprint and community engagement.", image: "#", linkedin: "https://www.linkedin.com/in/aditya-bhatt-1710123a5" },
  { name: 'Ayushi Labde', branch: 'Comps-A', year: 'FY', role: 'Social Media Manager', category: 'Social Media Team', desc: "Curating viral content and handling channel outreach.", image: "#", linkedin: "https://www.linkedin.com/in/ayushi-labde-74872931b" },
  { name: 'Sonal Tripathi', branch: 'CO', year: 'SY', role: 'Operational Head', category: 'Operations Team', desc: "Ensuring smooth execution of all logistical and back-end pipelines.", image: "#", linkedin: "https://www.linkedin.com/in/sonaltripathi20" },
  { name: 'Asmita Chauhan', branch: 'CO', year: 'SY', role: 'Event Head', category: 'Event Team', desc: "Conceptualizing and managing large-scale flagship hackathons.", image: "#", linkedin: "https://www.linkedin.com/in/asmita-chauhan-8083682a0" },
  { name: 'Samriddhi Singh', branch: 'CO', year: 'SY', role: 'Event Head', category: 'Event Team', desc: "Coordinating workshop logistics and speaker onboarding.", image: "#", linkedin: "https://www.linkedin.com/in/samriddhi-singh-0a770238a" },
  { name: 'Nidhi Lad', branch: 'CO', year: 'SY', role: 'Event Head', category: 'Event Team', desc: "Managing onsite operations and attendee experience metrics.", image: "#", linkedin: "https://www.linkedin.com/in/nidhi-lad-6187a8354" },
  { name: 'Arushi Singh', branch: 'CO', year: 'SY', role: 'Marketing Manager', category: 'Marketing Team', desc: "Developing strategies to expand chapter visibility and reach.", image: "#", linkedin: "https://www.linkedin.com/in/arushi-singh-b327643a3" },
  { name: 'Jaya Yadav', branch: 'CO', year: 'SY', role: 'Marketing Manager', category: 'Marketing Team', desc: "Driving brand growth through targeted outreach and communication.", image: "#", linkedin: "https://www.linkedin.com/in/jaya-yadav-560a103a1" }
];

export const FALLBACK_ABOUT = {
  whatIsAcm: 'The TSEC ACM Student Chapter at Thakur Shyamnarayan Engineering College is a dynamic student-driven community committed to fostering technical excellence, innovation, and holistic student development.',
  vision: 'To build a future-ready community of innovators who leverage computing to solve real-world problems and drive meaningful societal impact.',
  mission: '1. To cultivate critical thinking and technical excellence through hands-on learning, competitions, and collaborative projects.\n2. To promote innovation and research by encouraging students to explore emerging technologies and build impactful solutions.\n3. To nurture leadership, entrepreneurship, and teamwork through diverse technical and creative initiatives.\n4. To create a strong tech community that bridges academia, industry, and society.',
  stats: [{ label: 'MEMBERS', value: 500 }, { label: 'EVENTS', value: 30 }, { label: 'AWARDS', value: 10 }],
  legacyLogs: [
    { year: '2025', title: 'National Apex', desc: 'Awarded Best Student Chapter nationwide.' },
    { year: '2023', title: 'Source Code', desc: 'Launched open-source initiative with 500+ PRs.' },
  ]
};
