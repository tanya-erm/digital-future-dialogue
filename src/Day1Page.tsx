import { useEffect, useRef, useState } from 'react';
import dfdLogo from './dfd-logo.svg';
import DfdGrid from './DfdGrid';

interface Speaker {
  name: string;
  title: string;
}

interface BulletItem {
  term: string;
  description: string;
}

interface Session {
  time: string;
  title: string;
  sectionHeading?: string;
  description?: string;
  organizer?: string;
  host?: Speaker;
  moderator?: Speaker;
  speakers?: Speaker[];
  panelists?: Speaker[];
  bulletItems?: BulletItem[];
  note?: string;
}

interface Part {
  id: string;
  partLabel: string;
  title: string;
  sessions: Session[];
}

const INTRO_SESSIONS: Session[] = [
  {
    time: '08:00 - 09:30',
    title: 'Registration with Coffee, Pastries & Fruits',
  },
  {
    sectionHeading: 'Opening and Welcome Remarks',
    time: '09:30 - 10:00',
    title: 'Opening & Introduction: Welcome Remarks',
    organizer: 'Digital Future Dialogue Organizers',
  },
  {
    time: '10:00 - 10:45',
    title: 'Fireside Chat | Future of The Internet: European Framework and Perspectives',
    description: 'This fireside chat hosted by Peter Wagner will explore how Europe can leverage its position to champion the future of the internet, outlining strategies to push back against the rise of digital authoritarianism and support civil society worldwide. The discussion will examine the future of the internet through the lens of global resilience, highlighting perspectives from the EU and its member states on establishing a European framework.',
    host: { name: 'Peter M. Wagner', title: 'Head of the European Commission\'s Service for Foreign Policy Instruments' },
    speakers: [
      { name: 'Kajsa Ollongren', title: 'EU Special Representative (EUSR) for Human Rights' },
      { name: 'Ulrika Sundberg', title: 'Ambassador, Ministry for Foreign Affairs of Sweden' },
    ],
  },
];

const PROGRAMME: Part[] = [
  {
    id: 'part1',
    partLabel: 'Part 1',
    title: 'Diagnosing The Threat And Community Responses',
    sessions: [
      {
        time: '10:45 - 11:15',
        title: 'Presentation | State of Digital Authoritarianism',
        description: 'The session will begin with an overview of the digital authoritarianism landscape and the global community\'s response. This will be followed by expert-facilitated breakout sessions and structured networking at roundtables, which will cover a variety of thematic and regional areas.',
        speakers: [
          { name: 'Patrick Boehler', title: 'Director, Gazzetta' },
          { name: 'Alena Epifanova', title: 'Research Fellow, The German Council on Foreign Relations (DGAP)' },
        ],
      },
      {
        time: '11:15 - 12:00',
        title: 'Roundtable Conversations | Community Responses to Digital Authoritarianism',
        note: 'Breakout groups led by community organisers from different regions will cover global community responses countering the interconnected tactics and techniques of digital authoritarianism:',
        bulletItems: [
          { term: 'Infrastructure control', description: 'Systematic censorship and network-level blocking that prevents access to global information.' },
          { term: 'Pervasive surveillance', description: 'Monitoring communications and cyber-attacks to identify, deter, and prosecute journalists, civil society, and dissenting voices.' },
          { term: 'Access denial', description: 'Complete internet shutdowns and forced removal of essential tools from app stores and distribution platforms.' },
          { term: 'Algorithmic manipulation', description: 'Shadow-banning and de-amplification of dissent while boosting state-aligned content.' },
          { term: 'Information manipulation', description: 'Coordinated use of social or traditional media to manipulate, shape and influence public debate and policy.' },
          { term: 'AI and language models', description: 'Deliberate and inadvertent influence of state-produced-information feeding language models and shaping the future of the information landscape.' },
        ],
      },
      {
        time: '12:00 - 13:30',
        title: 'Lunch',
      },
    ],
  },
  {
    id: 'part2',
    partLabel: 'Part 2',
    title: 'European Digital Rights Strategy and Social Digital Resilience',
    sessions: [
      {
        time: '13:30 - 14:00',
        title: 'Fireside Chat | Designing Information Resilience for an Age of Information Manipulation',
        description: 'Speakers will discuss the rising risks and challenges from Foreign Information Manipulation and Interference (FIMI) and transnational repression as pillars of digital authoritarianism. The panel will offer a multi-stakeholder approach to deliver impactful and coordinated community responses, developing information resilience against FIMI to protect democratic processes and institutions around the world.',
        moderator: { name: 'Alena Epifanova', title: 'Research Fellow, The German Council on Foreign Relations (DGAP)' },
        speakers: [
          { name: 'Jacob Tamm', title: 'Deputy Head of Division, Information Integrity & Countering Foreign Information Manipulation and Interference, European External Action Service' },
          { name: 'Carlos Hernández-Echevarría', title: 'Associate Director & Head of Public Policy and Institutional Development, Fundación Maldita.es / European Fact Checking Network Representative' },
          { name: 'Viktors Makarovs', title: 'Special Envoy on Digital Affairs at the Ministry of Foreign Affairs of Latvia' },
        ],
      },
      {
        time: '14:00 - 14:30',
        title: 'Fireside Chat | Centering Privacy and Security in The Future of the Internet',
        description: 'Signal started as part of the internet freedom movement to provide resilience against digital authoritarianism. It has now grown into a secure messaging platform used by millions worldwide. This fireside chat will explore Signal\'s history, examine the crucial role of internet freedom technologies amidst rising digital repression, and discuss how Europe can support innovations to support global digital resilience.',
        moderator: { name: 'Trinh Nguyen', title: 'Digital Security Specialist, Digital Defense Fund and Vietnam Rise' },
        speakers: [
          { name: 'Esteve Sanz', title: 'Head of Sector, Internet Governance and Multi-Stakeholder Dialogue, EU Commission' },
          { name: 'Udbhav Tiwari', title: 'VP of Global Strategy, Signal Technology Foundation' },
        ],
      },
      {
        time: '14:30 - 15:30',
        title: 'Panel | Global Social Digital Resilience: Communities On The Ground',
        description: 'The panelists will discuss the past two decades of internet freedom programming, internet governance and communities building the global digital and information resilience against rising threats of digital authoritarianism. The panel will share lessons learnt and offer a holistic and multistakeholder transnational response, grounded in collaboration, resource sharing and a bottom-up approach.',
        moderator: { name: 'Mani Mostofi', title: 'Director, The Miaan Group' },
        panelists: [
          { name: 'Shabnam Aslam', title: 'Executive Director, Outline Foundation' },
          { name: 'Isabela Dias Fernandes', title: 'Executive Director, The Tor Project' },
          { name: 'Alex', title: 'COO/CTO, Meduza' },
          { name: 'Amber Sinha', title: 'Executive Director, European Digital Rights (EDRi)' },
        ],
      },
      {
        time: '15:30 - 16:00',
        title: 'Coffee Break and Networking',
      },
    ],
  },
  {
    id: 'part3',
    partLabel: 'Part 3',
    title: 'The Future of Internet Freedom',
    sessions: [
      {
        time: '16:00 - 17:00',
        title: 'Panel | Future of Internet Freedom: Community Resilience',
        description: 'To counter the global rise of digital authoritarianism, a more strategic approach to digital rights and internet freedom is needed, focusing on strengthening local community capacity as the primary defense. Europe has a unique opportunity to champion this strategy, safeguarding democratic institutions globally and domestically, and defining the future of the internet based on values consistent with existing European values and policies. This panel will explore a multi-stakeholder approach to shaping a new strategy to achieve this future.',
        moderator: { name: 'Holly Kilroy', title: 'Digital Resilience Specialist, Previous Co-founder & Executive Director of Center for Digital Resilience' },
        panelists: [
          { name: 'Peter M. Wagner', title: 'Head of the European Commission\'s Service for Foreign Policy Instruments' },
          { name: 'Laura Cunningham', title: 'President, Open Technology Fund (OTF)' },
          { name: 'Fiona Krakenbürger', title: 'Technical Director, Sovereign Tech Agency' },
        ],
      },
      {
        sectionHeading: 'Closing Remarks and Reception',
        time: '17:00 - 17:15',
        title: 'Closing Remarks',
      },
      {
        time: '17:30 - 20:30',
        title: 'Reception',
      },
    ],
  },
];

function PersonRow({ label, people }: { label: string; people: Speaker[] }) {
  return (
    <div className="person-row">
      <p className="person-label">{label}</p>
      <div className="person-list">
        {people.map((p, i) => (
          <div key={i} className="person-entry">
            <span className="person-name">{p.name}</span>
            {p.title && <span className="person-title">{p.title}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionDetails({ session }: { session: Session }) {
  return (
    <div className="session-details-list">
      {session.organizer && (
        <p className="session-organizer">{session.organizer}</p>
      )}
      {session.host && (
        <PersonRow label="Hosted by" people={[session.host]} />
      )}
      {session.speakers && (
        <PersonRow label="Speakers" people={session.speakers} />
      )}
      {session.moderator && (
        <PersonRow label="Moderator" people={[session.moderator]} />
      )}
      {session.panelists && (
        <PersonRow label="Panelists" people={session.panelists} />
      )}
      {session.description && (
        <p className="session-note">{session.description}</p>
      )}
      {session.note && (
        <p className="session-note">{session.note}</p>
      )}
      {session.bulletItems && (
        <div className="group-grid">
          {session.bulletItems.map((b, i) => (
            <div key={i} className="group-card">
              <span className="group-card-term">{b.term}</span>
              <span className="group-card-desc">{b.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function useIsMobile(breakpoint = 769) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

function SessionBlock({ session, isFirst }: { session: Session; isFirst: boolean }) {
  const hasDetails = session.host || session.moderator || session.speakers || session.panelists || session.bulletItems || session.note || session.description || session.organizer;
  const isAccordion = hasDetails && !!session.description;
  const isMobile = useIsMobile();

  return (
    <div className="session-block">
      {!isFirst && <div className="session-divider" />}
      {session.sectionHeading && (
        <h3 className="section-heading">{session.sectionHeading}</h3>
      )}
      {isAccordion ? (
        <details className="session-accordion" open={isMobile || undefined}>
          <summary className="session-summary">
            <span className="accordion-chevron" />
            <div className="session-header">
              <p className="session-time">{session.time}</p>
              <p className="session-title">{session.title}</p>
            </div>
          </summary>
          <SessionDetails session={session} />
        </details>
      ) : (
        <div className={`session-content${hasDetails ? ' has-details' : ''}`}>
          <div className="session-header">
            <p className="session-time">{session.time}</p>
            <p className="session-title">{session.title}</p>
          </div>
          {hasDetails && <SessionDetails session={session} />}
        </div>
      )}
    </div>
  );
}

function PartBanner({ part }: { part: Part }) {
  return (
    <div id={part.id} className="part-banner">
      <div className="part-banner-content">
        <span className="part-banner-label">{part.partLabel}</span>
        <h2 className="part-banner-title">{part.title}</h2>
      </div>
    </div>
  );
}

export default function Day1() {
  const navRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [activePart, setActivePart] = useState('part1');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' },
    );
    const sentinel = document.getElementById('nav-sentinel');
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ids = PROGRAMME.map(p => p.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActivePart(entry.target.id);
          }
        }
      },
      { threshold: 0, rootMargin: '-120px 0px -60% 0px' },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="day1-page">
      <header className="program-header">
        <div className="program-header-inner">
          <a href="/" className="program-title-link">
            <span className="program-title">Program</span>
          </a>
          <a href="/" className="program-logo-link">
            <img src={dfdLogo} alt="Digital Future Dialogue" className="program-logo" />
          </a>
        </div>
      </header>

      <div id="nav-sentinel" style={{ height: 0 }} />

      <nav
        ref={navRef}
        className="part-nav"
        style={{
          background: stuck ? '#fff' : 'transparent',
          borderBottom: stuck ? '1px solid rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <div className="part-nav-inner">
          {PROGRAMME.map((part, i) => (
            <button
              key={part.id}
              onClick={() => scrollTo(part.id)}
              className="part-pill"
              style={{
                color: activePart === part.id ? '#000' : undefined,
                borderBottom: activePart === part.id ? '2px solid #000' : '2px solid transparent',
              }}
            >
              Part {i + 1}
            </button>
          ))}
        </div>
      </nav>

      <main className="program-main">
        <h2 className="agenda-heading">Agenda</h2>
        {/* Intro sessions before Part 1 */}
        <section className="part-section">
          {INTRO_SESSIONS.map((s, i) => (
            <SessionBlock key={`intro-${i}`} session={s} isFirst={i === 0} />
          ))}
        </section>

        {PROGRAMME.map((part) => (
          <section key={part.id} className="part-section">
            <PartBanner part={part} />
            {part.sessions.map((s, i) => (
              <SessionBlock key={i} session={s} isFirst={i === 0} />
            ))}
          </section>
        ))}
      </main>

      <footer className="program-footer">
        <DfdGrid />
      </footer>
    </div>
  );
}
