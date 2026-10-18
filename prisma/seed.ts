import { PrismaClient, type Source, type Stage } from "@prisma/client";

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;

const PEOPLE = [
  "Aarav Sharma", "Priya Nair", "Rohan Mehta", "Ananya Iyer", "Vikram Reddy", "Sneha Kulkarni",
  "Arjun Patel", "Kavya Menon", "Aditya Rao", "Meera Joshi", "Karan Malhotra", "Ishita Banerjee",
  "Siddharth Gupta", "Pooja Hegde", "Rahul Verma", "Divya Pillai", "Nikhil Desai", "Tanvi Shah",
  "Varun Krishnan", "Neha Agarwal", "Harsh Vardhan", "Riya Chatterjee", "Manish Tiwari", "Aditi Bhatt",
  "Yash Saxena", "Shruti Kapoor", "Kunal Bose", "Nandini Rao", "Abhishek Singh", "Lakshmi Narayanan",
  "Gaurav Jain", "Sanya Arora", "Pranav Hegde", "Ritika Das", "Mohit Chauhan", "Swati Mishra",
  "Dev Kumar", "Anjali Sinha", "Omkar Patil", "Zoya Khan",
];

const ROLES: { role: string; skills: string[] }[] = [
  { role: "Frontend Engineer", skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Redux", "Figma"] },
  { role: "Backend Engineer", skills: ["Node.js", "PostgreSQL", "Express", "Redis", "Docker", "Go"] },
  { role: "Full Stack Developer", skills: ["React", "Node.js", "MongoDB", "TypeScript", "AWS", "Prisma"] },
  { role: "Data Analyst", skills: ["SQL", "Python", "Excel", "Tableau", "Power BI", "Statistics"] },
  { role: "Product Designer", skills: ["Figma", "User Research", "Prototyping", "Design Systems", "Illustrator"] },
  { role: "DevOps Engineer", skills: ["Kubernetes", "Terraform", "AWS", "CI/CD", "Linux", "Docker"] },
  { role: "ML Engineer", skills: ["Python", "PyTorch", "LLMs", "SQL", "MLOps", "NLP"] },
];

const SOURCES: Source[] = ["LINKEDIN", "LINKEDIN", "LINKEDIN", "REFERRAL", "REFERRAL", "WEBSITE", "JOB_BOARD", "JOB_BOARD", "OTHER"];
const PIPELINE: Stage[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED"];

const NOTES = [
  "Strong portfolio, good communication in the intro call.",
  "Needs a deeper system design round.",
  "Referred by the platform team lead.",
  "Notice period of 30 days.",
  "Asked about remote-friendly days.",
  "Solid take-home submission, clean code.",
  null,
  null,
];

// Deterministic PRNG so every seed produces the same demo data.
let state = 42;
const rand = () => ((state = (state * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const sample = <T,>(arr: T[], n: number) => [...arr].sort(() => rand() - 0.5).slice(0, n);

// Final-stage distribution: most candidates are still early in the funnel.
function pickFinalStage(): Stage {
  const r = rand();
  if (r < 0.25) return "APPLIED";
  if (r < 0.45) return "SCREENING";
  if (r < 0.62) return "INTERVIEW";
  if (r < 0.72) return "OFFER";
  if (r < 0.84) return "HIRED";
  return "REJECTED";
}

async function main() {
  await prisma.stageHistory.deleteMany();
  await prisma.candidate.deleteMany();

  const now = Date.now();

  for (const [i, name] of PEOPLE.entries()) {
    const { role, skills } = pick(ROLES);
    const finalStage = pickFinalStage();
    const appliedAt = new Date(now - Math.floor(rand() * 56 + 1) * DAY_MS - Math.floor(rand() * 8) * 3600_000);

    // Walk the candidate through the pipeline up to their final stage, spacing moves a few days apart.
    const path: Stage[] =
      finalStage === "REJECTED"
        ? [...PIPELINE.slice(0, 1 + Math.floor(rand() * 3)), "REJECTED"]
        : PIPELINE.slice(0, PIPELINE.indexOf(finalStage) + 1);

    const elapsed = now - appliedAt.getTime();
    const step = Math.min(elapsed / path.length, 6 * DAY_MS);
    let at = appliedAt.getTime();
    const history = path.map((toStage, idx) => {
      if (idx > 0) at += step * (0.6 + rand() * 0.4);
      return { fromStage: idx === 0 ? null : path[idx - 1], toStage, changedAt: new Date(at) };
    });

    const [first, last] = name.toLowerCase().split(" ");
    await prisma.candidate.create({
      data: {
        name,
        email: `${first}.${last}${i % 3 === 0 ? i : ""}@example.com`,
        phone: `+91 9${Math.floor(rand() * 9e8 + 1e8)}`,
        role,
        stage: finalStage,
        source: pick(SOURCES),
        skills: sample(skills, 2 + Math.floor(rand() * 3)),
        rating: rand() < 0.8 ? 1 + Math.floor(rand() * 5) : null,
        notes: pick(NOTES),
        createdAt: appliedAt,
        history: { create: history },
      },
    });
  }

  console.log(`Seeded ${PEOPLE.length} candidates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
