export type Portrait = {
  id: string;
  name: string;
  descriptor: string;
  image: string;
  alt: string;
  position?: string;
};

export const portraits: Portrait[] = [
  {
    id: "maya",
    name: "Maya",
    descriptor: "Student. Sister. Neighbor.",
    image: "/images/hero-maya.jpg",
    alt: "Close black-and-white portrait of Maya looking directly at the camera",
    position: "center 42%",
  },
  {
    id: "james",
    name: "James",
    descriptor: "Father. Veteran. Neighbor.",
    image: "/images/portrait-james.jpg",
    alt: "Black-and-white portrait of James looking directly at the camera",
    position: "center 32%",
  },
  {
    id: "lena",
    name: "Lena",
    descriptor: "Grandmother. Mentor. Friend.",
    image: "/images/portrait-lena.jpg",
    alt: "Black-and-white portrait of Lena looking directly at the camera",
    position: "center 34%",
  },
  {
    id: "miguel",
    name: "Miguel",
    descriptor: "Builder. Coach. Neighbor.",
    image: "/images/portrait-miguel.jpg",
    alt: "Black-and-white portrait of Miguel looking directly at the camera",
    position: "center 30%",
  },
];
