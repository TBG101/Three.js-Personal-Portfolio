import {
  createEarth,
  createJupiter,
  createMars,
  createEris,
  createNeptune,
} from "./planets";

const astronautPath = "./astrov2.glb";
const minY = -5;
const maxY = 475;

/**
 * @type {Array<{id: number,text: string, dialogPosition: {x: number, y: number,z: number}}>}
 * **/
const dialogData = [
  {
    id: 0,
    text: "Welcome to my portfolio! \nI'm Zied Harzallah, a 23-year-old software engineering student at Polytechnique Sousse, Tunisia.",
    dialogPosition: { x: -7.5, y: 0, z: 0 },
  },
  {
    id: 1,
    text: "Passionate about web development, mobile development, and game design, I’m always eager to learn and create.",
    dialogPosition: { x: 7.5, y: 8, z: 0 },
  },
  {
    id: 2,
    text: "I'm currently looking for an internship to improve my skills and gain experience in the field.",
    dialogPosition: { x: -7.5, y: 16, z: 0 },
  },
  {
    id: 3,
    text: "Feel free to explore my projects and contact me if you want to work together!",
    dialogPosition: { x: 7.5, y: 24, z: 0 },
  },
  {
    id: 4,
    text: "These the technologies I've worked with. Click on them to learn more!",
    dialogPosition: { x: -7.5, y: 32, z: 0 },
  },
  {
    id: 5,
    text: "Now for the projects,\n Each planet represents a project I've worked on. Click on them to learn more!",
    dialogPosition: { x: 7.5, y: 60, z: 0 },
  },
  {
    id: 6,
    text: "Strange… this object defies all known designs.\nIt pulses with an unknown energy, almost like… a beacon.\nTouch it and unveil its secrets.",
    dialogPosition: { x: 7.5, y: 462, z: 0 },
  },
];

const techStack = [
  {
    name: "CSS",
    icon: "/models/techstack/css.glb",
  },
  {
    name: "HTML",
    icon: "/models/techstack/html.glb",
  },
  {
    name: "JavaScript",
    icon: "/models/techstack/js.glb",
  },
  {
    name: "Flutter",
    icon: "/models/techstack/flutter.glb",
  },
  {
    name: "React.js",
    icon: "/models/techstack/reactjs.glb",
  },
  {
    name: "Node.js",
    icon: "/models/techstack/nodejs.glb",
  },
  {
    name: "Express.js",
    icon: "/models/techstack/express.glb",
  },
  {
    name: "MongoDB",
    icon: "/models/techstack/mongodb.glb",
  },
  {
    name: "Firebase",
    icon: "/models/techstack/firebase.glb",
  },
  {
    name: "C#",
    icon: "/models/techstack/csharp.glb",
  },
  {
    name: "C++",
    icon: "/models/techstack/cpp.glb",
  },
  {
    name: "Python",
    icon: "/models/techstack/python.glb",
  },
  {
    name: "Java",
    icon: "/models/techstack/java.glb",
  },
  {
    name: "Git",
    icon: "/models/techstack/git.glb",
  },
  {
    name: "Docker",
    icon: "/models/techstack/docker.glb",
  },
  {
    name: "Figma",
    icon: "/models/techstack/figma.glb",
  },
  {
    name: "Blender",
    icon: "/models/techstack/blender.glb",
  },
  {
    name: "Rust",
    icon: "/models/techstack/rust.glb",
  },
  {
    name: "Tailwind",
    icon: "/models/techstack/tailwind.glb",
  },
  {
    name: "Tauri",
    icon: "/models/techstack/tauri.glb",
  },
  {
    name: "PostgresSQL",
    icon: "/models/techstack/PostgresSQL.glb",
  },
  {
    name: "MySQL",
    icon: "/models/techstack/MySQL.glb",
  },
  {
    name: "graphql",
    icon: "/models/techstack/graphql.glb",
  },
];

const techStackDirection = techStack.reduce((acc, tech, index) => {
  acc[index] = {};
  acc[index].direction = Math.random() > 0.5 ? 1 : -1;
  acc[index].randomFactor = Math.random() * 2;
  return acc;
}, []);

const offsetZ = -30;
const planetData = [
  {
    size: 12, 
    position: { x: 35, y: 80, z: offsetZ * 3 },
    name: "3D Portfolio",
    documentSectionEl: document.getElementById("3D Portfolio"),
    createFunction: createEarth,
    tech: ["JavaScript", "Three.js", "GSAP"],
    description:
      "An interactive 3D portfolio showcasing my projects, skills, and experience in a visually immersive way.",
    github: "https://github.com/TBG101/3D-portfolio",
  },
  {
    size: 35, 
    position: { x: -70, y: 140, z: offsetZ * 5 },
    name: "E-commerce Website",
    documentSectionEl: document.getElementById("E-commerce Website"),
    createFunction: createMars,
    tech: ["Next.js", "MongoDB", "Tailwind"],
    description:
      "A full-featured e-commerce platform with secure authentication, product management, and a seamless checkout experience.",
    github: "https://github.com/TBG101/Next.js-E-commerce",
  },
  {
    size: 50, 
    position: { x: 70, y: 220, z: offsetZ * 6 },
    name: "Music Player App",
    documentSectionEl: document.getElementById("Music player app"),
    createFunction: createNeptune, 
    tech: ["Flutter", "FFmpeg"],
    description:
      "A sleek and feature-rich music player app with offline support, YouTube audio downloads, and podcast streaming.",
    github: "https://github.com/TBG101/Music-Player-Android",
  },
  {
    size: 45, 
    position: { x: -60, y: 320, z: offsetZ * 6 },
    name: "PC Remote Control",
    documentSectionEl: document.getElementById("PC Remote Control"),
    createFunction: createJupiter, 
    tech: ["Flutter", "Rust"],
    description:
      "A remote control application that allows users to manage their PC wirelessly using their mobile device with ease.",
    customData: {
      links: [
        {
          title: "View Mobile Repository",
          url: "https://github.com/TBG101/Remote-Desktop-Shutdown",
        },
        {
          title: "View Desktop Repository",
          url: "https://github.com/TBG101/Remote-Desktop-Shutdown-Windows",
        },
      ],
    },
  },
  {
    size: 25, 
    position: { x: 55, y: 400, z: offsetZ * 4 },
    name: "Kick VOD Downloader",
    documentSectionEl: document.getElementById("Kick VOD Downloader"),
    createFunction: createEris,
    tech: ["Flutter", "FFmpeg"],
    description:
      "A powerful tool for downloading and saving video-on-demand content from Kick.com for offline viewing.",
    github: "https://github.com/TBG101/kickdownloader",
  },
];

const sectionCoordinates = [
  {
    minY: 450,
    maxY: maxY,
  },
  {
    minY: 58,
    maxY: 450,
  },
  {
    minY: 30,
    maxY: 58,
  },
  {
    minY: -5,
    maxY: 30,
  },
];

export {
  dialogData,
  astronautPath,
  planetData,
  techStack,
  techStackDirection,
  minY,
  maxY,
  sectionCoordinates,
};
