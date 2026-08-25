require('dotenv').config({ path: '../app/.env' });
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID || '1y06w0n1',
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2023-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN
});

const defaultAbout = {
  _id: 'drafts.siteAbout',
  _type: 'about',
  whatIsAcm: 'The TSEC ACM Student Chapter at Thakur Shyamnarayan Engineering College is a dynamic student-driven community committed to fostering technical excellence, innovation, and holistic student development.',
  vision: 'To build a future-ready community of innovators who leverage computing to solve real-world problems.',
  mission: '1. To cultivate critical thinking through hands-on learning.\n2. To promote innovation and research.\n3. To nurture leadership and teamwork.\n4. To create a strong tech community.',
  benefits: '1. Access to ACM Digital Library\n2. Networking opportunities\n3. Hands-on workshops',
  eventsConducted: 'Over 50+ workshops, hackathons, and seminars conducted since inception.',
  stats: [
    { _key: 'stat1', label: 'MEMBERS', value: 500 },
    { _key: 'stat2', label: 'EVENTS', value: 30 },
    { _key: 'stat3', label: 'AWARDS', value: 10 }
  ],
  legacyLogs: [
    { _key: 'log1', year: '2025', title: 'National Apex', desc: 'Awarded Best Student Chapter nationwide.' },
    { _key: 'log2', year: '2023', title: 'Source Code', desc: 'Launched open-source initiative with 500+ PRs.' }
  ]
};

async function seedData() {
  try {
    // Check if about already exists
    const existing = await client.fetch(`*[_type == "about"][0]`);
    if (existing) {
      console.log('About data already exists. Updating...');
      await client.patch(existing._id).set(defaultAbout).commit();
      console.log('Updated.');
    } else {
      console.log('Creating new about data...');
      await client.create(defaultAbout);
      console.log('Created.');
    }

    // Seed some gallery items if none exist
    const galleries = await client.fetch(`*[_type == "gallery"]`);
    if (galleries.length === 0) {
       console.log('Creating sample gallery items...');
       await client.create({
         _type: 'gallery',
         title: 'TechFest 2023',
         date: '2023-10-15',
         description: 'A glimpse of our annual tech festival.',
         tags: ['Hackathon', 'Workshop']
       });
       console.log('Gallery item created. Note: Add images manually in studio.');
    } else {
       console.log('Gallery items already exist.');
    }
    
    console.log('Seeding complete!');
  } catch (err) {
    console.error('Error seeding data:', err.message);
  }
}

seedData();
