const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '9js05zdy',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
  token: process.env.SANITY_API_TOKEN || 'skfYsvcNv1z5RKClXF1eCauID6B4mWAx3C0LcvVpYRxl691QkaNd6zVjO5SFL6i8CloY5vemU5luY8VQzqINBZRrRBMTmglGAS3U6izQgkjRfBvTCZPKizUFEjv5KMFE5M0fZj5USs2QFL7wvssZoFs0kK6X52HUCZ91Cf8fOtdql1q4Qr1K', // Make sure this token has write access
});

const members = [
  { name: 'Vaishali Rane', branch: 'CO', year: '-', role: 'Chief Patron', category: 'Faculty', desc: "Leading with strategic vision and providing overarching support for the chapter's mission.", image: "/Photoshot ACM/vaishali rane.jpeg", linkedin: "#" },
  { name: 'Smita Dandge', branch: 'CO', year: '-', role: 'Faculty Sponsor', category: 'Faculty', desc: "Guiding the chapter with academic leadership and professional mentorship.", image: "/Photoshot ACM/smita dange.jpeg", linkedin: "#" },
  { name: 'Kashif Sheikh', branch: 'CO', year: '-', role: 'Faculty Co-Sponsor', category: 'Faculty', desc: "Providing strategic guidance and support for chapter initiatives.", image: "/Photoshot ACM/kashif sheikh.jpeg", linkedin: "#" },
  { name: 'Aaditya Devghare', branch: 'CO', year: 'SY', role: 'Chairperson', category: 'Core', desc: "Leading the chapter with a focus on community building and global tech standards.", image: "/Photoshot ACM/aditya devghare.jpeg", linkedin: "https://www.linkedin.com/in/aaditya-devghare" },
  { name: 'Ishika Mehta', branch: 'CO', year: 'SY', role: 'Vice Chairperson', category: 'Core', desc: "Driving internal operations and coordinating between diverse team verticals.", image: "/Photoshot ACM/ishika mehta.jpeg", linkedin: "https://www.linkedin.com/in/ishika-mehta-" },
  { name: 'Nigam Tiwari', branch: 'CO', year: 'SY', role: 'Membership Chair', category: 'Core', desc: "Expanding our reach and ensuring value for every TSEC ACM member.", image: "/Photoshot ACM/nigam tiwari.png", linkedin: "https://www.linkedin.com/in/nigam-tiwari-8a76233a3" },
  { name: 'Sagar Gupta', branch: 'CO', year: 'SY', role: 'Treasurer', category: 'Core', desc: "Managing chapter finances with precision and strategic allocation.", image: "/Photoshot ACM/sagar gupta.jpeg", linkedin: "https://www.linkedin.com/in/sagar-gupta-8788052ab" },
  { name: 'Aditya Mishra', branch: 'CO', year: 'SY', role: 'Secretary', category: 'Core', desc: "Overseeing administrative tasks and maintaining chapter records.", image: "/Photoshot ACM/aditya mishra.jpeg", linkedin: "https://www.linkedin.com/in/aditya-mishra-b76b7436a" },
  { name: 'Shivam Pal', branch: 'CO', year: 'SY', role: 'Technical Head', category: 'Tech Team', desc: "Architecting codebases and leading technical research initiatives.", image: "/Photoshot ACM/shivam pal.jpeg", linkedin: "https://www.linkedin.com/in/shivampal7" },
  { name: 'Aman Mandal', branch: 'AIML', year: 'SY', role: 'Technical Head', category: 'Tech Team', desc: "Specializing in software architecture and technical implementation.", image: "/Photoshot ACM/aman mandal.jpeg", linkedin: "https://www.linkedin.com/in/amanmandal35" },
  { name: 'Rushabh Singh', branch: 'CO', year: 'SY', role: 'Webmaster', category: 'Web Team', desc: "Building immersive digital experiences with modern web stacks.", image: "/Photoshot ACM/rushabh singh.jpeg", linkedin: "https://www.linkedin.com/in/rushabh-anil-singh/" },
  { name: 'Shubham Singh', branch: 'CO', year: 'SY', role: 'Webmaster', category: 'Web Team', desc: "Optimizing web performance and maintaining digital infrastructure.", image: "/Photoshot ACM/shubham singh.jpeg", linkedin: "https://www.linkedin.com/in/shubham-singh-564602314" },
  { name: 'Krishi Oza', branch: 'CO', year: 'SY', role: 'Creative Designer', category: 'Creative Team', desc: "Visual storytelling through high-impact graphic design.", image: "/Photoshot ACM/krishi oza.jpeg", linkedin: "https://www.linkedin.com/in/krishi-oza-86399a3b2" },
  { name: 'Janish Dave', branch: 'CO', year: 'SY', role: 'Creative Designer', category: 'Creative Team', desc: "Crafting visual identities that resonate with our tech community.", image: "/Photoshot ACM/jainish dave.jpeg", linkedin: "#" },
  { name: 'Samhita Hejmadi', branch: 'CO', year: 'SY', role: 'UI/UX Designer', category: 'Creative Team', desc: "Designing user-centric interfaces for seamless digital navigation.", image: "/Photoshot ACM/samhita hejmadi.jpeg", linkedin: "https://www.linkedin.com/in/samhita-hejmadi-7a0892262" },
  { name: 'Sahir Sheikh', branch: 'CO', year: 'SY', role: 'UI/UX Designer', category: 'Creative Team', desc: "Creating intuitive user journeys and aesthetic digital interfaces.", image: "/Photoshot ACM/sahir sheikh.jpeg", linkedin: "https://www.linkedin.com/in/sahir-shaikh-b19b90281" },
  { name: 'Amaan Sheikh', branch: 'CO', year: 'SY', role: 'Newsletter Editor', category: 'Editorial & Content Team', desc: "Curating the latest tech news for our weekly subscriber base.", image: "/Photoshot ACM/amaan sheikh.jpeg", linkedin: "https://www.linkedin.com/in/mohammed-amaan-shaikh-2a5518346" },
  { name: 'Aadiish Shukla', branch: 'CO', year: 'SY', role: 'Content Writer', category: 'Editorial & Content Team', desc: "Translating complex tech concepts into engaging written narratives.", image: "/Photoshot ACM/aadish shukla.jpeg", linkedin: "#" },
  { name: 'Shivam Tiwari', branch: 'CO', year: 'SY', role: 'Cinematographer', category: 'Editorial & Content Team', desc: "Capturing the essence of events through dynamic visual lenses.", image: "/Photoshot ACM/shivam tiwari.jpeg", linkedin: "https://www.linkedin.com/in/shivam-tiwari-381872337" },
  { name: 'Aditya Bhatt', branch: 'CO', year: 'SY', role: 'Social Media Manager', category: 'Social Media Team', desc: "Managing our digital footprint and community engagement.", image: "/Photoshot ACM/aditya bhat.jpg", linkedin: "https://www.linkedin.com/in/aditya-bhatt-1710123a5" },
  { name: 'Ayushi Labde', branch: 'Comps-A', year: 'FY', role: 'Social Media Manager', category: 'Social Media Team', desc: "Curating viral content and handling channel outreach.", image: "/Photoshot ACM/ayushi labde.jpeg", linkedin: "https://www.linkedin.com/in/ayushi-labde-74872931b" },
  { name: 'Sonal Tripathi', branch: 'CO', year: 'SY', role: 'Operational Head', category: 'Operations Team', desc: "Ensuring smooth execution of all logistical and back-end pipelines.", image: "/Photoshot ACM/sonal  tripathi.jpeg", linkedin: "https://www.linkedin.com/in/sonaltripathi20" },
  { name: 'Asmita Chauhan', branch: 'CO', year: 'SY', role: 'Event Head', category: 'Event Team', desc: "Conceptualizing and managing large-scale flagship hackathons.", image: "/Photoshot ACM/asmita chauhan.jpeg", linkedin: "https://www.linkedin.com/in/asmita-chauhan-8083682a0" },
  { name: 'Samriddhi Singh', branch: 'CO', year: 'SY', role: 'Event Head', category: 'Event Team', desc: "Coordinating workshop logistics and speaker onboarding.", image: "/Photoshot ACM/sammriddhi singh.jpeg", linkedin: "https://www.linkedin.com/in/samriddhi-singh-0a770238a" },
  { name: 'Nidhi Lad', branch: 'CO', year: 'SY', role: 'Event Head', category: 'Event Team', desc: "Managing onsite operations and attendee experience metrics.", image: "/Photoshot ACM/nidhi lad.jpeg", linkedin: "https://www.linkedin.com/in/nidhi-lad-6187a8354" },
  { name: 'Arushi Singh', branch: 'CO', year: 'SY', role: 'Marketing Manager', category: 'Marketing Team', desc: "Developing strategies to expand chapter visibility and reach.", image: "/Photoshot ACM/arushi singh.jpeg", linkedin: "https://www.linkedin.com/in/arushi-singh-b327643a3" },
  { name: 'Jaya Yadav', branch: 'CO', year: 'SY', role: 'Marketing Manager', category: 'Marketing Team', desc: "Driving brand growth through targeted outreach and communication.", image: "/Photoshot ACM/jaya yadav.jpeg", linkedin: "https://www.linkedin.com/in/jaya-yadav-560a103a1" },
];

async function seedMembers() {
  console.log('Seeding members...');
  for (const member of members) {
    const doc = {
      _type: 'member',
      name: member.name,
      email: `${member.name.toLowerCase().replace(/\s+/g, '')}@acm-tsec.com`,
      branch: member.branch,
      year: member.year,
      role: member.role,
      category: member.category,
      desc: member.desc,
      linkedin: member.linkedin,
      driveProfilePictureId: member.image,
    };

    try {
      const res = await client.create(doc);
      console.log(`Created member: ${res.name} in category ${res.category}`);
    } catch (err) {
      console.error(`Failed to create member ${member.name}:`, err.message);
    }
  }
  console.log('Finished seeding members.');
}

seedMembers();
