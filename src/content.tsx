export type DestinationId =
  "about" | "projects" | "skills" | "experience" | "achievements" | "contact";
export interface Destination {
  id: DestinationId;
  title: string;
  place: string;
  icon: string;
  color: string;
  x: number;
  y: number;
  roof: string;
  number: string;
}
export const destinations: Destination[] = [
  {
    id: "about",
    title: "About me",
    place: "The little home",
    icon: "⌂",
    color: "#bf7057",
    x: 232,
    y: 268,
    roof: "red",
    number: "01",
  },
  {
    id: "projects",
    title: "Projects",
    place: "The maker’s lab",
    icon: "⚒",
    color: "#b88650",
    x: 504,
    y: 248,
    roof: "orange",
    number: "02",
  },
  {
    id: "skills",
    title: "Skills",
    place: "The workshop",
    icon: "✦",
    color: "#5b8999",
    x: 792,
    y: 268,
    roof: "blue",
    number: "03",
  },
  {
    id: "experience",
    title: "Experience",
    place: "The story house",
    icon: "▤",
    color: "#8b7597",
    x: 232,
    y: 518,
    roof: "purple",
    number: "04",
  },
  {
    id: "achievements",
    title: "Achievements",
    place: "The trophy lodge",
    icon: "♜",
    color: "#ab9047",
    x: 504,
    y: 518,
    roof: "gold",
    number: "05",
  },
  {
    id: "contact",
    title: "Contact",
    place: "The post office",
    icon: "✉",
    color: "#70956e",
    x: 792,
    y: 518,
    roof: "green",
    number: "06",
  },
];
export const skillGroups: Record<string, string[]> = {
  Languages: ["Python", "JavaScript", "TypeScript", "HTML"],
  Frontend: ["React", "CSS", "Tailwind CSS", "Bootstrap"],
  "Backend & real-time": ["Node.js", "Express.js", "FastAPI", "WebSockets"],
  Databases: ["PostgreSQL", "MongoDB", "Supabase", "Pinecone", "SQL"],
  "AI & machine learning": [
    "NumPy",
    "Pandas",
    "Matplotlib",
    "Scikit-learn",
    "RAG systems",
    "LLMs",
    "Computer vision",
  ],
  "Tools of the trade": [
    "Git",
    "GitHub Actions",
    "Docker",
    "Postman",
    "Figma",
    "Arcjet",
    "Zod",
  ],
};
export interface Project {
  title: string;
  category: string;
  description: string;
  highlights: string[];
  tags: string[];
  url?: string;
}
// Add future projects here; the React portfolio panel renders the collection automatically.
export const projects: Project[] = [
  {
    title: "AgriAssist",
    category: "FULL STACK · AI / ML · AGRICULTURE",
    description:
      "A smarter growing season. An end-to-end agriculture platform bringing AI-driven crop advisory, disease detection, and live IoT insights to farmers.",
    highlights: [
      "7+ microservices connecting a React/Vite PWA, Node/Express, FastAPI, MQTT/Socket.IO, and Prisma/PostgreSQL.",
      "Gemini, Pinecone, and retrieval-augmented generation for crop advice and government scheme recommendations.",
      "An EfficientNet, YOLOv8, and ResNet50 fusion pipeline for leaf disease classification, confidence, severity, and treatment recommendations.",
      "Real-time chat and voice assistance, Twilio/ElevenLabs SMS and call fallback, VAPID push notifications, and Docker/GitHub Actions pipelines with Railway deployment.",
    ],
    tags: ["React", "FastAPI", "Python", "PostgreSQL", "RAG", "IoT"],
  },
];
function Tags({ items }: { items: string[] }) {
  return (
    <div className="tags">
      {items.map((s) => (
        <span key={s}>{s}</span>
      ))}
    </div>
  );
}
export function PortfolioContent({ id }: { id: DestinationId }) {
  if (id === "about")
    return (
      <>
        <span className="section-kicker">THE PERSON BEHIND THE PIXELS</span>
        <h2>
          Hey, I'm Iyyneswaran<span>.</span>
        </h2>
        <p className="lead">
          Full stack developer. AI/ML explorer.
          <br />
          Always building something.
        </p>
        <p>
          I build scalable systems across AI/ML, backend development, and
          real-time applications. I enjoy rapid prototyping, end-to-end product
          execution, and turning an idea into something people can use.
        </p>
        <div className="stat-grid">
          <div>
            <b>10</b>
            <span>Hackathons</span>
          </div>
          <div>
            <b>2</b>
            <span>Podium finishes</span>
          </div>
          <div>
            <b>8.44</b>
            <span>CGPA</span>
          </div>
        </div>
        <h3>A curious path</h3>
        <div className="note-card">
          <b>B.E. Mechanical Engineering · 2023–2027</b>
          <p>
            Sri Sairam Institute of Technology, Chennai
            <br />
            Currently pursuing · CGPA 8.44
          </p>
        </div>
        <p className="muted">
          Higher Secondary · Sharmila Goddess S.M. Matric Hr. Sec School,
          Mayiladuthurai · 91.5%
        </p>
        <Tags items={["English · Professional", "Tamil · Native"]} />
        <a className="primary-button" href="/Iyyneswaran-Resume.pdf" download>
          Take my resume with you <span>↓</span>
        </a>
      </>
    );
  if (id === "projects")
    return (
      <>
        <span className="section-kicker">IDEAS OUT IN THE WILD</span>
        <h2>
          Things I've built<span>.</span>
        </h2>
        <p>From a first idea to the last deployment.</p>
        {projects.map((p) => (
          <article className="project-card" key={p.title}>
            <div className="project-art">
              <span className="pixel-sprout">♧</span>
              <strong>AGRI / ASSIST</strong>
              <small>GROWING BETTER WITH INTELLIGENCE</small>
            </div>
            <div className="project-body">
              <span className="section-kicker">{p.category}</span>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <Tags items={p.tags} />
              <details>
                <summary>
                  Explore the build <span>+</span>
                </summary>
                <ul>
                  {p.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </details>
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer">
                  View project ↗
                </a>
              )}
            </div>
          </article>
        ))}
        <div className="coming-soon">
          <span>✧</span>
          <p>
            <b>There's more growing here.</b>
            <br />
            More projects will join the village soon.
          </p>
        </div>
        <a
          className="external-link"
          href="https://github.com/iyyneswaran"
          target="_blank"
          rel="noreferrer"
        >
          Explore my GitHub ↗
        </a>
      </>
    );
  if (id === "skills")
    return (
      <>
        <span className="section-kicker">MY DEVELOPER TOOLBOX</span>
        <h2>
          Equipped to build<span>.</span>
        </h2>
        <p>A mix of engineering fundamentals and hands-on curiosity.</p>
        <div className="skill-groups">
          {Object.entries(skillGroups).map(([title, items], i) => (
            <section key={title}>
              <h3>
                <span>0{i + 1}</span>
                {title}
              </h3>
              <Tags items={items} />
            </section>
          ))}
        </div>
      </>
    );
  if (id === "experience")
    return (
      <>
        <span className="section-kicker">LEARNING BY DOING</span>
        <h2>
          The journey so far<span>.</span>
        </h2>
        <div className="timeline">
          <article>
            <span className="section-kicker">INTERNSHIP · 15 DAYS</span>
            <h3>AI / Data Science Intern</h3>
            <b>BIG-SI-BUCKS INNOVATION PRIVATE LIMITED</b>
            <p>
              Built a Smart Agriculture System, applying machine learning to
              agricultural decision support. Worked across data preparation,
              model training, evaluation, and result interpretation.
            </p>
            <p className="muted">
              Linear Regression for yield prediction; Logistic Regression and
              Random Forest for disease detection; KNN for farm recommendations;
              Decision Trees for crop selection; K-Means for soil clustering;
              PCA for sensor features.
            </p>
          </article>
          <article>
            <span className="section-kicker">LEADERSHIP & COMMUNITY</span>
            <h3>IEEE Student Branch Office Bearer</h3>
            <p>
              Contributing to technical initiatives and event execution. IEEE
              MAGIC Communicator and IEEE RAS MAGIC Mastermind member.
            </p>
            <p>Organized IEEE Day and co-organized a 14-hour hackathon.</p>
          </article>
        </div>
      </>
    );
  if (id === "achievements")
    return (
      <>
        <span className="section-kicker">LITTLE MILESTONES, BIG MEMORIES</span>
        <h2>
          A few proud moments<span>.</span>
        </h2>
        {[
          {
            icon: "♜",
            small: "FIRST PRIZE · ₹50,000",
            title: "A national-level win",
            text: "Sir M Visvesvaraya Institute of Technology, Bangalore",
          },
          {
            icon: "✦",
            small: "THIRD PRIZE",
            title: "VIT Chennai Hackathon",
            text: "Building under pressure. Learning with a team.",
          },
          {
            icon: "❋",
            small: "IEEE · 2025",
            title: "Best Student Volunteer Award",
            text: "IEEE Student Branch · College Level",
          },
        ].map((a) => (
          <div className="award-card" key={a.title}>
            <span className="award-icon">{a.icon}</span>
            <div>
              <small>{a.small}</small>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </div>
          </div>
        ))}
        <div className="note-card">
          <b>10 hackathons. Countless lessons.</b>
          <p>
            Rapid prototyping, collaborative problem-solving, and turning tight
            deadlines into working products.
          </p>
        </div>
      </>
    );
  return (
    <>
      <span className="section-kicker">GOOD IDEAS START WITH A HELLO</span>
      <h2>
        Let's build something<span>.</span>
      </h2>
      <p className="lead">
        Have a project, an opportunity,
        <br />
        or just a good story?
      </p>
      {[
        {
          icon: "✉",
          label: "DROP A LETTER",
          text: "iyyneswaranp@gmail.com",
          url: "mailto:iyyneswaranp@gmail.com",
        },
        {
          icon: "in",
          label: "LET'S CONNECT",
          text: "LinkedIn / iyyneswaran07",
          url: "https://www.linkedin.com/in/iyyneswaran07",
        },
        {
          icon: "⌘",
          label: "FOLLOW THE BUILDS",
          text: "GitHub / iyyneswaran",
          url: "https://github.com/iyyneswaran",
        },
        {
          icon: "☎",
          label: "SAY HELLO",
          text: "+91 90425 24161",
          url: "tel:+919042524161",
        },
      ].map((c) => (
        <a
          className="contact-item"
          href={c.url}
          key={c.label}
          target={c.url.startsWith("https") ? "_blank" : undefined}
          rel="noreferrer"
        >
          <span>{c.icon}</span>
          <div>
            <small>{c.label}</small>
            <b>{c.text}</b>
          </div>
          <span>↗</span>
        </a>
      ))}
      <p className="muted">
        Thanks for wandering through my little corner of the internet. See you
        around the village!
      </p>
    </>
  );
}
