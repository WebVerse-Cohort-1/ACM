/* eslint-env node */
const { createClient } = require('@sanity/client');

const token = process.env.SANITY_SECRET_TOKEN || 'skV54iG2FkHj3s5a3QhO1s2cE0aYtN2Z4gC3fJ6u8WbN2pQ3vR9zL1mX9vF4jY5kK8tL2bM1nC8bV4sD3jX8rZ2vK4fN8tP0cV2kF8aL0kZ6xY2cJ5rM1yN6gK1bT5kQ7tP4eW1lF5aM8yV2uN9qR5sC4aB2dH6yP1tR5vF6gM1bW5lC8s';

const client = createClient({
  projectId: '9js05zdy',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
  token: token, 
});

async function migrate() {
    try {
        console.log("Starting Migration...");

        const events = [
            {
                _type: 'event',
                title: "Internship Gap Seminar",
                slug: { _type: 'slug', current: 'internship-gap' },
                dateText: "9 JUL 2026   ONLINE",
                eventDate: "2026-07-09T10:00:00Z",
                category: "SEMINAR",
                desc: "TSEC ACM Student Chapter conducted the online seminar 'Internship Gap: Why Good Students Still Don't Get Selected' led by Ms. Deepti K S (Vendavo). The session offered practical insights into internship recruitment, resume building, LinkedIn optimization, interview preparation, and professional branding.",
                images: ["/assets/events/internship-gap-1.jpeg", "/assets/events/internship-gap-2.jpeg", "/assets/events/internship-gap-3.jpeg", "/assets/events/internship-gap-4.jpeg"],
                speakers: [
                    { name: "Ms. Deepti K S", role: "Speaker", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400", linkedin: "#" }
                ]
            },
            {
                _type: 'event',
                title: "AI Tools Workshop",
                slug: { _type: 'slug', current: 'ai-tools-workshop' },
                dateText: "27 MAR 2026   2 HOURS   CC1 & CC2",
                eventDate: "2026-03-27T09:30:00Z",
                category: "WORKSHOP",
                desc: "The AI Tools Workshop 2026 was organized with the objective of introducing students to the rapidly evolving ecosystem of Artificial Intelligence-powered development tools. The workshop aimed to bridge the gap between theoretical knowledge and practical implementation by providing participants with hands-on exposure to modern AI-assisted workflows.",
                images: ["/assets/events/ai-workshop-1.jpg", "/assets/events/ai-workshop-2.jpg", "/assets/events/ai-workshop-3.jpg"],
                tracks: [
                    { name: "Prompt Engineering", desc: "Familiarize students with prompt engineering and effective interaction with LLMs." },
                    { name: "Web Development", desc: "Enable participants to transform ideas into functional web applications." }
                ],
                speakers: [
                    { name: "Mr. Divij Shah", role: "Speaker", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400", linkedin: "#" }
                ]
            },
            {
                _type: 'event',
                title: "AI Tools Quiz",
                slug: { _type: 'slug', current: 'ai-tools-quiz' },
                dateText: "27 MAR 2026   1 HOUR   CC1 & CC2",
                eventDate: "2026-03-27T11:45:00Z",
                category: "QUIZ",
                desc: "The AI Tools Quiz 2026 was organized as the concluding activity of the AI Tools Workshop. The quiz was designed to evaluate participants' understanding of the concepts, tools, and workflows introduced during the workshop. Through an engaging format, students tested their knowledge of modern AI technologies while reinforcing their practical skills.",
                images: ["/assets/events/ai-quiz-2.jpg", "/assets/events/ai-quiz-3.jpg", "/assets/events/ai-quiz-4.jpg"],
                prizePool: 3300
            },
            {
                _type: 'event',
                title: "DEVSPRINT 2K26",
                slug: { _type: 'slug', current: 'devsprint' },
                dateText: "27 MAR 2026   8.5 HOURS   LAB 12 & 13",
                eventDate: "2026-03-27T08:30:00Z",
                category: "HACKATHON",
                desc: "DevSprint Mini Hackathon was organized by ACM Students Chapter and CodeCrafters with the aim of encouraging innovation, creativity, and practical learning among students. This event provided a platform for participants to think critically, work collaboratively, and develop solutions within a limited time frame addressing real-life issues related to leftover food.",
                images: ["https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200", "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200", "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200"],
                tracks: [
                    { name: "Web Development", desc: "Develop functional applications to redistribute leftover food." }
                ],
                speakers: [
                    { name: "Mrs. Bhagyashri Kakirde", role: "Judge", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400", linkedin: "#" },
                    { name: "Mr. Mayur Mehta", role: "Judge", image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=400", linkedin: "#" }
                ]
            },
            {
                _type: 'event',
                title: "Inauguration Ceremony",
                slug: { _type: 'slug', current: 'inauguration' },
                dateText: "6 MAR 2026   1.5 HOURS   3D THEATRE",
                eventDate: "2026-03-06T10:00:00Z",
                category: "CEREMONY",
                desc: "The Department of Computer Engineering successfully organized the Inauguration Ceremony of the TSEC ACM Student Chapter at the 3D Theatre, marking the beginning of a dynamic and innovation-driven student community.",
                images: ["https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1200", "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1200", "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200"]
            }
        ];

        for (const evt of events) {
            console.log(`Creating event: ${evt.title}`);
            // Check if already exists
            const existing = await client.fetch(`*[_type == "event" && slug.current == $slug][0]`, { slug: evt.slug.current });
            if (existing) {
                 console.log(`Event ${evt.title} already exists! Skipping...`);
            } else {
                 await client.create(evt);
                 console.log(`Created!`);
            }
        }

        console.log("Creating default About data...");
        const defaultAbout = {
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
        const existingAbout = await client.fetch(`*[_type == "about"][0]`);
        if (existingAbout) {
            console.log('About data exists, updating it...');
            await client.patch(existingAbout._id).set(defaultAbout).commit();
            console.log('Updated default About data!');
        } else {
            await client.create(defaultAbout);
            console.log('Created default About data!');
        }

        console.log("Checking Gallery data...");
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
            console.log('Sample gallery created.');
        } else {
            console.log('Gallery data already exists.');
        }

        console.log("Migration completed successfully!");

    } catch (err) {
        console.error("Migration failed: ", err);
    }
}

migrate();
